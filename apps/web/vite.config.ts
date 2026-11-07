import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/data': {
        target: process.env.DATA_PROXY_TARGET ?? 'http://127.0.0.1:8080',
      },
      '/api/algorithms': {
        target: process.env.ALGORITHMS_PROXY_TARGET ?? 'http://127.0.0.1:8000',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
  },
})
