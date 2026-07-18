import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Vite config: React + PWA plugin so the app can be "installed" to a phone's
// home screen (Add to Home Screen) without ever going through an app store.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Heartline',
        short_name: 'Heartline',
        description: 'A dating-sim / AI companion story app',
        theme_color: '#2b1b3d',
        background_color: '#2b1b3d',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  server: {
    // host: true binds to 0.0.0.0 instead of just localhost, so a phone on
    // the same WiFi network can open this laptop's LAN IP and reach the
    // game (see PLAY_GUIDE.docx's "Play on your phone" section) — without
    // this it would only ever be reachable from the laptop itself.
    host: true,
    proxy: {
      // During local dev, forward API calls to the backend server so the
      // frontend never needs to know the Anthropic API key.
      '/api': 'http://localhost:8787'
    }
  },
  preview: {
    // Same host: true + proxy, for `vite preview` (serving the production
    // build) — used by this project's Playwright smoke tests, by play.bat
    // for normal play, and for phone access over the same WiFi network.
    host: true,
    proxy: {
      '/api': 'http://localhost:8787'
    }
  }
})
