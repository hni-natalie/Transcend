#!/usr/bin/env bash

# ============================================================
# MESSAGE — validation + authentication + authorization tests
# ============================================================
#
# Tests:
#   400 - invalid message/conversation request
#   401 - missing/invalid authentication
#   403 - authenticated non-participant / non-owner
#   404 - conversation/attachment does not exist
#
# USAGE:
#   source ./test_message_validation.sh
#   source ./test_message_validation.sh user
#
# Optional env vars:
#   BASE_URL
#   USER_TOKEN
#   TEST_CONVERSATION_ID
#   OTHER_CONVERSATION_ID
#   MISSING_CONVERSATION_ID
#   OTHER_ATTACHMENT_ID
#   MISSING_ATTACHMENT_ID
# ============================================================

set -u

BASE_URL="${BASE_URL:-https://localhost}"
USER_TOKEN="${USER_TOKEN:-}"

TEST_CONVERSATION_ID="${TEST_CONVERSATION_ID:-}"
OTHER_CONVERSATION_ID="${OTHER_CONVERSATION_ID:-}"
MISSING_CONVERSATION_ID="${MISSING_CONVERSATION_ID:-11111111-1111-4111-8111-111111111111}"

OTHER_ATTACHMENT_ID="${OTHER_ATTACHMENT_ID:-}"
MISSING_ATTACHMENT_ID="${MISSING_ATTACHMENT_ID:-00000000-0000-0000-0000-000000000000}"

LOGIN_ROUTE="/api/auth/login"

CREATE_DIRECT_ROUTE="/api/messages/direct"
CREATE_GROUP_ROUTE="/api/messages/group"

# Matches the existing validation script:
#   /api/messages/:conversationId/messages
MESSAGES_ROUTE="/api/messages"

# These are easy to override here if your router uses different paths.
DELETE_CONVERSATION_ROUTE="/api/messages"
DELETE_ATTACHMENT_ROUTE="/api/messages/attachments"
PIN_ROUTE="/api/messages"
UNPIN_ROUTE="/api/messages"

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

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
TOTAL_COUNT=0

BODY_FILE="/tmp/message_validation_body"
TOKEN_FILE="/tmp/message_validation_login"

cleanup() {
    rm -f "$BODY_FILE" "$TOKEN_FILE"
}
trap cleanup EXIT

section_header() {
    printf "\n==================================================\n${COLOR_YELLOW}%s${COLOR_RESET}\n==================================================\n" "$1"
}

skip_test() {
    echo "SKIP  $1"
    SKIP_COUNT=$((SKIP_COUNT + 1))
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
}

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
        printf "${COLOR_RED}FAIL${COLOR_RESET} [curl failed] %s\n" "$description"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return
    fi

    if [ "$status" = "$expected" ]; then
        printf "${COLOR_GREEN}PASS${COLOR_RESET} [%s] %s\n" "$status" "$description"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        printf "${COLOR_RED}FAIL${COLOR_RESET} [got %s, expected %s] %s\n" \
            "$status" "$expected" "$description"

        if [ -n "$body" ]; then
            echo "      body: ${body:0:500}"
        fi

        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

extract_token() {
    local json
    json="$(cat)"

    if command -v jq >/dev/null 2>&1; then
        local tok
        tok="$(printf '%s' "$json" | jq -r \
            '.token // .accessToken // .jwt // .data.token // empty' 2>/dev/null)"

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
    local email password status body token

    echo "" >&2
    echo "-- Login as regular user --" >&2

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
        echo "  Login failed (HTTP $status)." >&2
        echo "  body: ${body:0:300}" >&2
        return 1
    fi

    token="$(printf '%s' "$body" | extract_token)"

    if [ -z "$token" ]; then
        echo "  Login succeeded but no token was found." >&2
        return 1
    fi

    echo "  Got user token." >&2
    printf '%s' "$token"
}

MODE="${1:-none}"

if [ "$MODE" = "user" ] && [ -z "$USER_TOKEN" ]; then
    if USER_TOKEN="$(fetch_token)"; then
        export USER_TOKEN
    else
        USER_TOKEN=""
    fi
fi

user_auth_header() {
    printf '%s' "Authorization: Bearer $USER_TOKEN"
}

# ============================================================
# AUTHENTICATION
# ============================================================

section_header "MESSAGES — authentication"

run_test "getMessages: no Authorization header" 401 \
    -X GET "$BASE_URL$MESSAGES_ROUTE/$MISSING_CONVERSATION_ID/messages"

run_test "getMessages: invalid JWT" 401 \
    -X GET "$BASE_URL$MESSAGES_ROUTE/$MISSING_CONVERSATION_ID/messages" \
    -H "Authorization: Bearer definitely-not-a-real-jwt"

# ============================================================
# CREATE DIRECT VALIDATION
# ============================================================

section_header "MESSAGES — createDirectConversation validation"

if [ -z "$USER_TOKEN" ]; then
    skip_test "createDirectConversation: missing participantId"
    skip_test "createDirectConversation: invalid participantId"
else
    AUTH_HEADER="$(user_auth_header)"

    run_test "createDirectConversation: missing participantId" 400 \
        -X POST "$BASE_URL$CREATE_DIRECT_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{}'

    run_test "createDirectConversation: invalid participantId" 400 \
        -X POST "$BASE_URL$CREATE_DIRECT_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"participantId":"not-a-valid-uuid"}'
fi

# ============================================================
# CREATE GROUP VALIDATION
# ============================================================

section_header "MESSAGES — createGroupConversation validation"

