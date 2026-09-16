import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.IS_PREACT': JSON.stringify('true'),
  },
  optimizeDeps: {
    include: ['@excalidraw/excalidraw'],
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
})
