import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Force hash pour les fichiers GLB et CSV
          if (assetInfo.name?.match(/\.(glb|gltf|csv)$/i)) {
            return 'assets/[name]-[hash][extname]';
          }
          // Comportement par défaut pour les autres assets
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
})
