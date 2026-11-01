#!/usr/bin/env bash

# ============================================================
# LiveKit Authentication + Authorization Tests
# ============================================================
#
# IMPORTANT:
#   LiveKit roomName = meeting meetId
#
# Tests:
#   - Unauthenticated requests -> 401
#   - Invalid JWT -> 401
#   - Missing roomName -> 400
#   - User can get token for own meeting -> 200
#   - User can get token for a meeting they participate in -> 200
#   - User cannot get token for another user's meeting -> 403
#   - Invalid mute request -> 400
#
# USAGE:
#   chmod +x test_livekit_auth.sh
#   ./test_livekit_auth.sh
#
# ENV OVERRIDES:
#   BASE_URL
#   USER_TOKEN
#   OWN_MEETING_ID
#   OTHER_MEETING_ID
#   PARTICIPANT_MEETING_ID
# ============================================================

set -u

BASE_URL="${BASE_URL:-https://localhost}"

USER_TOKEN="${USER_TOKEN:-}"

# These values are meeting IDs (meetId).
# They are passed to the backend as roomName.
OWN_MEETING_ID="${OWN_MEETING_ID:-}"
OTHER_MEETING_ID="${OTHER_MEETING_ID:-}"
PARTICIPANT_MEETING_ID="${PARTICIPANT_MEETING_ID:-}"

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

BODY_FILE="/tmp/livekit_authz_body"

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
        printf "${COLOR_RED}FAIL${COLOR_RESET} [curl failed] %s\n" \
            "$description"

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
# GET INPUT
# ============================================================

if [ -z "$USER_TOKEN" ]; then
    echo ""
    read -r -p "Enter User A JWT token: " USER_TOKEN
fi

if [ -z "$OWN_MEETING_ID" ]; then
    echo ""
    read -r -p "Enter User A's meeting ID (meetId / roomName): " OWN_MEETING_ID
fi

if [ -z "$OTHER_MEETING_ID" ]; then
    echo ""
    read -r -p "Enter User B's meeting ID (meetId / roomName): " OTHER_MEETING_ID
fi

if [ -z "$PARTICIPANT_MEETING_ID" ]; then
    echo ""
    read -r -p "Enter a meeting ID (meetId / roomName) that User A participates in: " PARTICIPANT_MEETING_ID
fi

USER_AUTH_HEADER="Authorization: Bearer $USER_TOKEN"

# ============================================================
# SHOW TEST INPUT
# ============================================================

echo ""
echo "Test configuration:"
echo "  Base URL                 : $BASE_URL"
echo "  Own meeting ID          : $OWN_MEETING_ID"
echo "  Other meeting ID        : $OTHER_MEETING_ID"
echo "  Participant meeting ID  : $PARTICIPANT_MEETING_ID"
echo ""
echo "NOTE: roomName is always the meeting ID (meetId)."
echo ""

# ============================================================
# AUTHENTICATION
# ============================================================

section_header "AUTHENTICATION — protected LiveKit endpoints"

run_test \
    "GET token without Authorization header -> 401" \
    401 \
    -X GET "$BASE_URL/api/lk/token?roomName=$OWN_MEETING_ID"

run_test \
    "POST mute without Authorization header -> 401" \
    401 \
    -X POST "$BASE_URL/api/lk/mute-user" \
    -H "Content-Type: application/json" \
    -d "{\"roomName\":\"$OWN_MEETING_ID\",\"mute\":true}"

run_test \
    "POST create-room without Authorization header -> 401" \
    401 \
    -X POST "$BASE_URL/api/lk/create-room" \
    -H "Content-Type: application/json" \
    -d "{\"roomName\":\"$OWN_MEETING_ID\"}"

# ============================================================
# INVALID JWT
# ============================================================

section_header "INVALID JWT"

run_test \
    "GET token with invalid JWT -> 401" \
    401 \
    -X GET "$BASE_URL/api/lk/token?roomName=$OWN_MEETING_ID" \
    -H "Authorization: Bearer invalid.token.here"

run_test \
    "POST mute with invalid JWT -> 401" \
    401 \
    -X POST "$BASE_URL/api/lk/mute-user" \
    -H "Authorization: Bearer invalid.token.here" \
    -H "Content-Type: application/json" \
    -d "{\"roomName\":\"$OWN_MEETING_ID\",\"mute\":true}"

run_test \
    "POST create-room with invalid JWT -> 401" \
    401 \
    -X POST "$BASE_URL/api/lk/create-room" \
    -H "Authorization: Bearer invalid.token.here" \
    -H "Content-Type: application/json" \
    -d "{\"roomName\":\"$OWN_MEETING_ID\"}"

# ============================================================
# TOKEN VALIDATION
# ============================================================

section_header "TOKEN VALIDATION"

if [ -z "$USER_TOKEN" ]; then

    skip_test "GET token without roomName -> 400"

else

    run_test \
        "GET token without roomName -> 400" \
        400 \
        -X GET "$BASE_URL/api/lk/token" \
        -H "$USER_AUTH_HEADER"

fi

# ============================================================
# OWN MEETING
# ============================================================

section_header "OWN MEETING — User A"

if [ -z "$USER_TOKEN" ] || [ -z "$OWN_MEETING_ID" ]; then

    skip_test "User A can get LiveKit token for own meeting"

else

    run_test \
        "User A can get LiveKit token for own meeting -> 200" \
        200 \
        -X GET "$BASE_URL/api/lk/token?roomName=$OWN_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

fi

# ============================================================
# PARTICIPANT MEETING
# ============================================================

section_header "PARTICIPANT ACCESS — User A"

if [ -z "$USER_TOKEN" ] || [ -z "$PARTICIPANT_MEETING_ID" ]; then

    skip_test "User A can get LiveKit token for meeting they participate in"

else

    run_test \
        "User A can get LiveKit token for participant meeting -> 200" \
        200 \
        -X GET "$BASE_URL/api/lk/token?roomName=$PARTICIPANT_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

fi

# ============================================================
# CROSS-USER ACCESS
# ============================================================

section_header "CROSS-USER ACCESS — User A -> User B"

if [ -z "$USER_TOKEN" ] || [ -z "$OTHER_MEETING_ID" ]; then

    skip_test "User A cannot get LiveKit token for User B's meeting"

else

    run_test \
        "User A cannot get LiveKit token for User B's meeting -> 403" \
        403 \
        -X GET "$BASE_URL/api/lk/token?roomName=$OTHER_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

fi

# ============================================================
# MUTE VALIDATION
# ============================================================

section_header "MUTE USER — validation"

if [ -z "$USER_TOKEN" ]; then

    skip_test "Mute request without roomName -> 400"
    skip_test "Mute request with invalid mute value -> 400"

else

    # Missing roomName
    run_test \
        "Mute without roomName -> 400" \
        400 \
        -X POST "$BASE_URL/api/lk/mute-user" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"mute":true}'

    # roomName is a meeting ID (meetId)
    # but mute value must be a boolean
    run_test \
        "Mute with non-boolean mute value -> 400" \
        400 \
        -X POST "$BASE_URL/api/lk/mute-user" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"roomName\":\"$OWN_MEETING_ID\",\"mute\":\"true\"}"

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
