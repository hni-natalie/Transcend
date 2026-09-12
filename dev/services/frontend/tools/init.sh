#!/bin/sh
set -e

# echo "> [Debug] Checking user id ... "
# id -u

if [ ! -f "package.json" ]; then
    echo "> Initializing App project from build ..."
    cp -r /app_build/* /app/
    echo "> Files copied successfully!"
fi

echo "> Fixing /app permissions..."
chown -R frontend:frontend /app

echo "> Installing dependencies..."
# can remove node_modules & package.lock for clean install

if [ -d node_modules ]; then
    echo "> node_modules exists, clearing for clean install..."
    rm -rf node_modules
fi
if [ -d package-lock.json ]; then
    echo "> package-lock.json exists, clearing for clean install..."
    rm -rf package-lock.json 
fi

su frontend -c "npm install"

# echo "> [Debug] Checking if files copied..."
# ls -la

# [debug] Check ownership
# stat -c '%u:%g %n' /app /app/node_modules /app/node_modules

echo "> Creating health check flag..."
touch /tmp/frontend-ready
echo "✅ Frontend ready flag created at /tmp/frontend-ready"

# exec with group user
echo "> Starting frontend ..."
# exec npm run dev -- --host 0.0.0.0 --strict-port
exec su frontend -c "npm run dev -- --host 0.0.0.0 --strict-port"
