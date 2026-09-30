#!/usr/bin/env bash

# ============================================================
# Meeting Authentication + Authorization Tests
# ============================================================
#
# Tests:
#   - Unauthenticated requests -> 401
#   - Invalid JWT -> 401
#   - User can access own meeting -> 200
#   - User cannot access another user's meeting -> 403
#   - User cannot modify another user's meeting -> 403
#   - User cannot delete another user's meeting -> 403
#   - User cannot start/end another user's meeting -> 403
#   - User cannot access another user's meeting chat -> 403
#
# USAGE:
#   chmod +x test_meeting_authorization.sh
#   ./test_meeting_authorization.sh
#
# ENV OVERRIDES:
#   BASE_URL
#   USER_TOKEN
#   OTHER_USER_TOKEN
#   OWN_MEETING_ID
#   OTHER_MEETING_ID
# ============================================================

set -u

BASE_URL="${BASE_URL:-https://localhost}"

USER_TOKEN="${USER_TOKEN:-}"
OTHER_USER_TOKEN="${OTHER_USER_TOKEN:-}"

OWN_MEETING_ID="${OWN_MEETING_ID:-}"
OTHER_MEETING_ID="${OTHER_MEETING_ID:-}"

# ============================================================
# COLORS
# ============================================================

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

# ============================================================
# TEST COUNTERS
# ============================================================

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
TOTAL_COUNT=0

# ============================================================
# TEMP FILE
# ============================================================

BODY_FILE="/tmp/meeting_authz_body"

cleanup() {
    rm -f "$BODY_FILE"
}

trap cleanup EXIT

# ============================================================
# HELPERS
# ============================================================

section_header() {
    printf "\n==================================================\n"
    printf "${COLOR_YELLOW}%s${COLOR_RESET}\n" "$1"
    printf "==================================================\n"
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
        echo "      Check BASE_URL and make sure the backend is running."

        FAIL_COUNT=$((FAIL_COUNT + 1))
        return
    fi

    if [ "$status" = "$expected" ]; then
        printf "${COLOR_GREEN}PASS${COLOR_RESET} [%s] %s\n" \
            "$status" "$description"

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

# ============================================================
# GET TOKENS
# ============================================================

if [ -z "$USER_TOKEN" ]; then
    echo ""
    read -r -p "Enter User A JWT token: " USER_TOKEN
fi

if [ -z "$OTHER_USER_TOKEN" ]; then
    echo ""
    read -r -p "Enter User B JWT token: " OTHER_USER_TOKEN
fi

# ============================================================
# GET MEETING IDS
# ============================================================

if [ -z "$OWN_MEETING_ID" ]; then
    echo ""
    read -r -p "Enter User A's meeting ID: " OWN_MEETING_ID
fi

if [ -z "$OTHER_MEETING_ID" ]; then
    echo ""
    read -r -p "Enter User B's meeting ID: " OTHER_MEETING_ID
fi

# ============================================================
# AUTH HEADERS
# ============================================================

USER_AUTH_HEADER="Authorization: Bearer $USER_TOKEN"

OTHER_USER_AUTH_HEADER="Authorization: Bearer $OTHER_USER_TOKEN"

# ============================================================
# AUTHENTICATION TESTS
# ============================================================

section_header "AUTHENTICATION — protected meeting endpoints"

run_test \
    "GET meeting without Authorization header -> 401" \
    401 \
    -X GET "$BASE_URL/api/meetings/$OWN_MEETING_ID"

run_test \
    "GET meeting with invalid JWT -> 401" \
    401 \
    -X GET "$BASE_URL/api/meetings/$OWN_MEETING_ID" \
    -H "Authorization: Bearer invalid.token.here"

run_test \
    "GET meeting chat without Authorization header -> 401" \
    401 \
    -X GET "$BASE_URL/api/meetings/$OWN_MEETING_ID/chat"

# ============================================================
# OWN MEETING
# ============================================================

section_header "OWN MEETING — User A"

if [ -z "$USER_TOKEN" ] || [ -z "$OWN_MEETING_ID" ]; then

    skip_test "User A can access own meeting"

else

    run_test \
        "User A can access own meeting -> 200" \
        200 \
        -X GET "$BASE_URL/api/meetings/$OWN_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

fi

# ============================================================
# CROSS USER ACCESS
# ============================================================

section_header "CROSS-USER ACCESS — User A -> User B"

if [ -z "$USER_TOKEN" ] || [ -z "$OTHER_MEETING_ID" ]; then

    skip_test "User A cannot access User B's meeting"

else

    run_test \
        "User A cannot access User B's meeting -> 403" \
        403 \
        -X GET "$BASE_URL/api/meetings/$OTHER_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

fi

# ============================================================
# MEETING CHAT
# ============================================================

section_header "MEETING CHAT — cross-user authorization"

if [ -z "$USER_TOKEN" ] || [ -z "$OTHER_MEETING_ID" ]; then

    skip_test "User A cannot read User B's meeting chat"

    skip_test "User A cannot send message to User B's meeting"

else

    run_test \
        "User A cannot read User B's meeting chat -> 403" \
        403 \
        -X GET "$BASE_URL/api/meetings/$OTHER_MEETING_ID/chat" \
        -H "$USER_AUTH_HEADER"

    run_test \
        "User A cannot send message to User B's meeting -> 403" \
        403 \
        -X POST "$BASE_URL/api/meetings/$OTHER_MEETING_ID/chat" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"message":"Unauthorized test message"}'

