#!/bin/sh
set -e

DB_USER_PASS=$(cat /run/secrets/db_user)

until mariadb --ssl=0 -h database -P 3306 -u${DB_USER} -p${DB_USER_PASS} -e "SELECT 1;"; do
    echo "Waiting for Mariadb..."
    sleep 1
done

# Initial setup
if [ ! -f "package.json" ]; then
    echo "Creating new Express project..."
    npm init -y
    npm install express
fi

# Always install dependencies if node_modules missing or incomplete
if [ ! -d "node_modules" ] || [ ! -d "node_modules/vite" ]; then
    echo "Project exists, installing dependencies..."
    npm install
else
    echo "Project already exists, skipping ..."
fi

# Check for src/index.js
if [ ! -f "src/index.js" ]; then
    echo "❌ ERROR: src/index.js not found!"
    exit 1
fi

echo "Creating health check flag..."
touch /tmp/backend-ready
echo "✅ Backend ready flag created at /tmp/backend-ready"

echo "Starting backend ..."
exec su nodejs -c "node src/index.js"
