#!/usr/bin/env bash
#
# Negative-path validation + authentication + authorization tests
#
# WHAT THIS PROVES:
#
# 1. Validation:
#    Invalid requests should be rejected with 400.
#
# 2. Authentication:
#    Requests with invalid credentials/tokens should be rejected with 401.
#
# 3. Authorization:
#    Authenticated users without sufficient privileges should be rejected
#    with 403.
#
# 4. SQL injection resistance:
#    SQL-injection-shaped values should be treated as literal values rather
#    than executable SQL.
#
# If any of these return an unexpected 2xx/5xx response, investigate:
#
#   2xx = security/validation rule may not be enforced
#   400 = malformed/invalid request
#   401 = authentication required/failed
#   403 = authenticated but not authorized
#   404 = resource does not exist
#   5xx = server-side bug/crash
#
# ---------------------------------------------------------------------------
# SETUP
# ---------------------------------------------------------------------------
#
#   BASE_URL                       API base URL (default: https://localhost)
#   TEST_TASK_ID                   an existing task ID, for updateTask tests
#   TEST_CONVERSATION_ID           an existing conversation ID, for sendMessage tests
#
# ADMIN_TOKEN / USER_TOKEN are fetched for you - no manual curl/login needed.
# Pass a mode as the script's first arg to control which one gets prompted:
#
#   none   (default)  - no prompt; only unauthenticated tests run, rest skipped
#   admin              - prompt for admin email/password, fetch ADMIN_TOKEN
#   user               - prompt for user email/password, fetch USER_TOKEN
#
# (If ADMIN_TOKEN/USER_TOKEN are already set as env vars, those are used as-is
# and prompting is skipped regardless of mode.)
#
# RUN WITH `source`, NOT `./` - a plain ./test_validation.sh runs in a
# subshell, so its `export`s vanish when the script exits and your shell
# never sees ADMIN_TOKEN/USER_TOKEN. `source` runs it in your current shell
# so the tokens stick around afterward too.
#
# USAGE:
#   chmod +x test_validation.sh
#   source ./test_validation.sh          # 1st run: no tokens
#   source ./test_validation.sh admin    # 2nd run: admin token only
#   source ./test_validation.sh user     # 3rd run: user token only
# ---------------------------------------------------------------------------

set -u

BASE_URL="${BASE_URL:-https://localhost}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
USER_TOKEN="${USER_TOKEN:-}"

# Defaults - override by exporting before running, e.g.:
#   export TEST_TASK_ID="566f757c-9d40-4ed7-b58f-f119451f78ed"
#   export TEST_CONVERSATION_ID="aded0bf5-ecb8-4bf4-8d29-91b1a0915941"
TEST_TASK_ID="${TEST_TASK_ID:-566f757c-9d40-4ed7-b58f-f119451f78ed}"
TEST_CONVERSATION_ID="${TEST_CONVERSATION_ID:-aded0bf5-ecb8-4bf4-8d29-91b1a0915941}"

# ---------------------------------------------------------------------------
# COLORS (auto-disabled when output isn't a terminal, e.g. piped to a file)
# ---------------------------------------------------------------------------

if [ -t 1 ]; then
    COLOR_GREEN='\033[0;32m'
    COLOR_RED='\033[0;31m'
    COLOR_YELLOW='\033[1;33m'
    COLOR_RESET='\033[0m'
else
    COLOR_GREEN=''
    COLOR_RED=''
    COLOR_YELLOW=''
    COLOR_RESET=''
fi

section_header() {
    printf "\n==================================================\n${COLOR_YELLOW}%s${COLOR_RESET}\n==================================================\n" "$1"
}

# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------

LOGIN_ROUTE="/api/auth/login"
GOOGLE_ROUTE="/api/auth/google"

CREATE_USER_ROUTE="/api/users"
UPDATE_PROFILE_ROUTE="/api/users/me"
UPDATE_STATUS_ROUTE="/api/users/status"
CHANGE_PASSWORD_ROUTE="/api/users/change-password"

UPDATE_USER_ROUTE_TEMPLATE="/api/users/{ID}"
RESET_PASSWORD_ROUTE_TEMPLATE="/api/users/{ID}/reset-password"


MEETINGS_ROUTE="/api/meetings"
SYNC_PARTICIPANTS_ROUTE="/api/meetings/participants"

CREATE_TASK_ROUTE="/api/tasks"
UPDATE_TASK_ROUTE_TEMPLATE="/api/tasks/{ID}"

CREATE_DIRECT_ROUTE="/api/messages/direct"
CREATE_GROUP_ROUTE="/api/messages/group"

# ---------------------------------------------------------------------------
# TEST COUNTERS
# ---------------------------------------------------------------------------

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
TOTAL_COUNT=0

# ---------------------------------------------------------------------------
# CLEANUP
# ---------------------------------------------------------------------------

