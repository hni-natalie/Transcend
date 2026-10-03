#!/usr/bin/env bash

# ============================================================
# TASK — validation + authentication + authorization tests
# ============================================================
#
# Tests:
#   400 - invalid task request
#   401 - missing/invalid authentication
#   403 - authenticated user cannot access/modify another user's task
#   404 - task does not exist
#
# Login body follows the existing project script:
#   {
#     "userEmail": "...",
#     "userPassword": "..."
#   }
#
# USAGE:
#   source ./test_task_validation.sh
#   source ./test_task_validation.sh user
#
# Optional env vars:
#   BASE_URL
#   USER_TOKEN
#   TEST_TASK_ID
#   OTHER_TASK_ID
#   MISSING_TASK_ID
# ============================================================

set -u

BASE_URL="${BASE_URL:-https://localhost}"
USER_TOKEN="${USER_TOKEN:-}"

TEST_TASK_ID="${TEST_TASK_ID:-}"
OTHER_TASK_ID="${OTHER_TASK_ID:-}"
MISSING_TASK_ID="${MISSING_TASK_ID:-00000000-0000-0000-0000-000000000000}"

LOGIN_ROUTE="/api/auth/login"
TASKS_ROUTE="/api/tasks"

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

BODY_FILE="/tmp/task_validation_body"
TOKEN_FILE="/tmp/task_validation_login"

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

section_header "TASK — authentication"

run_test "getTaskById: no Authorization header" 401 \
    -X GET "$BASE_URL$TASKS_ROUTE/$MISSING_TASK_ID"

run_test "getTaskById: invalid JWT" 401 \
    -X GET "$BASE_URL$TASKS_ROUTE/$MISSING_TASK_ID" \
    -H "Authorization: Bearer definitely-not-a-real-jwt"

# ============================================================
# CREATE VALIDATION
# ============================================================

section_header "TASK — createTask validation"

if [ -z "$USER_TOKEN" ]; then
    skip_test "createTask: missing title"
    skip_test "createTask: missing priority"
    skip_test "createTask: invalid priority"
    skip_test "createTask: XSS title"
    skip_test "createTask: invalid dueDate"
    skip_test "createTask: assignedUserIds wrong type"
else
    AUTH_HEADER="$(user_auth_header)"

    run_test "createTask: missing title" 400 \
        -X POST "$BASE_URL$TASKS_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskPriority":"high","assignedUserIds":[]}'

    run_test "createTask: missing priority" 400 \
        -X POST "$BASE_URL$TASKS_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskTitle":"Test task","assignedUserIds":[]}'

    run_test "createTask: invalid priority" 400 \
        -X POST "$BASE_URL$TASKS_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskTitle":"Test task","taskPriority":"urgent","assignedUserIds":[]}'

    run_test "createTask: XSS title" 400 \
        -X POST "$BASE_URL$TASKS_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskTitle":"<script>alert(1)</script>","taskPriority":"high","assignedUserIds":[]}'

    run_test "createTask: invalid dueDate" 400 \
        -X POST "$BASE_URL$TASKS_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskTitle":"Test task","taskPriority":"high","dueDate":"not-a-date","assignedUserIds":[]}'

    run_test "createTask: assignedUserIds wrong type" 400 \
        -X POST "$BASE_URL$TASKS_ROUTE" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskTitle":"Test task","taskPriority":"high","assignedUserIds":"abc"}'
fi

# ============================================================
# UPDATE VALIDATION
# ============================================================

section_header "TASK — updateTask validation"

if [ -z "$USER_TOKEN" ] || [ -z "$TEST_TASK_ID" ]; then
    skip_test "updateTask: empty body"
    skip_test "updateTask: invalid priority"
    skip_test "updateTask: XSS description"
    skip_test "updateTask: invalid dueDate"
    skip_test "updateTask: invalid status"
else
    AUTH_HEADER="$(user_auth_header)"

    run_test "updateTask: empty body" 400 \
        -X PUT "$BASE_URL$TASKS_ROUTE/$TEST_TASK_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{}'

    run_test "updateTask: invalid priority" 400 \
        -X PUT "$BASE_URL$TASKS_ROUTE/$TEST_TASK_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskPriority":"urgent"}'

    run_test "updateTask: XSS description" 400 \
        -X PUT "$BASE_URL$TASKS_ROUTE/$TEST_TASK_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskDesc":"<script>alert(1)</script>"}'

    run_test "updateTask: invalid dueDate" 400 \
        -X PUT "$BASE_URL$TASKS_ROUTE/$TEST_TASK_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"dueDate":"not-a-date"}'

    run_test "updateTask: invalid status" 400 \
        -X PUT "$BASE_URL$TASKS_ROUTE/$TEST_TASK_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskStatus":"random"}'
fi

# ============================================================
# 404
# ============================================================

section_header "TASK — not found"

if [ -z "$USER_TOKEN" ]; then
    skip_test "getTaskById: missing task -> 404"
    skip_test "updateTask: missing task -> 404"
    skip_test "deleteTask: missing task -> 404"
else
    AUTH_HEADER="$(user_auth_header)"

    run_test "getTaskById: missing task -> 404" 404 \
        -X GET "$BASE_URL$TASKS_ROUTE/$MISSING_TASK_ID" \
        -H "$AUTH_HEADER"

    run_test "updateTask: missing task -> 404" 404 \
        -X PUT "$BASE_URL$TASKS_ROUTE/$MISSING_TASK_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskTitle":"Missing task"}'

    run_test "deleteTask: missing task -> 404" 404 \
        -X DELETE "$BASE_URL$TASKS_ROUTE/$MISSING_TASK_ID" \
        -H "$AUTH_HEADER"
fi

# ============================================================
# 403
# ============================================================

section_header "TASK — authorization"

if [ -z "$USER_TOKEN" ] || [ -z "$OTHER_TASK_ID" ]; then
    skip_test "getTaskById: unauthorized task -> 403"
    skip_test "updateTask: unauthorized task -> 403"
    skip_test "deleteTask: unauthorized task -> 403"
else
    AUTH_HEADER="$(user_auth_header)"

    run_test "getTaskById: unauthorized task -> 403" 403 \
        -X GET "$BASE_URL$TASKS_ROUTE/$OTHER_TASK_ID" \
        -H "$AUTH_HEADER"

    run_test "updateTask: unauthorized task -> 403" 403 \
        -X PUT "$BASE_URL$TASKS_ROUTE/$OTHER_TASK_ID" \
        -H "$AUTH_HEADER" \
        -H "Content-Type: application/json" \
        -d '{"taskTitle":"Unauthorized update"}'

    run_test "deleteTask: unauthorized task -> 403" 403 \
        -X DELETE "$BASE_URL$TASKS_ROUTE/$OTHER_TASK_ID" \
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
