import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '../..')

  console.log(`Loading ${mode} environment variables`)
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
      }),
    ],
    envDir: envDir,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@api': path.resolve(__dirname, './src/api'),
        '@features': path.resolve(__dirname, './src/features'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@config': path.resolve(__dirname, './src/config'),
        '@context': path.resolve(__dirname, './src/context'),
      },
    },
  }
})