BODY_FILE="/tmp/negtest_body"
TOKEN_FILE="/tmp/negtest_login_body"

cleanup() {
    rm -f "$BODY_FILE" "$TOKEN_FILE"
}

trap cleanup EXIT

# ---------------------------------------------------------------------------
# URL ENCODING
# ---------------------------------------------------------------------------

urlencode() {
    local string="${1}"
    local strlen=${#string}
    local encoded="" pos c o

    for (( pos=0 ; pos<strlen ; pos++ )); do
        c=${string:$pos:1}

        case "$c" in
            [-_.~a-zA-Z0-9])
                o="${c}"
                ;;
            *)
                printf -v o '%%%02x' "'${c}"
                ;;
        esac

        encoded+="${o}"
    done

    printf '%s' "${encoded}"
}

# ---------------------------------------------------------------------------
# TOKEN FETCHING
# ---------------------------------------------------------------------------
#
# Prompts for an account's email + password, logs in, and extracts the JWT
# from the response JSON. Works whether or not `jq` is installed.
#
# Usage:
#   ADMIN_TOKEN="$(fetch_token "admin")"
#   USER_TOKEN="$(fetch_token "regular user")"

extract_token() {
    # Reads JSON body from stdin, prints the token field's value.
    # Tries jq first (most reliable), falls back to grep/sed.
    local json
    json="$(cat)"

    if command -v jq >/dev/null 2>&1; then
        local tok
        tok="$(printf '%s' "$json" | jq -r '.token // .accessToken // .jwt // .data.token // empty' 2>/dev/null)"
        if [ -n "$tok" ] && [ "$tok" != "null" ]; then
            printf '%s' "$tok"
            return 0
        fi
    fi

    # Fallback: grab the value of the first key matching token/accessToken/jwt
    printf '%s' "$json" \
        | grep -o '"\(token\|accessToken\|jwt\)"[[:space:]]*:[[:space:]]*"[^"]*"' \
        | head -n1 \
        | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/'
}

fetch_token() {
    local label="$1"
    local email password status body token

    echo "" >&2
    echo "-- Login as $label --" >&2
    read -r -p "  Email: " email
    read -r -s -p "  Password: " password
    echo "" >&2

    status=$(curl \
        -s \
        -k \
        -o "$TOKEN_FILE" \
        -w "%{http_code}" \
        --connect-timeout 5 \
        --max-time 15 \
        -X POST "$BASE_URL$LOGIN_ROUTE" \
        -H "Content-Type: application/json" \
        -d "{\"userEmail\":\"${email}\",\"userPassword\":\"${password}\"}")

    unset password

    body="$(cat "$TOKEN_FILE" 2>/dev/null || true)"

    if [ "$status" != "200" ] && [ "$status" != "201" ]; then
        echo "  Login failed for $label (HTTP $status)." >&2
        echo "  body: ${body:0:300}" >&2
        return 1
    fi

    token="$(printf '%s' "$body" | extract_token)"

    if [ -z "$token" ]; then
        echo "  Login succeeded but no token field was found in the response." >&2
        echo "  body: ${body:0:300}" >&2
        return 1
    fi

    echo "  Got token for $label." >&2
    printf '%s' "$token"
    return 0
}

# ---------------------------------------------------------------------------
# MODE - which token (if any) to prompt for, from the script's first arg
# ---------------------------------------------------------------------------

MODE="${1:-none}"

case "$MODE" in
    none)
        # No prompts. Uses whatever ADMIN_TOKEN/USER_TOKEN are already set
        # in the environment (often none), so only unauthenticated tests
        # will run - the rest are skipped.
        ;;
    admin)
        if [ -z "$ADMIN_TOKEN" ]; then
            if ADMIN_TOKEN="$(fetch_token "admin")"; then
                export ADMIN_TOKEN
            else
                echo "Proceeding without ADMIN_TOKEN - admin-only tests will be skipped." >&2
                ADMIN_TOKEN=""
            fi
        fi
        ;;
    user)
        if [ -z "$USER_TOKEN" ]; then
            if USER_TOKEN="$(fetch_token "regular user")"; then
                export USER_TOKEN
            else
                echo "Proceeding without USER_TOKEN - user-auth tests will be skipped." >&2
                USER_TOKEN=""
            fi
        fi
        ;;
    *)
        echo "Unknown mode: '$MODE'. Use one of: none, admin, user" >&2
        return 1 2>/dev/null || exit 1
        ;;
esac

# ---------------------------------------------------------------------------
# TEST RUNNER
# ---------------------------------------------------------------------------