fi

# ============================================================
# MEETING MUTATIONS
# ============================================================

section_header "MEETING MUTATIONS — cross-user authorization"

if [ -z "$USER_TOKEN" ] || [ -z "$OTHER_MEETING_ID" ]; then

    skip_test "User A cannot update User B's meeting"

    skip_test "User A cannot delete User B's meeting"

    skip_test "User A cannot start User B's meeting"

    skip_test "User A cannot end User B's meeting"

    skip_test "User A cannot toggle User B's meeting pin"

else

    # --------------------------------------------------------
    # UPDATE
    # --------------------------------------------------------

    run_test \
        "User A cannot update User B's meeting -> 403" \
        403 \
        -X PATCH "$BASE_URL/api/meetings" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"meetId\":\"$OTHER_MEETING_ID\"}"

    # --------------------------------------------------------
    # DELETE
    # --------------------------------------------------------

    run_test \
        "User A cannot delete User B's meeting -> 403" \
        403 \
        -X DELETE "$BASE_URL/api/meetings/$OTHER_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

    # --------------------------------------------------------
    # START
    # --------------------------------------------------------

    run_test \
        "User A cannot start User B's meeting -> 403" \
        403 \
        -X PATCH "$BASE_URL/api/meetings/$OTHER_MEETING_ID/start" \
        -H "$USER_AUTH_HEADER"

    # --------------------------------------------------------
    # END
    # --------------------------------------------------------

    run_test \
        "User A cannot end User B's meeting -> 403" \
        403 \
        -X PATCH "$BASE_URL/api/meetings/$OTHER_MEETING_ID/end" \
        -H "$USER_AUTH_HEADER"

    # --------------------------------------------------------
    # PIN
    # --------------------------------------------------------

    run_test \
        "User A cannot toggle User B's meeting pin -> 403" \
        403 \
        -X PATCH "$BASE_URL/api/meetings/pin/$OTHER_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

fi

# ============================================================
# PARTICIPANT AUTHORIZATION
# ============================================================

section_header "PARTICIPANT AUTHORIZATION"

if [ -z "$USER_TOKEN" ] || [ -z "$OTHER_MEETING_ID" ]; then

    skip_test "User A cannot modify User B's participants"

else

    run_test \
        "User A cannot modify User B's meeting participants -> 403" \
        403 \
        -X PATCH "$BASE_URL/api/meetings/participants" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"meetId\":\"$OTHER_MEETING_ID\",\"participants\":[]}"

fi

# ============================================================
# RESULTS
# ============================================================

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