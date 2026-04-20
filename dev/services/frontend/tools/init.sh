#!/bin/sh
set -e

# echo "> [Debug] Checking user id ... "
# id -u

if [ ! -f "package.json" ]; then
    echo "> Initializing App project from build ..."
    cp -r /app_build/* /app/
    echo "> File copied successfully!"
fi

# Install dependencies if node_modules missing or incomplete.
# In Docker dev, `dev/data/frontend` is bind-mounted from the host, so `node_modules`
# may exist but be for a different platform/arch (missing rolldown native optional deps).
ROLLODOWN_BINDING_DIR="node_modules/@rolldown/binding-linux-arm64-musl"
VITE_BIN="node_modules/.bin/vite"
VITE_PACKAGE_JSON="node_modules/vite/package.json"
if [ ! -d "node_modules" ] || [ ! -x "$VITE_BIN" ] || [ ! -f "$VITE_PACKAGE_JSON" ] || [ ! -d "$ROLLODOWN_BINDING_DIR" ]; then
    echo "> Installing dependencies (including optional/native deps if needed)..."
    # rm -rf node_modules package-lock.json || true
    npm install --include=optional || npm install
else
    echo "> Project already has deps, skipping ..."
fi

# echo "> [Debug] Checking if files copied..."
# ls -la

echo "> Creating health check flag..."
touch /tmp/frontend-ready
echo "✅ Frontend ready flag created at /tmp/frontend-ready"

# exec with group user
echo "> Starting frontend ..."
exec npm run dev -- --host 0.0.0.0 --strict-port
# exec su frontend -c "npm run dev -- --host 0.0.0.0 --strict-port"