run_test() {
    local description="$1"
    local expected="$2"

    shift 2

    rm -f "$BODY_FILE"

    TOTAL_COUNT=$((TOTAL_COUNT + 1))

    local status
    status=$(curl \
        -s \
        -k \
        -o "$BODY_FILE" \
        -w "%{http_code}" \
        --connect-timeout 5 \
        --max-time 15 \
        "$@")

    local body
    body=$(cat "$BODY_FILE" 2>/dev/null || true)

    if [ "$status" = "000" ]; then
        printf "${COLOR_RED}FAIL${COLOR_RESET}  [curl failed to connect/send] %s\n" "$description"
        echo "      This usually means the server is unreachable or the URL is invalid."
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return
    fi

    if [ "$status" = "$expected" ]; then
        printf "${COLOR_GREEN}PASS${COLOR_RESET}  [%s] %s\n" "$status" "$description"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        printf "${COLOR_RED}FAIL${COLOR_RESET}  [got %s, expected %s] %s\n" "$status" "$expected" "$description"

        if [ -n "$body" ]; then
            echo "      body: ${body:0:500}"
        fi

        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

# ---------------------------------------------------------------------------
# SKIPPED TEST
# ---------------------------------------------------------------------------

skip_test() {
    echo "SKIP  $1"
    SKIP_COUNT=$((SKIP_COUNT + 1))
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
}

# ---------------------------------------------------------------------------
# AUTH HEADERS
# ---------------------------------------------------------------------------

admin_auth_header() {
    printf '%s' "Authorization: Bearer $ADMIN_TOKEN"
}

user_auth_header() {
    printf '%s' "Authorization: Bearer $USER_TOKEN"
}

section_header "AUTH — /auth/login"

run_test "empty body" 400 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{}'

run_test "missing password" 400 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{"userEmail":"a@b.com"}'

run_test "missing email" 400 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{"userPassword":"whatever123"}'

run_test "malformed email (no @)" 400 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{"userEmail":"notanemail","userPassword":"whatever123"}'

run_test "malformed email (no domain)" 400 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{"userEmail":"a@b","userPassword":"whatever123"}'

# This intentionally expects 401 rather than 400.
# The email is lookup-only and is not stored/rendered by this endpoint.
run_test "XSS-shaped email (expect 401 — no matching user)" 401 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{"userEmail":"<script>alert(1)</script>@x.com","userPassword":"whatever123"}'

run_test "SQL-injection-shaped email" 400 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d "{\"userEmail\":\"' OR 1=1--@x.com\",\"userPassword\":\"whatever123\"}"

run_test "oversized password (300 chars)" 400 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d "{\"userEmail\":\"a@b.com\",\"userPassword\":\"$(printf 'a%.0s' {1..300})\"}"

run_test "wrong types (numbers instead of strings)" 400 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{"userEmail":12345,"userPassword":67890}'

run_test "wrong password for valid-format email" 401 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{"userEmail":"clearly-fake-test-account@example.com","userPassword":"DefinitelyWrongPassword123!"}'

run_test "nonexistent user" 401 \
    -X POST "$BASE_URL$LOGIN_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{"userEmail":"does-not-exist-987654321@test.com","userPassword":"Whatever123!"}'

section_header "AUTH — /auth/google"

run_test "empty body" 400 \
    -X POST "$BASE_URL$GOOGLE_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{}'

run_test "oversized idToken (5000 chars)" 400 \
    -X POST "$BASE_URL$GOOGLE_ROUTE" \
    -H "Content-Type: application/json" \
    -d "{\"idToken\":\"$(printf 'a%.0s' {1..5000})\"}"

run_test "Google idToken wrong type" 400 \
    -X POST "$BASE_URL$GOOGLE_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{"idToken":12345}'

section_header "ADMIN — createUser"

if [ -z "$ADMIN_TOKEN" ]; then

    skip_test "createUser: empty body"
    skip_test "createUser: missing name"
    skip_test "createUser: malformed email"
    skip_test "createUser: XSS in name"
    skip_test "createUser: oversized name"
    skip_test "createUser: SQL-injection-shaped roleId"
    skip_test "createUser: weak password"

else

    AUTH_HEADER="$(admin_auth_header)"

    run_test "createUser: empty body" 400 \
        -X POST "$BASE_URL$CREATE_USER_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{}'

    run_test "createUser: missing name" 400 \
        -X POST "$BASE_URL$CREATE_USER_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"email":"newuser@test.com","roleId":"role123"}'

    run_test "createUser: malformed email" 400 \
        -X POST "$BASE_URL$CREATE_USER_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"email":"notanemail","name":"Test User","roleId":"role123"}'

    run_test "createUser: XSS in name" 400 \
        -X POST "$BASE_URL$CREATE_USER_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"email":"newuser@test.com","name":"<img src=x onerror=alert(1)>","roleId":"role123"}'

    run_test "createUser: oversized name (150 chars)" 400 \
        -X POST "$BASE_URL$CREATE_USER_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"newuser@test.com\",\"name\":\"$(printf 'a%.0s' {1..150})\",\"roleId\":\"role123\"}"

    run_test "createUser: SQL-injection-shaped roleId" 400 \
        -X POST "$BASE_URL$CREATE_USER_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"newuser@test.com\",\"name\":\"Test User\",\"roleId\":\"'; DROP TABLE users;--\"}"

    run_test "createUser: weak password" 400 \
        -X POST "$BASE_URL$CREATE_USER_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"email":"newuser@test.com","name":"Test User","roleId":"role123","password":"123"}'

fi

section_header "USER — updateCurrentUser / profile"

if [ -z "$USER_TOKEN" ]; then

    skip_test "updateProfile: no fields"
    skip_test "updateProfile: malformed email"
    skip_test "updateProfile: XSS in city"
    skip_test "updateProfile: city wrong type"

else

    AUTH_HEADER="$(user_auth_header)"

    run_test "updateProfile: no fields sent" 400 \
        -X PATCH "$BASE_URL$UPDATE_PROFILE_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{}'

    run_test "updateProfile: malformed email" 400 \
        -X PATCH "$BASE_URL$UPDATE_PROFILE_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"userEmail":"not-an-email"}'

    run_test "updateProfile: XSS in city" 400 \
        -X PATCH "$BASE_URL$UPDATE_PROFILE_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"city":"<script>document.cookie</script>"}'

    run_test "updateProfile: city wrong type" 400 \
        -X PATCH "$BASE_URL$UPDATE_PROFILE_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"city":12345}'

fi

section_header "USER — status update"

if [ -z "$USER_TOKEN" ]; then

    skip_test "updateStatus: empty"
    skip_test "updateStatus: invalid value"
    skip_test "updateStatus: wrong type"

else

    AUTH_HEADER="$(user_auth_header)"

    run_test "updateStatus: empty body" 400 \
        -X PATCH "$BASE_URL$UPDATE_STATUS_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{}'

    run_test "updateStatus: invalid value" 400 \
        -X PATCH "$BASE_URL$UPDATE_STATUS_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"status":"hacked"}'

    run_test "updateStatus: wrong type" 400 \
        -X PATCH "$BASE_URL$UPDATE_STATUS_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"status":12345}'

fi

section_header "USER — change-password"

if [ -z "$USER_TOKEN" ]; then

    skip_test "changePassword: missing oldPassword"
    skip_test "changePassword: weak newPassword"
    skip_test "changePassword: wrong password types"

else

    AUTH_HEADER="$(user_auth_header)"

    run_test "changePassword: missing oldPassword" 400 \
        -X POST "$BASE_URL$CHANGE_PASSWORD_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"newPassword":"SomethingStrong1!"}'

    run_test "changePassword: weak newPassword" 400 \
        -X POST "$BASE_URL$CHANGE_PASSWORD_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"oldPassword":"whatever","newPassword":"123"}'

    run_test "changePassword: wrong password types" 400 \
        -X POST "$BASE_URL$CHANGE_PASSWORD_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"oldPassword":12345,"newPassword":67890}'

fi

section_header "AUTHENTICATION — protected endpoints"

run_test "protected profile endpoint: no Authorization header" 401 \
    -X PUT "$BASE_URL$UPDATE_PROFILE_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{}'

run_test "protected status endpoint: no Authorization header" 401 \
    -X PATCH "$BASE_URL$UPDATE_STATUS_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{}'

run_test "protected change-password endpoint: no Authorization header" 401 \
    -X POST "$BASE_URL$CHANGE_PASSWORD_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{}'

run_test "protected profile endpoint: invalid JWT" 401 \
    -X PUT "$BASE_URL$UPDATE_PROFILE_ROUTE" \
    -H "Authorization: Bearer definitely-not-a-real-jwt" \
    -H "Content-Type: application/json" \
    -d '{}'

section_header "AUTHORIZATION — admin-only endpoints"

if [ -z "$USER_TOKEN" ]; then


    skip_test "normal user cannot createUser"
    skip_test "normal user cannot update another user"
    skip_test "normal user cannot reset another user's password"

else

    USER_AUTH_HEADER="$(user_auth_header)"

    run_test "normal user cannot createUser (expect 403)" 403 \
        -X POST "$BASE_URL$CREATE_USER_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"email":"unauthorized@test.com","name":"Unauthorized User","roleId":"role123"}'

    # Fake ID so we don't accidentally modify a real account.
    AUTHZ_BAD_ID_RAW="00000000-0000-0000-0000-000000000000"
    AUTHZ_BAD_ID="$(urlencode "$AUTHZ_BAD_ID_RAW")"

    run_test "normal user cannot update another user (expect 403)" 403 \
        -X PATCH "$BASE_URL${UPDATE_USER_ROUTE_TEMPLATE/\{ID\}/$AUTHZ_BAD_ID}" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"name":"Unauthorized Change"}'

    run_test "normal user cannot reset another user's password (expect 403)" 403 \
        -X POST "$BASE_URL${RESET_PASSWORD_ROUTE_TEMPLATE/\{ID\}/$AUTHZ_BAD_ID}" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"newPassword":"SomethingStrong1!"}'

