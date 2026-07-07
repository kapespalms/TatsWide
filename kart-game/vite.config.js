import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import glsl from 'vite-plugin-glsl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/kart/',
  plugins: [
    react(),
    glsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Arena Kart',
        short_name: 'ArenaKart',
        start_url: '/kart/',
        display: 'standalone',
        background_color: '#FF0000',
        theme_color: '#FF0000',
        icons: [
          {
            src: 'icon.webp',
            sizes: '192x192',
            type: 'image/webp',
          },
        ],
      },
    }),
  ],
})
