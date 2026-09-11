import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// A human-readable identity for this build, surfaced in Settings → App version.
// Without it there is no way to tell a refresh that worked from one that silently
// served the cached app again.
function buildId(): string {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
  try {
    return `${stamp} · ${execSync('git rev-parse --short HEAD').toString().trim()}`
  } catch {
    return stamp // not a git checkout — still better than nothing
  }
}

// Base path: '/' locally, '/<repo>/' on GitHub Pages (set VITE_BASE in the deploy workflow).
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  define: {
    __BUILD_ID__: JSON.stringify(buildId()),
  },
  plugins: [
    react(),
    VitePWA({
      // autoUpdate, unlike the Health Tracker's 'prompt': there's no in-progress
      // form data here worth protecting from a surprise reload — a stale download
      // form is nothing to lose, so just always run the newest build.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'YT Downloader',
        short_name: 'YT DL',
        description: 'Personal YouTube video/audio downloader',
        theme_color: '#0b0f14',
        background_color: '#0b0f14',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