fi

section_header "USER — SQL-injection-shaped route param IDs"

if [ -z "$ADMIN_TOKEN" ]; then

    skip_test "updateUser: SQL-injection-shaped :id"
    skip_test "resetPassword: SQL-injection-shaped :id"

else

    AUTH_HEADER="$(admin_auth_header)"

    BAD_ID_RAW="'; DROP TABLE users;--"
    BAD_ID="$(urlencode "$BAD_ID_RAW")"

    run_test \
        "updateUser: SQL-injection-shaped :id (expect 404 — safely treated as literal)" \
        404 \
        -X PUT "$BASE_URL${UPDATE_USER_ROUTE_TEMPLATE/\{ID\}/$BAD_ID}" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test"}'

    run_test \
        "resetPassword: SQL-injection-shaped :id (expect 404 — safely treated as literal)" \
        404 \
        -X POST "$BASE_URL${RESET_PASSWORD_ROUTE_TEMPLATE/\{ID\}/$BAD_ID}" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"newPassword":"SomethingStrong1!"}'

fi


section_header "MEETINGS — createMeeting"

if [ -z "$USER_TOKEN" ]; then

    skip_test "createMeeting: empty body (missing spaceId)"
    skip_test "createMeeting: missing meetTitle"
    skip_test "createMeeting: oversized meetTitle (61 chars)"
    skip_test "createMeeting: XSS in meetTitle"
    skip_test "createMeeting: XSS in meetDesc"
    skip_test "createMeeting: SQL-injection-shaped spaceId"
    skip_test "createMeeting: malformed date"
    skip_test "createMeeting: end time before start time"

