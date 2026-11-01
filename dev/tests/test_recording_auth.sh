#!/usr/bin/env bash

# ============================================================
# Recording Authentication + Authorization Tests
# ============================================================
#
# Tests:
#   - Unauthenticated requests -> 401
#   - Invalid JWT -> 401
#   - User can access own recordings -> 200
#   - User can access own recording status -> 200
#   - User cannot access another user's recordings -> 403
#   - User cannot access another user's recording status -> 403
#   - User cannot start another user's recording -> 403
#   - User cannot stop another user's recording -> 403
#
# USAGE:
#   chmod +x test_recording_auth.sh
#   ./test_recording_auth.sh
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

BODY_FILE="/tmp/recording_authz_body"

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

section_header "AUTHENTICATION — protected recording endpoints"

run_test \
    "GET recordings without Authorization header -> 401" \
    401 \
    -X GET "$BASE_URL/api/recordings/$OWN_MEETING_ID"

run_test \
    "GET recording status without Authorization header -> 401" \
    401 \
    -X GET "$BASE_URL/api/recordings/status/$OWN_MEETING_ID"

run_test \
    "START recording without Authorization header -> 401" \
    401 \
    -X POST "$BASE_URL/api/recordings/start" \
    -H "Content-Type: application/json" \
    -d "{\"meetId\":\"$OWN_MEETING_ID\"}"

run_test \
    "STOP recording without Authorization header -> 401" \
    401 \
    -X PATCH "$BASE_URL/api/recordings/stop/$OWN_MEETING_ID"

# ============================================================
# INVALID JWT
# ============================================================

section_header "INVALID JWT"

run_test \
    "GET recordings with invalid JWT -> 401" \
    401 \
    -X GET "$BASE_URL/api/recordings/$OWN_MEETING_ID" \
    -H "Authorization: Bearer invalid.token.here"

run_test \
    "GET recording status with invalid JWT -> 401" \
    401 \
    -X GET "$BASE_URL/api/recordings/status/$OWN_MEETING_ID" \
    -H "Authorization: Bearer invalid.token.here"

run_test \
    "START recording with invalid JWT -> 401" \
    401 \
    -X POST "$BASE_URL/api/recordings/start" \
    -H "Authorization: Bearer invalid.token.here" \
    -H "Content-Type: application/json" \
    -d "{\"meetId\":\"$OWN_MEETING_ID\"}"

run_test \
    "STOP recording with invalid JWT -> 401" \
    401 \
    -X PATCH "$BASE_URL/api/recordings/stop/$OWN_MEETING_ID" \
    -H "Authorization: Bearer invalid.token.here"

# ============================================================
# OWN MEETING
# ============================================================

section_header "OWN MEETING — User A"

if [ -z "$USER_TOKEN" ] || [ -z "$OWN_MEETING_ID" ]; then

    skip_test "User A can access own recordings"

    skip_test "User A can access own recording status"

else

    run_test \
        "User A can access own recordings -> 200" \
        200 \
        -X GET "$BASE_URL/api/recordings/$OWN_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

    run_test \
        "User A can access own recording status -> 200" \
        200 \
        -X GET "$BASE_URL/api/recordings/status/$OWN_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

fi

# ============================================================
# CROSS-USER ACCESS
# ============================================================

section_header "CROSS-USER ACCESS — User A -> User B"

if [ -z "$USER_TOKEN" ] || [ -z "$OTHER_MEETING_ID" ]; then

    skip_test "User A cannot access User B's recordings"

    skip_test "User A cannot access User B's recording status"

    skip_test "User A cannot start User B's recording"

    skip_test "User A cannot stop User B's recording"

else

    # --------------------------------------------------------
    # GET RECORDINGS
    # --------------------------------------------------------

    run_test \
        "User A cannot access User B's recordings -> 403" \
        403 \
        -X GET "$BASE_URL/api/recordings/$OTHER_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

    # --------------------------------------------------------
    # GET RECORDING STATUS
    # --------------------------------------------------------

    run_test \
        "User A cannot access User B's recording status -> 403" \
        403 \
        -X GET "$BASE_URL/api/recordings/status/$OTHER_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

    # --------------------------------------------------------
    # START RECORDING
    # --------------------------------------------------------

    run_test \
        "User A cannot start User B's recording -> 403" \
        403 \
        -X POST "$BASE_URL/api/recordings/start" \
        -H "$USER_AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d "{\"meetId\":\"$OTHER_MEETING_ID\"}"

    # --------------------------------------------------------
    # STOP RECORDING
    # --------------------------------------------------------

    run_test \
        "User A cannot stop User B's recording -> 403" \
        403 \
        -X PATCH "$BASE_URL/api/recordings/stop/$OTHER_MEETING_ID" \
        -H "$USER_AUTH_HEADER"

fi

# ============================================================
# VALIDATION
# ============================================================

section_header "VALIDATION — missing meeting ID"

run_test \
    "START recording without meeting ID -> 400" \
    400 \
    -X POST "$BASE_URL/api/recordings/start" \
    -H "$USER_AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d '{}'

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
