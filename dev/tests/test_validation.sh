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
# SETUP REQUIRED
# ---------------------------------------------------------------------------
#
#   BASE_URL:
#       API base URL.
#
#   ADMIN_TOKEN:
#       JWT for an administrator.
#
#   USER_TOKEN:
#       JWT for a normal/non-admin user.
#       Required only for authorization tests.

#	TEST_CONVERSATION_ID
# 	TEST_GROUP_CONVERSATION_ID
#
# run below in terminal;
# curl -X POST http://localhost:3000/api/auth/login \
#   -H "Content-Type: application/json" \
#   -d '{"userEmail":"<email>","userPassword":"<password>"}'
#
# !!! run one at a time; 1 - without token, 2 - admin token, 3 - user token
# export ADMIN_TOKEN="<copy-the-token-here>""
# export USER_TOKEN="<copy-the-token-here>""
#  
# USAGE: chmod +x test_validation.sh && ./test_validation.sh
# ---------------------------------------------------------------------------
 
set -u
 
BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
USER_TOKEN="${USER_TOKEN:-}"
 
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

ME_ROUTE="/api/users/me"

MEETINGS_ROUTE="/api/meetings"
SYNC_PARTICIPANTS_ROUTE="/api/meetings/participants"

CREATE_TASK_ROUTE="/api/tasks"
UPDATE_TASK_ROUTE_TEMPLATE="/api/tasks/{ID}"

MESSAGES_ROUTE="/api/messages"
MESSAGES_CONVERSATIONS_ROUTE="/api/messages"
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
 
cleanup() {
    rm -f "$BODY_FILE"
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
        -o "$BODY_FILE" \
        -w "%{http_code}" \
        --connect-timeout 5 \
        --max-time 15 \
        "$@")
 
    local body
    body=$(cat "$BODY_FILE" 2>/dev/null || true)
 
    if [ "$status" = "000" ]; then
        echo "FAIL  [curl failed to connect/send] $description"
        echo "      This usually means the server is unreachable or the URL is invalid."
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return
    fi
 
    if [ "$status" = "$expected" ]; then
        echo "PASS  [$status] $description"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "FAIL  [got $status, expected $expected] $description"
 
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
# AUTH — /auth/login
# ===========================================================================
 
echo "=================================================="
echo "AUTH — /auth/login"
echo "=================================================="
 
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
 
# ===========================================================================
# AUTH — /auth/google
# ===========================================================================
 
echo ""
echo "=================================================="
echo "AUTH — /auth/google"
echo "=================================================="
 
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
 
# ===========================================================================
# USER — createUser
# ===========================================================================
 
echo ""
echo "=================================================="
echo "USER — createUser"
echo "=================================================="
 
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
 
# ===========================================================================
# USER — updateCurrentUser / profile
# ===========================================================================
 
echo ""
echo "=================================================="
echo "USER — updateCurrentUser / profile"
echo "=================================================="
 
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
 
# ===========================================================================
# USER — status
# ===========================================================================
 
echo ""
echo "=================================================="
echo "USER — status update"
echo "=================================================="
 
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
 
# ===========================================================================
# USER — change password
# ===========================================================================
 
echo ""
echo "=================================================="
echo "USER — change-password"
echo "=================================================="
 
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
 
# ===========================================================================
# AUTHENTICATION — protected endpoint behaviour
# ===========================================================================
 
echo ""
echo "=================================================="
echo "AUTHENTICATION — protected endpoints"
echo "=================================================="
 
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
 
# ===========================================================================
# AUTHORIZATION — admin-only endpoints
# ===========================================================================
 
echo ""
echo "=================================================="
echo "AUTHORIZATION — admin-only endpoints"
echo "=================================================="
 
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
 
# ===========================================================================
# SQL INJECTION — route parameters
# ===========================================================================
 
echo ""
echo "=================================================="
echo "USER — SQL-injection-shaped route param IDs"
echo "=================================================="
 
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


# ===========================================================================
# MEETINGS — createMeeting validation
# ===========================================================================

echo ""
echo "=================================================="
echo "MEETINGS — createMeeting"
echo "=================================================="

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

# ===========================================================================
# MEETINGS — updateMeeting validation
# ===========================================================================

echo ""
echo "=================================================="
echo "MEETINGS — updateMeeting"
echo "=================================================="

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

# ===========================================================================
# MEETINGS — syncParticipants validation
# ===========================================================================

echo ""
echo "=================================================="
echo "MEETINGS — syncParticipants"
echo "=================================================="

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

# ===========================================================================
# MEETINGS — SQL injection route parameters
# ===========================================================================

echo ""
echo "=================================================="
echo "MEETINGS — SQL-injection-shaped route param IDs"
echo "=================================================="

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

# ===========================================================================
# MEETINGS — authorization tests
# ===========================================================================

echo ""
echo "=================================================="
echo "MEETINGS — authorization tests"
echo "=================================================="

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

# ===========================================================================
# TASK — createTask validation
# ===========================================================================

echo ""
echo "=================================================="
echo "TASK — createTask"
echo "=================================================="

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

# ===========================================================================
# TASK — updateTask validation
# ===========================================================================

echo ""
echo "=================================================="
echo "TASK — updateTask"
echo "=================================================="

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

# ===========================================================================
# MESSAGES — createDirectConversation validation
# ===========================================================================

echo ""
echo "=================================================="
echo "MESSAGES — createDirectConversation"
echo "=================================================="

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

# ===========================================================================
# MESSAGES — createGroupConversation validation
# ===========================================================================

echo ""
echo "=================================================="
echo "MESSAGES — createGroupConversation"
echo "=================================================="

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

# ===========================================================================
# MESSAGES — sendMessage validation
# ===========================================================================

echo ""
echo "=================================================="
echo "MESSAGES — sendMessage"
echo "=================================================="

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

    run_test "sendMessage: oversized text (5001 chars)" 400 \
        -X POST "$BASE_URL$CONVERSATION_ROUTE" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\":\"$(printf 'a%.0s' {1..5001})\"
        }"

fi
 
# ===========================================================================
# FINAL RESULTS
# ===========================================================================
 
echo ""
echo "=================================================="
echo "RESULTS"
echo "=================================================="
 
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