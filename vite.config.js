import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the Express server (see server/index.js).
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
