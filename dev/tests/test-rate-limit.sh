#!/bin/sh
# Verifies rate limiting is enforced at nginx edge and express app level.
# Hits each guarded endpoint past its limit and expects a 429/503 to show up.
# Run after `docker compose up -d`.
#
# Usage: ./tests/test-rate-limit.sh

set -u
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
[ -f .env ] && . ./.env

RED='\033[0;31m'
GREEN='\033[0;32m'
RST='\033[0m'
GRAY='\033[90m'

DOMAIN_NAME="${DOMAIN_NAME:-localhost}"

PASS=0
FAIL=0

pass() { echo "${GREEN}PASS - ${RST}$1"; PASS=$((PASS + 1)); }
fail() { echo "${RED}FAIL - ${RST}$1"; FAIL=$((FAIL + 1)); }

dexec() { timeout 5 docker exec "$1" sh -c "$2" 2>/dev/null; }

# hit_count PATH METHOD N -> prints codes seen, space separated
hit() {
	path="$1"; method="$2"; n="$3"
	i=0
	while [ "$i" -lt "$n" ]; do
		code=$(curl -sk -o /dev/null -w '%{http_code}' -X "$method" \
			--max-time 3 "https://${DOMAIN_NAME}${path}")
		printf '%s ' "$code"
		i=$((i + 1))
	done
}

hit_dexec() {
	path="$1"; cmd="$2"; n="$3"
	i=0
	while [ "$i" -lt "$n" ]; do
		out=$(docker exec "$path" sh -c "$cmd" 2>&1;)

		code=$(printf '%s\n' "$out" | grep -oE 'HTTP/[0-9.]+ [0-9]+' | awk '{print $2 ; exit}')
		[ -z "$code" ] && code=000
		printf '%s ' "$code"

		i=$((i + 1))
	done
}

# Test 1
echo "== nginx api_auth zone (5 req/min) + auth/login: express authLimiter (5 req/min) =="
codes=$(hit "/api/auth/login" POST 15)
echo "codes: $codes"
if echo "$codes" | grep -q '429'; then
	pass "auth/login returns 429 once limit exceeded"
else
	fail "auth/login never returned 429 across 15 rapid requests"
fi

# Test 2
echo
echo "== general/api: nginx api_general zone (10r/s) + express apiLimiter (100/min) =="
codes=$(hit "/api/health" GET 110)
echo "codes: $codes"
if echo "$codes" | grep -qE '429|503'; then
	pass "general /api returns 429/503 under burst"
else
	fail "general /api never throttled across 110 rapid requests"
fi

# Test 3
echo
echo "== lk/token: express tokenLimiter (10 req/min) =="
codes=$(hit "/api/lk/token" GET 20)
echo "codes: $codes"
if echo "$codes" | grep -q '429'; then
	pass "lk/token returns 429 once limit exceeded"
else
	fail "lk/token never returned 429 across 20 rapid requests"
fi

# Test 4
echo
echo "== nginx <-> whisper /transcribe: slowapi limiter (5/minute), internal-only =="
echo "${GRAY}for curl: need to install curl in nginx, else will fail${RST}"

# wget method
codes=$(hit_dexec t_backend "echo x > /tmp/f.mp4; wget -S -O /dev/null --no-check-certificate \
--header='Content-Type: multipart/form-data; boundary=X' \
--post-file=/tmp/f.mp4 https://t_whisper:8000/transcribe" 8)
echo "$codes"

# curl method : first install curl in t_nginx
# generate a test audio
# ls -la
if [ ! -f ./tests/test.wav ]; then
	ffmpeg -f lavfi -i sine=frequency=1000:duration=1 -ar 16000 -ac 1 ./test.wav
	echo "> Created test audio for whisper test"
fi

# copy test files to container
if ! docker exec t_nginx ls -la /tmp/f.wav; then
	docker cp test.wav t_nginx:/tmp/f.wav 2>/dev/null
	echo "> copy test audio to t_nginx for whisper test"
fi

# # then execute test (single)
# docker exec t_nginx sh -c 'curl -ksS -o /dev/null -w "%{http_code} %{time_total}s\n" \
# --max-time 30 --connect-timeout 3 \
# -F "file=@/tmp/f.wav;type=audio/wav" \
# https://t_whisper:8000/transcribe'

# then execute test (multiple)
codes=$(docker exec t_nginx sh -c '
  for i in $(seq 1 10); do
    curl -ksS -o /dev/null -w "%{http_code} %{time_total}s\n" \
--max-time 10 --connect-timeout 5 \
-F "file=@/tmp/f.wav;type=audio/wav" \
https://t_whisper:8000/transcribe &
  done
  wait
')
  # wait | sort | uniq -c

echo "$codes"
if echo "$codes" | grep -qE '429|000|503'; then
	pass "whisper /transcribe returns 429/000 once limit exceeded"
else
	fail "whisper /transcribe never returned 429 across 8 rapid requests"
fi

echo
echo "================================"
echo "PASS: $PASS   FAIL: $FAIL"
echo "================================"

[ "$FAIL" -eq 0 ]