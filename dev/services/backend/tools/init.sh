#!/bin/sh
set -e

DB_USER=$(cat /run/secrets/db_user)
: "${DB_NAME:?DB_NAME must be set (e.g. in .env)}"

until pg_isready -h database -p "${DATABASE_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME"; do
    echo "Waiting for Postgres..."
    sleep 1
done

echo "✅ Postgres is ready"

# Initial setup
if [ ! -f "package.json" ]; then
    echo "Creating new Express project..."
    npm init -y
    npm install express
fi

# Always install dependencies if node_modules missing or incomplete
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Ensuring dependencies are up to date..."
    npm install
fi

# Check for src/index.js
if [ ! -f "src/index.js" ]; then
    echo "❌ ERROR: src/index.js not found!"
    exit 1
fi

echo "Creating health check flag..."
touch /tmp/backend-ready
echo "✅ Backend ready flag created at /tmp/backend-ready"

echo "Starting backend..."
exec su nodejs -c "node src/index.js"