import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api to FastAPI running on localhost:8000 in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000'
    },
    watch: {
      ignored: ['**/node_modules/**', '**/.venv/**', '**/venv/**', '**/__pycache__/**']
    }
  },
  preview: {
    port: 5173
  }
})