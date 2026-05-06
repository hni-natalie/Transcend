#!/bin/sh
set -e

# echo "> [Debug] Checking user id ... "
# id -u

if [ ! -f "package.json" ]; then
    echo "> Initializing App project from build ..."
    cp -r /app_build/* /app/
    echo "> Files copied successfully!"
fi

echo "> Installing dependencies..."
npm install

# echo "> [Debug] Checking if files copied..."
# ls -la

echo "> Creating health check flag..."
touch /tmp/frontend-ready
echo "✅ Frontend ready flag created at /tmp/frontend-ready"

# exec with group user
echo "> Starting frontend ..."
exec npm run dev -- --host 0.0.0.0 --strict-port
# exec su frontend -c "npm run dev -- --host 0.0.0.0 --strict-port"