if [ -z "$USER_TOKEN" ]; then
    skip_test "createGroupConversation: missing participantIds"
    skip_test "createGroupConversation: empty participantIds"
    skip_test "createGroupConversation: invalid participantId"
    skip_test "createGroupConversation: missing groupName"
    skip_test "createGroupConversation: XSS groupName"
else
    AUTH_HEADER="$(user_auth_header)"

    run_test "createGroupConversation: missing participantIds" 400 \
        -X POST "$BASE_URL$CREATE_GROUP_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"groupName":"Test Group"}'

    run_test "createGroupConversation: empty participantIds" 400 \
        -X POST "$BASE_URL$CREATE_GROUP_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"participantIds":[],"groupName":"Test Group"}'

    run_test "createGroupConversation: invalid participantId" 400 \
        -X POST "$BASE_URL$CREATE_GROUP_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"participantIds":["not-a-valid-uuid"],"groupName":"Test Group"}'

    run_test "createGroupConversation: missing groupName" 400 \
        -X POST "$BASE_URL$CREATE_GROUP_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"participantIds":["11111111-1111-4111-8111-111111111111"]}'

    run_test "createGroupConversation: XSS groupName" 400 \
        -X POST "$BASE_URL$CREATE_GROUP_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"participantIds":["11111111-1111-4111-8111-111111111111"],"groupName":"<script>alert(1)</script>"}'
fi

# ============================================================
# SEND MESSAGE VALIDATION
# ============================================================

section_header "MESSAGES — sendMessage validation"

if [ -z "$USER_TOKEN" ] || [ -z "$TEST_CONVERSATION_ID" ]; then
    skip_test "sendMessage: missing text/attachment"
    skip_test "sendMessage: XSS text"
    skip_test "sendMessage: oversized text"
else
    AUTH_HEADER="$(user_auth_header)"
    CONVERSATION_ROUTE="$MESSAGES_ROUTE/$TEST_CONVERSATION_ID/messages"

    run_test "sendMessage: missing text/attachment" 400 \
        -X POST "$BASE_URL$CONVERSATION_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{}'

    run_test "sendMessage: XSS text" 400 \
        -X POST "$BASE_URL$CONVERSATION_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"text":"<script>alert(1)</script>"}'

    run_test "sendMessage: oversized text (2001 chars)" 400 \
        -X POST "$BASE_URL$CONVERSATION_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"$(printf 'a%.0s' {1..2001})\"}"
fi

# ============================================================
# 404
# ============================================================

section_header "MESSAGES — not found"

if [ -z "$USER_TOKEN" ]; then
    skip_test "getMessages: missing conversation -> 404"
    skip_test "sendMessage: missing conversation -> 404"
else
    AUTH_HEADER="$(user_auth_header)"

    run_test "getMessages: missing conversation -> 404" 404 \
        -X GET "$BASE_URL$MESSAGES_ROUTE/$MISSING_CONVERSATION_ID/messages" \
        -H "$AUTH_HEADER"

    run_test "sendMessage: missing conversation -> 404" 404 \
        -X POST "$BASE_URL$MESSAGES_ROUTE/$MISSING_CONVERSATION_ID/messages" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"text":"Missing conversation test"}'
fi

# ============================================================
# 403
# ============================================================

section_header "MESSAGES — authorization"

if [ -z "$USER_TOKEN" ] || [ -z "$OTHER_CONVERSATION_ID" ]; then
    skip_test "getMessages: non-participant -> 403"
    skip_test "sendMessage: non-participant -> 403"
else
    AUTH_HEADER="$(user_auth_header)"

    run_test "getMessages: non-participant -> 403" 403 \
        -X GET "$BASE_URL$MESSAGES_ROUTE/$OTHER_CONVERSATION_ID/messages" \
        -H "$AUTH_HEADER"

    run_test "sendMessage: non-participant -> 403" 403 \
        -X POST "$BASE_URL$MESSAGES_ROUTE/$OTHER_CONVERSATION_ID/messages" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"text":"Unauthorized send"}'
fi

# ============================================================
# OPTIONAL ATTACHMENT AUTHORIZATION
# ============================================================

section_header "MESSAGES — attachment authorization"

if [ -z "$USER_TOKEN" ] || [ -z "$OTHER_ATTACHMENT_ID" ]; then
    skip_test "deleteAttachment: wrong author -> 403"
else
    AUTH_HEADER="$(user_auth_header)"

    run_test "deleteAttachment: wrong author -> 403" 403 \
        -X DELETE "$BASE_URL$DELETE_ATTACHMENT_ROUTE/$OTHER_ATTACHMENT_ID" \
        -H "$AUTH_HEADER"
fi

if [ -z "$USER_TOKEN" ]; then
    skip_test "deleteAttachment: missing attachment -> 404"
else
    AUTH_HEADER="$(user_auth_header)"

    run_test "deleteAttachment: missing attachment -> 404" 404 \
        -X DELETE "$BASE_URL$DELETE_ATTACHMENT_ROUTE/$MISSING_ATTACHMENT_ID" \
        -H "$AUTH_HEADER"
fi

section_header "RESULTS"

echo "TOTAL:   $TOTAL_COUNT"
echo "PASSED:  $PASS_COUNT"
echo "FAILED:  $FAIL_COUNT"
echo "SKIPPED: $SKIP_COUNT"
echo "=================================================="

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "RESULT: FAILED"
    return 1 2>/dev/null || exit 1
fi

if [ "$SKIP_COUNT" -gt 0 ]; then
    echo "RESULT: PASSED WITH SKIPS"
    return 0 2>/dev/null || exit 0
fi

echo "RESULT: ALL TESTS PASSED"
return 0 2>/dev/null || exit 0