else

    USER_AUTH_HEADER="$(user_auth_header)"

    run_test "createMeeting: empty body (missing spaceId)" 400 \
        -X POST "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{}'

    run_test "createMeeting: missing meetTitle" 400 \
        -X POST "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "spaceId":"11111111-1111-4111-8111-111111111111",
            "meetStart":"2026-01-01T10:00:00Z",
            "meetEnd":"2026-01-01T11:00:00Z"
        }'

    run_test "createMeeting: oversized meetTitle (61 chars)" 400 \
        -X POST "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"spaceId\":\"11111111-1111-4111-8111-111111111111\",
            \"meetTitle\":\"$(printf 'a%.0s' {1..61})\",
            \"meetStart\":\"2026-01-01T10:00:00Z\",
            \"meetEnd\":\"2026-01-01T11:00:00Z\"
        }"

    run_test "createMeeting: XSS in meetTitle" 400 \
        -X POST "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "spaceId":"11111111-1111-4111-8111-111111111111",
            "meetTitle":"<script>alert(1)</script>",
            "meetStart":"2026-01-01T10:00:00Z",
            "meetEnd":"2026-01-01T11:00:00Z"
        }'

    run_test "createMeeting: XSS in meetDesc" 400 \
        -X POST "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "spaceId":"11111111-1111-4111-8111-111111111111",
            "meetTitle":"Standup",
            "meetDesc":"<img src=x onerror=alert(1)>",
            "meetStart":"2026-01-01T10:00:00Z",
            "meetEnd":"2026-01-01T11:00:00Z"
        }'

    run_test "createMeeting: SQL-injection-shaped spaceId (expect 400)" 400 \
        -X POST "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"spaceId\":\"'; DROP TABLE meetings;--\",
            \"meetTitle\":\"Standup\",
            \"meetStart\":\"2026-01-01T10:00:00Z\",
            \"meetEnd\":\"2026-01-01T11:00:00Z\"
        }"

    run_test "createMeeting: malformed date" 400 \
        -X POST "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "spaceId":"11111111-1111-4111-8111-111111111111",
            "meetTitle":"Standup",
            "meetStart":"not-a-date",
            "meetEnd":"also-not-a-date"
        }'

    run_test "createMeeting: end time before start time" 400 \
        -X POST "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "spaceId":"11111111-1111-4111-8111-111111111111",
            "meetTitle":"Standup",
            "meetStart":"2026-01-01T11:00:00Z",
            "meetEnd":"2026-01-01T10:00:00Z"
        }'

fi

section_header "MEETINGS — updateMeeting"

if [ -z "$USER_TOKEN" ]; then

    skip_test "updateMeeting: oversized meetTitle"
    skip_test "updateMeeting: XSS in meetTitle"
    skip_test "updateMeeting: XSS in meetDesc"
    skip_test "updateMeeting: malformed date"

