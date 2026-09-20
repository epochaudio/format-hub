import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { portableKatexPlugin } from './scripts/katex-fonts.mjs'

export default defineConfig({
  plugins: [react(), portableKatexPlugin()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('virtual:format-hub-katex-css')) return 'formula-fonts'
          if (id.includes('/node_modules/katex/')) return 'katex'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
