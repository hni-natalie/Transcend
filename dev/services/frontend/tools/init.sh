#!/bin/sh
set -e

# echo "> [Debug] Checking user id ... "
# id -u

if [ ! -f "package.json" ]; then
    echo "> Initializing App project from build ..."
    cp -r /app_build/* /app/
    # cp -r /app_build/.[!.]* /app/ 2>/dev/null || true
    echo "> File copied successfully!"
fi

# Install dependencies if node_modules missing or incomplete
if [ ! -d "node_modules" ] || [ ! -d "node_modules/vite" ]; then
    echo "> Project exists, installing dependencies..."
    npm install
else
    echo "> Project already exists, skipping ..."
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
