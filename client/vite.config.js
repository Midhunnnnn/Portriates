import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false
      },
      '/images': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false
      }
    }
  }
})
