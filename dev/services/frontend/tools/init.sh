#!/bin/sh
set -e

# Initial setup
if [ ! -f "package.json" ]; then
    echo "Creating new App project..."
    npm create vite@latest . -- --template react -y
    npm install three @react-three/fiber @react-three/drei
fi

# Always install dependencies if node_modules missing or incomplete
if [ ! -d "node_modules" ] || [ ! -d "node_modules/vite" ]; then
    echo "Project exists, installing dependencies..."
    npm install
else
    echo "Project already exists, skipping ..."
fi

echo "Creating health check flag..."
touch /tmp/frontend-ready
echo "✅ Frontend ready flag created at /tmp/frontend-ready"

echo "Starting frontend ..."
exec npm run dev -- --host 0.0.0.0 --strict-port

# exec with group user when production
# exec su frontend -c "npm run dev -- --host 0.0.0.0 --strict-port"