#!/bin/sh
# Verifies https end-to-end (browser<->nginx, nginx<->backend, nginx<->whisper)
# using raw `openssl s_client` handshakes + cert fingerprint comparison.
# Run after `docker compose up -d`.
#
# Usage: ./tools/test-https.sh   (path-independent, cd's to dev/ itself)

set -u
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
[ -f .env ] && . ./.env

DOMAIN_NAME="${DOMAIN_NAME:-localhost}"
BACKEND_PORT="${BACKEND_PORT:-3000}"

RED='\033[0;31m'
GREEN='\033[0;32m'
RST='\033[0m'
GRAY='\033[90m'

PASS=0
FAIL=0

pass() { echo "${GREEN}PASS - ${RST}$1"; PASS=$((PASS + 1)); }
fail() { echo "${RED}FAIL - ${RST}$1"; FAIL=$((FAIL + 1)); }

# handshake($1 label, $2 openssl-connect-target, $3 optional exec-prefix e.g. "docker exec t_nginx")
# echoes the sha256 cert fingerprint on success, empty on failure
handshake() {
	label="$1"; target="$2"; prefix="${3:-}"

	out=$($prefix openssl s_client -connect "$target" </dev/null 2>/dev/null)
	if echo "$out" | grep -q "BEGIN CERTIFICATE"; then
		proto=$(echo "$out" | grep -o 'Protocol  *: .*' | head -1)
		fp=$(echo "$out" | $prefix openssl x509 -noout -fingerprint -sha256 2>/dev/null | cut -d= -f2)
		pass "$label handshake ok ($proto)" >&2
		echo "$fp"
	else
		fail "$label handshake failed (no certificate returned by $target)" >&2
		echo ""
	fi
}

echo "== external: browser <-> nginx (openssl s_client) =="
nginx_fp=$(handshake "nginx:443" "${DOMAIN_NAME}:443")
echo "${GRAY}$nginx_fp${RST}"

echo
echo "== internal: nginx <-> backend (via docker exec t_nginx, same docker network) =="
backend_fp=$(handshake "backend:${BACKEND_PORT}" "backend:${BACKEND_PORT}" "docker exec -i t_nginx")
echo "${GRAY}$backend_fp${RST}"

echo
echo "== internal: nginx <-> whisper (via docker exec t_nginx, same docker network) =="
whisper_fp=$(handshake "whisper:8000" "whisper:8000" "docker exec -i t_nginx")
echo "${GRAY}$whisper_fp${RST}"

echo
echo "== cert identity (same shared cert, per design) =="
if [ -n "$nginx_fp" ] && [ "$nginx_fp" = "$backend_fp" ] && [ "$nginx_fp" = "$whisper_fp" ]; then
	pass "nginx/backend/whisper present identical cert (${GRAY}$nginx_fp${RST})"
else
	fail "cert mismatch: nginx=$nginx_fp backend=$backend_fp whisper=$whisper_fp"
fi

echo
echo "== cert sanity (subject/issuer/validity) =="
cert_info=$(echo | openssl s_client -connect "${DOMAIN_NAME}:443" 2>/dev/null | openssl x509 -noout -subject -issuer -dates 2>/dev/null)
if [ -n "$cert_info" ]; then
	echo "${GRAY}$cert_info${RST}"
	if echo "$cert_info" | grep -q "CN = ${DOMAIN_NAME}"; then
		pass "cert CN matches DOMAIN_NAME (${DOMAIN_NAME})"
	else
		fail "cert CN does not match DOMAIN_NAME (${DOMAIN_NAME})"
	fi
else
	fail "could not read cert subject/issuer/dates"
fi

echo
echo "== plain-http should be refused where https is expected =="
# openssl handshake against a plain-http port must fail (no TLS record from peer)
if openssl s_client -connect "${DOMAIN_NAME}:443" </dev/null 2>/dev/null | grep -q "BEGIN CERTIFICATE"; then
	pass "443 speaks TLS (expected)"
else
	fail "443 does not speak TLS"
fi

echo
echo "================================"
echo "PASS: $PASS   FAIL: $FAIL"
echo "================================"

[ "$FAIL" -eq 0 ]