else

    USER_AUTH_HEADER="$(user_auth_header)"

    run_test "updateMeeting: oversized meetTitle (61 chars)" 400 \
        -X PATCH "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"meetId\":\"11111111-1111-4111-8111-111111111111\",
            \"meetTitle\":\"$(printf 'a%.0s' {1..61})\"
        }"

    run_test "updateMeeting: XSS in meetTitle" 400 \
        -X PATCH "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "meetId":"11111111-1111-4111-8111-111111111111",
            "meetTitle":"<script>alert(1)</script>"
        }'

    run_test "updateMeeting: XSS in meetDesc" 400 \
        -X PATCH "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "meetId":"11111111-1111-4111-8111-111111111111",
            "meetTitle":"Standup",
            "meetDesc":"<img src=x onerror=alert(1)>"
        }'

    run_test "updateMeeting: malformed date" 400 \
        -X PATCH "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "meetId":"11111111-1111-4111-8111-111111111111",
            "meetTitle":"Standup",
            "meetStart":"not-a-date",
            "meetEnd":"also-not-a-date"
        }'

fi

section_header "MEETINGS — syncParticipants"

if [ -z "$USER_TOKEN" ]; then

    skip_test "syncParticipants: missing meetId"
    skip_test "syncParticipants: participants not an array"
    skip_test "syncParticipants: participant with SQL-injection-shaped userId"
    skip_test "syncParticipants: invalid role enum value"

else

    USER_AUTH_HEADER="$(user_auth_header)"

    run_test "syncParticipants: missing meetId" 400 \
        -X PATCH "$BASE_URL$SYNC_PARTICIPANTS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "participants":[{"userId":"11111111-1111-4111-8111-111111111111"}]
        }'

    run_test "syncParticipants: participants not an array" 400 \
        -X PATCH "$BASE_URL$SYNC_PARTICIPANTS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "meetId":"11111111-1111-4111-8111-111111111111",
            "participants":"not-an-array"
        }'

    run_test "syncParticipants: SQL-injection-shaped participant userId" 400 \
        -X PATCH "$BASE_URL$SYNC_PARTICIPANTS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"meetId\":\"11111111-1111-4111-8111-111111111111\",
            \"participants\":[{\"userId\":\"'; DROP TABLE users;--\"}]
        }"

    run_test "syncParticipants: invalid role enum value" 400 \
        -X PATCH "$BASE_URL$SYNC_PARTICIPANTS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "meetId":"11111111-1111-4111-8111-111111111111",
            "participants":[{"userId":"11111111-1111-4111-8111-111111111111","role":"hacker"}]
        }'

    run_test "syncParticipants: invalid attendance enum value" 400 \
        -X PATCH "$BASE_URL$SYNC_PARTICIPANTS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "meetId":"11111111-1111-4111-8111-111111111111",
            "participants":[{"userId":"11111111-1111-4111-8111-111111111111","attendance":"maybe"}]
        }'

fi

section_header "MEETINGS — SQL-injection-shaped route param IDs"

if [ -z "$USER_TOKEN" ]; then

    skip_test "getMeetingById: SQL-injection-shaped :meetingId"
    skip_test "deleteMeeting: SQL-injection-shaped :meetingId"
    skip_test "toggleMeetingPin: SQL-injection-shaped :meetingId"
    skip_test "startMeeting: SQL-injection-shaped :meetingId"
    skip_test "endMeeting: SQL-injection-shaped :meetingId"

else

    USER_AUTH_HEADER="$(user_auth_header)"
    BAD_ID_RAW="'; DROP TABLE meetings;--"
    BAD_ID="$(urlencode "$BAD_ID_RAW")"

    run_test \
        "getMeetingById: SQL-injection-shaped :meetingId (expect 404 — safely treated as literal)" \
        404 \
        -X GET "$BASE_URL$MEETINGS_ROUTE/$BAD_ID" \
        -H "$USER_AUTH_HEADER"

    run_test \
        "deleteMeeting: SQL-injection-shaped :meetingId (expect 404 — safely treated as literal)" \
        404 \
        -X DELETE "$BASE_URL$MEETINGS_ROUTE/$BAD_ID" \
        -H "$USER_AUTH_HEADER"

    run_test \
        "toggleMeetingPin: SQL-injection-shaped :meetingId (expect 404 — safely treated as literal)" \
        404 \
        -X PATCH "$BASE_URL$MEETINGS_ROUTE/$BAD_ID/pin" \
        -H "$USER_AUTH_HEADER"

    run_test \
        "startMeeting: SQL-injection-shaped :meetingId (expect 404 — safely treated as literal)" \
        404 \
        -X PATCH "$BASE_URL$MEETINGS_ROUTE/$BAD_ID/start" \
        -H "$USER_AUTH_HEADER"

    run_test \
        "endMeeting: SQL-injection-shaped :meetingId (expect 404 — safely treated as literal)" \
        404 \
        -X PATCH "$BASE_URL$MEETINGS_ROUTE/$BAD_ID/end" \
        -H "$USER_AUTH_HEADER"

fi

section_header "MEETINGS — authorization tests"

