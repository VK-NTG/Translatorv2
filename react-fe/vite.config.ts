import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars including VITE_BASE_PATH
  // @ts-ignore - process.cwd() is available at build time
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // Base path for assets - use env var from Docker build or default to '/'
    base: env.VITE_BASE_PATH || '/',
    build: {
      outDir: 'dist'
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true
        }
      }
    }
  }
})
