#!/bin/sh
set -e

# Initial setup
if [ ! -f "package.json" ]; then
    echo "> Creating new App project..."
    echo "n" | npm create vite@latest . -- --template react --no-install
    # npm install
	npm install --save-exact react@19.2.4 react-dom@19.2.4

    echo "> Install ThreeJS & TailwindCSS ..."
    # npm install three @react-three/fiber @react-three/drei
	npm install --save-exact three@0.183.2 @react-three/fiber@9.7.0 @react-three/drei@10.7.7
    npm install tailwindcss @tailwindcss/vite postcss autoprefixer
    npm install @tanstack/react-query
    
    # add import tailwind at vite.config.js & src/index.css
    sed -i '1s/^/@import "tailwindcss";\n/' src/index.css
    cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
plugins: [react(), tailwindcss()],
})
EOF
fi

# Always install dependencies if node_modules missing or incomplete
echo "> Installing dependencies..."
npm install
# if [ ! -d "node_modules" ] || [ ! -d "node_modules/vite" ]; then
#     echo "> Project exists, installing dependencies..."
#     npm install
# else
#     echo "> Project already exists, skipping ..."
# fi

echo "> Installation complete!"
ls