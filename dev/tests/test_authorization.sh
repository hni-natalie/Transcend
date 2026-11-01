#!/usr/bin/env bash
#
# Authorization + authentication tests
#
# WHAT THIS PROVES:
#   - Authentication:  missing/invalid tokens -> 401
#   - Authorization:   normal user hitting admin routes -> 403
#   - SQLi resistance: injection-shaped IDs treated as literals -> 404
#
# USAGE:
#   chmod +x test_authorization.sh
#   source ./test_authorization.sh
#
# Always prompts for both a regular-user login and an admin login
# (unless USER_TOKEN / ADMIN_TOKEN are already set in the environment,
# in which case those are used as-is and prompting is skipped).
#
# ENV OVERRIDES (if set, no prompting for that value):
#   BASE_URL, USER_TOKEN, ADMIN_TOKEN, TARGET_USER_ID
# ---------------------------------------------------------------------------

set -u

BASE_URL="${BASE_URL:-https://localhost}"

USER_TOKEN="${USER_TOKEN:-}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

# A user ID belonging to the SAME workspace as ADMIN_TOKEN.
TARGET_USER_ID="${TARGET_USER_ID:-cdafb2d0-b6fa-42b4-b74f-97e7f3ce0329}"

# ---------------------------------------------------------------------------
# COLORS 
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

CURRENT_USER_ROUTE="/api/auth/me"
PROFILE_ROUTE="/api/users/me"
DASHBOARD_ROUTE="/api/users/dashboard"
DASHBOARD_METRICS_ROUTE="/api/users/dashboard/metrics"
STATUS_ROUTE="/api/users/status"
CHANGE_PASSWORD_ROUTE="/api/users/change-password"
LIST_USERS_ROUTE="/api/users"

UPDATE_USER_ROUTE_TEMPLATE="/api/users/{ID}"
RESET_PASSWORD_ROUTE_TEMPLATE="/api/users/{ID}/reset-password"

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

BODY_FILE="/tmp/authz_body"
TOKEN_FILE="/tmp/authz_login_body"

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

