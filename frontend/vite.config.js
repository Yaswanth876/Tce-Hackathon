// vite.config.js — Vite + Tailwind CSS v4 + PWA plugin configuration
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // React fast refresh support
    react(),

    // Tailwind CSS v4 — handled entirely as a Vite plugin (no postcss.config needed)
    tailwindcss(),

    // PWA — generates service worker + web manifest automatically
    VitePWA({
      registerType: 'autoUpdate',   // SW updates silently in background
      injectRegister: 'auto',       // Auto-inject the SW registration script

      // Web App Manifest — defines how the app looks when installed
      manifest: {
        name: 'Aqro ',
        short_name: 'Aqro ',
        description: 'Cleanliness reporting & officer dashboard PWA',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },

      // Workbox — pre-cache all static assets for offline support
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB — allows large images like before/after photos
        // SPA: serve index.html for all navigation routes (React Router handles them client-side)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//i, /^\/__\//i],
      },

      // Dev options — serve the manifest in dev so the browser doesn't
      // log a manifest syntax error in the console.
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],

  // Fix Cross-Origin-Opener-Policy so Firebase Google Sign-In popup
  // can communicate back via window.closed without browser warnings.
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
})
