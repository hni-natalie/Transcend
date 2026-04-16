#!/bin/sh
set -e

# Supabase doesn't need local Postgres checks - it's always available
echo "Using Supabase Postgres (cloud)"

# Initial setup
if [ ! -f "package.json" ]; then
    echo "Creating new Express project..."
    npm init -y
    npm install express
fi

# Install dependencies
# npm installs will auto install any missing dependancies (removed check)
echo "Installing npm dependencies..."
npm install

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run migrations (idempotent - safe to run multiple times)
echo "Running database migrations..."
npx prisma migrate deploy

# Seed database (only runs if database is empty or seed file exists)
# if seed file exist, run it to see if there's any update since we use upsert
if npx prisma db seed --help > /dev/null 2>&1; then
    echo "Seeding database..."
    npx prisma db seed || echo "Seeding failed or already seeded"
else
    echo "No seed configuration found, skipping seed"
fi

# Check for main entry point
if [ ! -f "src/index.js" ]; then
    echo "ERROR: src/index.js not found!"
    exit 1
fi

# Create health check flag
echo "Creating health check flag..."
touch /tmp/backend-ready
echo "✅ Backend ready flag created at /tmp/backend-ready"

# Start the backend
echo "Starting backend..."
exec su nodejs -c "node src/index.js"
