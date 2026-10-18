import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // o chunk do three.js (Experience) é carregado sob demanda, depois do HUD
    chunkSizeWarningLimit: 1100,
  },
})
