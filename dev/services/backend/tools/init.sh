#!/bin/sh
set -e

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
    echo "⚠️  No src/index.js found. Creating basic Express server..."
    mkdir -p src
    cat > src/index.js << 'EOF'
const express = require('express');
const app = express();
const port = process.env.BACKEND_PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express + Docker!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port} !`);
});
EOF
fi

echo "Creating health check flag..."
touch /tmp/backend-ready
echo "✅ Backend ready flag created at /tmp/backend-ready"

echo "Starting backend ..."
exec su nodejs -c "node src/index.js"
