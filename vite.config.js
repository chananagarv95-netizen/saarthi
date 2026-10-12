import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // `npm run dev` + `npm run api`: the frontend proxies API calls to Express.
    proxy: { '/api': 'http://localhost:3001' }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined)
      }
    }
  }
})