if [ -z "$USER_TOKEN" ]; then

    skip_test "meeting: unauthorized user cannot update meeting"
    skip_test "meeting: unauthorized user cannot delete meeting"
    skip_test "meeting: unauthorized user cannot start meeting"
    skip_test "meeting: unauthorized user cannot end meeting"

else

    USER_AUTH_HEADER="$(user_auth_header)"
    FAKE_MEET_ID="11111111-1111-4111-8111-111111111111"

    run_test "meeting: unauthorized user cannot update meeting" 404 \
        -X PATCH "$BASE_URL$MEETINGS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"meetId\":\"$FAKE_MEET_ID\",
            \"meetTitle\":\"Unauthorized Update\"
        }"

    run_test "meeting: unauthorized user cannot delete meeting" 404 \
        -X DELETE "$BASE_URL$MEETINGS_ROUTE/$FAKE_MEET_ID" \
        -H "$USER_AUTH_HEADER"

    run_test "meeting: unauthorized user cannot start meeting" 404 \
        -X PATCH "$BASE_URL$MEETINGS_ROUTE/$FAKE_MEET_ID/start" \
        -H "$USER_AUTH_HEADER"

    run_test "meeting: unauthorized user cannot end meeting" 404 \
        -X PATCH "$BASE_URL$MEETINGS_ROUTE/$FAKE_MEET_ID/end" \
        -H "$USER_AUTH_HEADER"

fi

section_header "TASK — createTask"

if [ -z "$USER_TOKEN" ]; then

    skip_test "createTask: missing title"
    skip_test "createTask: suspicious title"
    skip_test "createTask: missing priority"
    skip_test "createTask: invalid priority"
    skip_test "createTask: suspicious description"
    skip_test "createTask: invalid date"
    skip_test "createTask: userIds wrong type"
    skip_test "createTask: invalid userId"

else

    USER_AUTH_HEADER="$(user_auth_header)"

    run_test "createTask: missing title" 400 \
        -X POST "$BASE_URL$CREATE_TASK_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "priority":"high",
            "userIds":[]
        }'

    run_test "createTask: suspicious title" 400 \
        -X POST "$BASE_URL$CREATE_TASK_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "taskTitle":"<script>alert(1)</script>",
            "priority":"high",
            "userIds":[]
        }'

    run_test "createTask: missing priority" 400 \
        -X POST "$BASE_URL$CREATE_TASK_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "taskTitle":"Test task",
            "userIds":[]
        }'

    run_test "createTask: invalid priority" 400 \
        -X POST "$BASE_URL$CREATE_TASK_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "taskTitle":"Test task",
            "priority":"urgent",
            "userIds":[]
        }'

    run_test "createTask: suspicious description" 400 \
        -X POST "$BASE_URL$CREATE_TASK_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "taskTitle":"Test task",
            "priority":"high",
            "desc":"<img src=x onerror=alert(1)>",
            "userIds":[]
        }'

    run_test "createTask: invalid date" 400 \
        -X POST "$BASE_URL$CREATE_TASK_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "taskTitle":"Test task",
            "priority":"high",
            "date":"not-a-date",
            "userIds":[]
        }'

	run_test "createTask: userIds wrong type" 400 \
		-X POST "$BASE_URL$CREATE_TASK_ROUTE" \
		-H "$USER_AUTH_HEADER" \
		-H "Content-Type: application/json" \
		-d '{
			"taskTitle":"Test task",
			"taskPriority":"high",
			"assignedUserIds":"abc"
		}'

	run_test "createTask: invalid userId" 400 \
		-X POST "$BASE_URL$CREATE_TASK_ROUTE" \
		-H "$USER_AUTH_HEADER" \
		-H "Content-Type: application/json" \
		-d '{
			"taskTitle":"Test task",
			"taskPriority":"high",
			"assignedUserIds":["not-a-valid-id"]
		}'

fi

section_header "TASK — updateTask"

if [ -z "$USER_TOKEN" ]; then

    skip_test "updateTask: suspicious title"
    skip_test "updateTask: invalid priority"
    skip_test "updateTask: suspicious description"
    skip_test "updateTask: invalid date"
    skip_test "updateTask: invalid status"
    skip_test "updateTask: assignedUserIds wrong type"
    skip_test "updateTask: invalid assigned user ID"

elif [ -z "$TEST_TASK_ID" ]; then

    skip_test "updateTask tests: TEST_TASK_ID not provided"

