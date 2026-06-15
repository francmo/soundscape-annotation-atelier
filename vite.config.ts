import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/maskable.svg', 'fonts/NotoSans-Regular.ttf'],
      manifest: {
        name: 'Soundscape Annotation Atelier',
        short_name: 'SA Atelier',
        description:
          'Strumento di annotazione per soundscape, field recording e composizione elettroacustica con vocabolario controllato.',
        theme_color: '#0f0d2e',
        background_color: '#0f0d2e',
        display: 'standalone',
        lang: 'it',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/maskable.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Aggiornamento forzato anti-cache: il nuovo service worker si attiva
        // subito (skipWaiting) e prende il controllo di tutte le schede aperte
        // (clientsClaim); le vecchie precache vengono eliminate. NON tocca
        // IndexedDB, quindi i progetti salvati restano intatti.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ttf,json,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/fonts/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sa-atelier-fonts',
              expiration: { maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
})