extract_token() {
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
# FETCH TOKENS — always both
# ---------------------------------------------------------------------------

if [ -z "$USER_TOKEN" ]; then
    if USER_TOKEN="$(fetch_token "regular user")"; then
        export USER_TOKEN
    else
        echo "Proceeding without USER_TOKEN - user tests will be skipped." >&2
        USER_TOKEN=""
    fi
fi

if [ -z "$ADMIN_TOKEN" ]; then
    if ADMIN_TOKEN="$(fetch_token "admin")"; then
        export ADMIN_TOKEN
    else
        echo "Proceeding without ADMIN_TOKEN - admin tests will be skipped." >&2
        ADMIN_TOKEN=""
    fi
fi

# ---------------------------------------------------------------------------
# AUTO-DISCOVER TARGET_USER_ID
# ---------------------------------------------------------------------------
# Only runs if TARGET_USER_ID is empty. The default above usually populates it.

discover_target_user_id() {
    [ -n "$ADMIN_TOKEN" ] || return 1

    local body
    body=$(curl -s -k --connect-timeout 5 --max-time 15 \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        "$BASE_URL$LIST_USERS_ROUTE")

    if command -v jq >/dev/null 2>&1; then
        local id
        id=$(printf '%s' "$body" | jq -r '
            (.users // .data // .) as $u
            | (if ($u|type)=="array" then $u else ($u.users // $u.data // []) end)
            | map(select(.userId != null))
            | .[0].userId // empty' 2>/dev/null)
        if [ -n "$id" ] && [ "$id" != "null" ]; then
            printf '%s' "$id"
            return 0
        fi
    fi

    printf '%s' "$body" \
        | grep -o '"userId"[[:space:]]*:[[:space:]]*"[^"]*"' \
        | head -n1 \
        | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/'
}

if [ -z "$TARGET_USER_ID" ] && [ -n "$ADMIN_TOKEN" ]; then
    TARGET_USER_ID="$(discover_target_user_id || true)"
    if [ -n "$TARGET_USER_ID" ]; then
        echo "Auto-discovered TARGET_USER_ID: $TARGET_USER_ID" >&2
    else
        echo "Could not auto-discover TARGET_USER_ID - admin mutation tests will be skipped." >&2
    fi
fi

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

# ===========================================================================
# TESTS
# ===========================================================================

section_header "AUTHENTICATION — protected endpoints"

run_test "protected profile endpoint: no Authorization header" 401 \
    -X GET "$BASE_URL$PROFILE_ROUTE"

run_test "protected profile endpoint: invalid JWT" 401 \
    -X GET "$BASE_URL$PROFILE_ROUTE" \
    -H "Authorization: Bearer invalid.token.here"

run_test "protected dashboard endpoint: no Authorization header" 401 \
    -X GET "$BASE_URL$DASHBOARD_ROUTE"

run_test "protected change-password endpoint: no Authorization header" 401 \
    -X POST "$BASE_URL$CHANGE_PASSWORD_ROUTE" \
    -H "Content-Type: application/json" \
    -d '{}'

run_test "current user /me: invalid JWT" 401 \
    -X GET "$BASE_URL$CURRENT_USER_ROUTE" \
    -H "Authorization: Bearer invalid.token.here"

# ---------------------------------------------------------------------------

section_header "NORMAL USER — own resources"

if [ -z "$USER_TOKEN" ]; then

    skip_test "user: can update own profile"
    skip_test "user: can access own dashboard"
    skip_test "user: can change own password (wrong old -> 4xx)"
    skip_test "user: can update own status"
    skip_test "user: can access users by status"
    skip_test "user: Auth /me works with valid token"

else

    USER_AUTH_HEADER="$(user_auth_header)"

    run_test "user: can update own profile (200)" 200 \
        -X PATCH "$BASE_URL$PROFILE_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"userName":"Auth User2"}'

    run_test "user: can access own dashboard (200)" 200 \
        -X GET "$BASE_URL$DASHBOARD_ROUTE" \
        -H "$USER_AUTH_HEADER"

    run_test "user: can change own password (wrong old -> 401)" 401 \
        -X POST "$BASE_URL$CHANGE_PASSWORD_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"oldPassword":"WRONG_PASSWORD","newPassword":"NewPassword123!"}'

    run_test "user: can update own status (200)" 200 \
        -X PATCH "$BASE_URL$STATUS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"status":"focus"}'

    run_test "user: can access users by status (200)" 200 \
        -X GET "$BASE_URL$STATUS_ROUTE/online" \
        -H "$USER_AUTH_HEADER"

    run_test "user: Auth /me works with valid token (200)" 200 \
        -X GET "$BASE_URL$CURRENT_USER_ROUTE" \
        -H "$USER_AUTH_HEADER"

fi

# ---------------------------------------------------------------------------

section_header "NORMAL USER — cannot touch admin mutations"

if [ -z "$USER_TOKEN" ] || [ -z "$TARGET_USER_ID" ]; then

    skip_test "user cannot createUser"
    skip_test "user cannot update another user"
    skip_test "user cannot delete another user"
    skip_test "user cannot reset another user's password"

else

    USER_AUTH_HEADER="$(user_auth_header)"
    TID="$(urlencode "$TARGET_USER_ID")"

    run_test "user cannot createUser (403)" 403 \
        -X POST "$BASE_URL$LIST_USERS_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"email":"authorization-test@example.com","name":"Unauthorized User","roleId":"INVALID_ROLE_ID"}'

    run_test "user cannot update another user (403)" 403 \
        -X PATCH "$BASE_URL${UPDATE_USER_ROUTE_TEMPLATE/\{ID\}/$TID}" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"name":"Should Not Work"}'

    run_test "user cannot delete another user (403)" 403 \
        -X DELETE "$BASE_URL${UPDATE_USER_ROUTE_TEMPLATE/\{ID\}/$TID}" \
        -H "$USER_AUTH_HEADER"

    run_test "user cannot reset another user's password (403)" 403 \
        -X POST "$BASE_URL${RESET_PASSWORD_ROUTE_TEMPLATE/\{ID\}/$TID}" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"newPassword":"NewPassword123!"}'

fi

# ---------------------------------------------------------------------------

section_header "NORMAL USER — cannot read admin areas"

if [ -z "$USER_TOKEN" ]; then

    skip_test "user cannot access admin dashboard metrics"
    skip_test "user cannot list all users"

else

    USER_AUTH_HEADER="$(user_auth_header)"

    run_test "user cannot access admin dashboard metrics (403)" 403 \
        -X GET "$BASE_URL$DASHBOARD_METRICS_ROUTE" \
        -H "$USER_AUTH_HEADER"

    run_test "user cannot list all users (403)" 403 \
        -X GET "$BASE_URL$LIST_USERS_ROUTE" \
        -H "$USER_AUTH_HEADER"

fi

# ---------------------------------------------------------------------------

section_header "ADMIN — can read own workspace"

if [ -z "$ADMIN_TOKEN" ]; then

    skip_test "admin can list users"
    skip_test "admin can access dashboard metrics"

else

    ADMIN_AUTH_HEADER="$(admin_auth_header)"

    run_test "admin can list users (200)" 200 \
        -X GET "$BASE_URL$LIST_USERS_ROUTE" \
        -H "$ADMIN_AUTH_HEADER"

    run_test "admin can access dashboard metrics (200)" 200 \
        -X GET "$BASE_URL$DASHBOARD_METRICS_ROUTE" \
        -H "$ADMIN_AUTH_HEADER"

fi

# ---------------------------------------------------------------------------

section_header "ADMIN — mutations in own workspace"

if [ -z "$ADMIN_TOKEN" ] || [ -z "$TARGET_USER_ID" ]; then

    skip_test "admin can update user in own workspace"
    skip_test "admin can reset user password"

else

    ADMIN_AUTH_HEADER="$(admin_auth_header)"
    TID="$(urlencode "$TARGET_USER_ID")"

    run_test "admin can update user in own workspace (200)" 200 \
        -X PATCH "$BASE_URL${UPDATE_USER_ROUTE_TEMPLATE/\{ID\}/$TID}" \
        -H "$ADMIN_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"name":"Authorization Test User"}'

    run_test "admin can reset user password (200)" 200 \
        -X POST "$BASE_URL${RESET_PASSWORD_ROUTE_TEMPLATE/\{ID\}/$TID}" \
        -H "$ADMIN_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"newPassword":"NewPassword123!"}'

fi

# ---------------------------------------------------------------------------

section_header "SQL-INJECTION-SHAPED ROUTE PARAM IDS"

if [ -z "$ADMIN_TOKEN" ]; then

    skip_test "updateUser: SQL-injection-shaped :id"
    skip_test "resetPassword: SQL-injection-shaped :id"

else

    ADMIN_AUTH_HEADER="$(admin_auth_header)"

    BAD_ID_RAW="'; DROP TABLE users;--"
    BAD_ID="$(urlencode "$BAD_ID_RAW")"

    run_test \
        "updateUser: SQL-injection-shaped :id (expect 404 — safely treated as literal)" \
        404 \
        -X PUT "$BASE_URL${UPDATE_USER_ROUTE_TEMPLATE/\{ID\}/$BAD_ID}" \
        -H "$ADMIN_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test"}'

    run_test \
        "resetPassword: SQL-injection-shaped :id (expect 404 — safely treated as literal)" \
        404 \
        -X POST "$BASE_URL${RESET_PASSWORD_ROUTE_TEMPLATE/\{ID\}/$BAD_ID}" \
        -H "$ADMIN_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"newPassword":"SomethingStrong1!"}'

fi

# ---------------------------------------------------------------------------
# RESULTS
# ---------------------------------------------------------------------------

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