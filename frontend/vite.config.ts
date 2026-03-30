import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // No base - GitHub Pages serves from gh-pages root
  // Assets at /assets/ resolve correctly at https://ocdeployments.github.io/Aviation/assets/
})