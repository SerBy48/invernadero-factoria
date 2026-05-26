import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/oauth2': { target: BACKEND, changeOrigin: true },
      '/login': { target: BACKEND, changeOrigin: true },
      '/logout': { target: BACKEND, changeOrigin: true },
    }
  }
})
