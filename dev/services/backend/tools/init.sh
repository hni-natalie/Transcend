#!/bin/sh
set -e

: "${DB_NAME:?DB_NAME must be set (e.g. in .env)}"

until pg_isready -h database -p "${DATABASE_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME"; do
    echo "Waiting for Postgres..."
    sleep 1
done

echo "✅ Postgres is ready"

echo "Enabling pgvector extension..."
export PGPASSWORD="$(cat /run/secrets/db_root)"
psql -h database -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;"
echo "✅ pgvector extension enabled"

# Initial setup
if [ ! -f "package.json" ]; then
    echo "Creating new Express project..."
    npm init -y
    npm install express
fi

npm install

echo "Generating Prisma Client for Docker..."
npx prisma generate

# Check if migrations folder exists
export PGPASSWORD="$(cat /run/secrets/db_root)"
DB_HAS_TABLES=$(psql -h database -U "$DB_USER" -d "$DB_NAME" -tAc "
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public'
);
")

# IDEMPOTENT MIGRATION LOGIC
if [ "$DB_HAS_TABLES" != "t" ]; then
    # Database is empty
    if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
        echo "🟢 Database empty but migrations exist - applying migrations..."
        npx prisma migrate deploy
    else
        echo "🟢 Database empty and no migrations - creating schema..."
        npx prisma db push
    fi
    echo "Seeding database..."
    npx prisma db seed
else
    # Database has tables
    if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
        echo "🟡 Database has tables and migrations exist - applying pending migrations..."
        npx prisma migrate deploy
    else
        echo "🟡 Database has tables but no migrations folder - skipping migrations"
    fi
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