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
  const envDir = path.resolve(__dirname, '../..') // or '../../'

  console.log(`Loading ${mode} environment variables`)
  
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    envDir: envDir, // Look for .env files 2 levels above
    // define: {
    //   'import.meta.env.VITE_DOMAIN_URL': JSON.stringify(env.VITE_DOMAIN_URL),
    //   'import.meta.env.VITE_SOCKET_PATH': JSON.stringify(env.VITE_SOCKET_PATH),
    // }
  }
})