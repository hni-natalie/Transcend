import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
// })

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '../..')

  console.log(`Loading ${mode} environment variables`)
  
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    envDir: envDir
  }
})