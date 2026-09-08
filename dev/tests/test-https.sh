#!/bin/sh
# Verifies https end-to-end using curl/wget: confirms https works and plain
# http is refused, at each hop (browser<->nginx, backend self, whisper self).
# Run after `docker compose up -d`.
#
# Usage: ./tools/test-https-curl.sh

set -u
cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
[ -f .env ] && . ./.env

RED='\033[0;31m'
GREEN='\033[0;32m'
RST='\033[0m'

DOMAIN_NAME="${DOMAIN_NAME:-localhost}"
BACKEND_PORT="${BACKEND_PORT:-3000}"

PASS=0
FAIL=0

pass() { echo "${GREEN}PASS - ${RST}$1"; PASS=$((PASS + 1)); }
fail() { echo "${RED}FAIL - ${RST}$1"; FAIL=$((FAIL + 1)); }

dexec() { timeout 5 docker exec "$1" sh -c "$2" 2>/dev/null; }

echo "== containers up =="
for c in t_nginx t_backend t_whisper; do
	if docker ps --format '{{.Names}}' | grep -qx "$c"; then
		pass "container $c running"
	else
		fail "container $c not running"
	fi
done

echo
echo "== edge: browser <-> nginx =="
if curl -sk -o /dev/null -w '%{http_code}' "https://${DOMAIN_NAME}/" | grep -qE '^[23]'; then
	pass "nginx serves https on 443"
else
	fail "nginx not reachable over https on 443"
fi

if curl -s --max-time 3 "http://${DOMAIN_NAME}/" >/dev/null 2>&1; then
	fail "nginx also answers plain http (should be https-only, no port 80 published)"
else
	pass "nginx does not answer plain http"
fi

echo
echo "== nginx <-> backend (internal proxy) =="
code=$(curl -sk -o /dev/null -w '%{http_code}' "https://${DOMAIN_NAME}/api/health")
if [ "$code" != "502" ] && [ "$code" != "000" ]; then
	pass "nginx->backend proxy reaches backend over https (got $code, not 502/000)"
else
	fail "nginx->backend proxy failed (got $code) - check proxy_pass scheme / proxy_ssl_verify"
fi

echo
echo "== backend serves https itself =="
if dexec t_backend "wget -q -O- --no-check-certificate https://localhost:${BACKEND_PORT}/api/health" >/dev/null; then
	pass "backend answers on https internally"
else
	fail "backend not answering https on ${BACKEND_PORT} inside container"
fi

if dexec t_backend "wget -q -O- --timeout=3 http://localhost:${BACKEND_PORT}/api/health" >/dev/null; then
	fail "backend also answers plain http on ${BACKEND_PORT} (should be https-only)"
else
	pass "backend rejects plain http on ${BACKEND_PORT}"
fi

echo
echo "== whisper serves https itself =="
if dexec t_whisper "wget -q -O- --no-check-certificate https://localhost:8000/" >/dev/null; then
	pass "whisper answers on https internally"
else
	fail "whisper not answering https on 8000 inside container"
fi

if dexec t_whisper "wget -q -O- http://localhost:8000/" >/dev/null 2>&1; then
	fail "whisper also answers plain http on 8000 (should be https-only)"
else
	pass "whisper rejects plain http on 8000"
fi

echo
echo "== frontend vite serves https itself =="
if dexec t_frontend "wget -q -O- --no-check-certificate https://127.0.0.1:5173/" >/dev/null; then
	pass "frontend answers on https internally"
else
	fail "frontend not answering https on 5173 inside container"
fi

if dexec t_frontend "wget -q -O- http://127.0.0.1:5173/" >/dev/null 2>&1; then
	fail "frontend also answers plain http on 5173 (should be https-only)"
else
	pass "frontend rejects plain http on 5173"
fi

echo
echo "== shared cert consistency (same cert, per earlier decision) =="
nginx_sum=$(dexec t_nginx "sha256sum /etc/nginx/ssl/${DOMAIN_NAME}.crt 2>/dev/null | cut -d' ' -f1")
backend_sum=$(dexec t_backend "sha256sum /etc/ssl/certs/app/${DOMAIN_NAME}.crt 2>/dev/null | cut -d' ' -f1")
whisper_sum=$(dexec t_whisper "sha256sum /etc/ssl/certs/app/${DOMAIN_NAME}.crt 2>/dev/null | cut -d' ' -f1")

if [ -n "$nginx_sum" ] && [ "$nginx_sum" = "$backend_sum" ] && [ "$nginx_sum" = "$whisper_sum" ]; then
	pass "nginx/backend/whisper share identical cert ($nginx_sum)"
else
	fail "cert mismatch: nginx=$nginx_sum backend=$backend_sum whisper=$whisper_sum"
fi

echo
echo "== static scan in nginx.conf: no stray internal http:// left =="
hits=$(grep -rnE "http://(backend|t_whisper|t_backend|frontend_upstream|backend_upstream)" \
	data/backend/src services/nginx/conf 2>/dev/null)
if [ -z "$hits" ]; then
	pass "no plain-http internal service URLs found in backend src / nginx conf"
else
	fail "found plain-http internal URLs:
$hits"
fi

echo
echo "================================"
echo "PASS: $PASS   FAIL: $FAIL"
echo "================================"

[ "$FAIL" -eq 0 ]
