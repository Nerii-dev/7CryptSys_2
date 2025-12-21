import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // A linha 'root' foi removida, pois o index.html
  // está agora na mesma pasta que este arquivo.
  build: {
    // A pasta de build será 'dist' NA RAIZ do projeto
    outDir: '../dist'
  }
})