else

    USER_AUTH_HEADER="$(user_auth_header)"
    TASK_ROUTE="${UPDATE_TASK_ROUTE_TEMPLATE/\{ID\}/$TEST_TASK_ID}"

	run_test "updateTask: invalid priority" 400 \
		-X PUT "$BASE_URL$TASK_ROUTE" \
		-H "$USER_AUTH_HEADER" \
		-H "Content-Type: application/json" \
		-d '{
			"taskPriority":"urgent"
		}'

	run_test "updateTask: suspicious description" 400 \
		-X PUT "$BASE_URL$TASK_ROUTE" \
		-H "$USER_AUTH_HEADER" \
		-H "Content-Type: application/json" \
		-d '{
			"taskDesc":"<script>alert(1)</script>"
		}'

	run_test "updateTask: invalid date" 400 \
		-X PUT "$BASE_URL$TASK_ROUTE" \
		-H "$USER_AUTH_HEADER" \
		-H "Content-Type: application/json" \
		-d '{
			"dueDate":"not-a-date"
		}'

	run_test "updateTask: invalid status" 400 \
		-X PUT "$BASE_URL$TASK_ROUTE" \
		-H "$USER_AUTH_HEADER" \
		-H "Content-Type: application/json" \
		-d '{
			"taskStatus":"random"
		}'

    run_test "updateTask: assignedUserIds wrong type" 400 \
        -X PUT "$BASE_URL$TASK_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "assignedUserIds":"abc"
        }'

    run_test "updateTask: invalid assigned user ID" 400 \
        -X PUT "$BASE_URL$TASK_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "assignedUserIds":["not-a-valid-id"]
        }'

fi

section_header "MESSAGES — createDirectConversation"

if [ -z "$USER_TOKEN" ]; then

    skip_test "createDirectConversation: missing participantId"
    skip_test "createDirectConversation: invalid participantId"
    skip_test "createDirectConversation: self-conversation"

else

    USER_AUTH_HEADER="$(user_auth_header)"

    run_test "createDirectConversation: missing participantId" 400 \
        -X POST "$BASE_URL$CREATE_DIRECT_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{}'

    run_test "createDirectConversation: invalid participantId" 400 \
        -X POST "$BASE_URL$CREATE_DIRECT_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "participantId":"not-a-valid-uuid"
        }'

fi

section_header "MESSAGES — createGroupConversation"

if [ -z "$USER_TOKEN" ]; then

    skip_test "createGroupConversation: missing participantIds"
    skip_test "createGroupConversation: empty participantIds"
    skip_test "createGroupConversation: invalid participantId in array"
    skip_test "createGroupConversation: missing groupName"
    skip_test "createGroupConversation: XSS in groupName"

else

    USER_AUTH_HEADER="$(user_auth_header)"

    run_test "createGroupConversation: missing participantIds" 400 \
        -X POST "$BASE_URL$CREATE_GROUP_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "groupName":"Test Group"
        }'

    run_test "createGroupConversation: empty participantIds" 400 \
        -X POST "$BASE_URL$CREATE_GROUP_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "participantIds":[],
            "groupName":"Test Group"
        }'

    run_test "createGroupConversation: invalid participantId in array" 400 \
        -X POST "$BASE_URL$CREATE_GROUP_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "participantIds":["not-a-valid-uuid"],
            "groupName":"Test Group"
        }'

    run_test "createGroupConversation: missing groupName" 400 \
        -X POST "$BASE_URL$CREATE_GROUP_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "participantIds":["11111111-1111-4111-8111-111111111111"]
        }'

    run_test "createGroupConversation: XSS in groupName" 400 \
        -X POST "$BASE_URL$CREATE_GROUP_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "participantIds":["11111111-1111-4111-8111-111111111111"],
            "groupName":"<script>alert(1)</script>"
        }'

fi

section_header "MESSAGES — sendMessage"

if [ -z "$USER_TOKEN" ]; then

    skip_test "sendMessage: missing conversation ID"
    skip_test "sendMessage: missing text"
    skip_test "sendMessage: XSS in text"
    skip_test "sendMessage: oversized text"

elif [ -z "$TEST_CONVERSATION_ID" ]; then

    skip_test "sendMessage tests: TEST_CONVERSATION_ID not provided"

else

    USER_AUTH_HEADER="$(user_auth_header)"
    CONVERSATION_ROUTE="/api/messages/$TEST_CONVERSATION_ID/messages"

    run_test "sendMessage: missing text" 400 \
        -X POST "$BASE_URL$CONVERSATION_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{}'

    run_test "sendMessage: XSS in text" 400 \
        -X POST "$BASE_URL$CONVERSATION_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{
            "text":"<script>alert(1)</script>"
        }'

    run_test "sendMessage: oversized text (2001 chars)" 400 \
        -X POST "$BASE_URL$CONVERSATION_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\":\"$(printf 'a%.0s' {1..2001})\"
        }"

fi

section_header "RESULTS"

echo "TOTAL:   $TOTAL_COUNT"
echo "PASSED:  $PASS_COUNT"
echo "FAILED:  $FAIL_COUNT"
echo "SKIPPED: $SKIP_COUNT"

echo "=================================================="

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "RESULT: FAILED"
    exit 1
fi

if [ "$SKIP_COUNT" -gt 0 ]; then
    echo "RESULT: PASSED WITH SKIPS"
    exit 0
fi

echo "RESULT: ALL TESTS PASSED"
exit 0