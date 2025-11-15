import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt', 'sitemap.xml'],
      manifest: {
        short_name: 'SpaceView',
        name: 'SpaceView.me - Astronomical Simulator',
        description: 'Real-time 3D sky simulator for astronomy and astrophotography planning. Observe Moon phases, Sun position, planets and stars from any location with precise calculations.',
        categories: ['education', 'science', 'photography', 'utilities'],
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#000000',
        theme_color: '#000000',
        lang: 'en',
        dir: 'ltr',
        icons: [
          { src: '/appicon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/appicon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        screenshots: [
          {
            src: '/screenshots/desktop-main.jpg',
            sizes: '1280x720',
            type: 'image/jpeg',
            form_factor: 'wide',
            label: 'SpaceView main interface showing moon and planetary positions'
          },
          {
            src: '/screenshots/mobile-main.jpg',
            sizes: '390x844',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'SpaceView mobile interface'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,glb,gltf}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.simpleicons\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-resources',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
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
