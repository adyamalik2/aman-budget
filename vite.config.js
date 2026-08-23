import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      // autoUpdate: service worker versi baru langsung mengambil alih tanpa
      // perlu menutup semua tab dulu -- penting untuk aplikasi yang dipasang
      // di layar utama dan jarang benar-benar ditutup.
      registerType: 'autoUpdate',
      manifest: {
        name: 'AMAN Budget',
        short_name: 'AMAN Budget',
        description:
          'Aplikasi pencatatan dan perencanaan keuangan keluarga.',
        lang: 'id',
        theme_color: '#16a34a',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        categories: ['finance', 'productivity'],
        // 'maskable' sengaja berkas terpisah dengan logo lebih kecil: launcher
        // Android memangkas ikon jadi lingkaran, kalau memakai yang 'any'
        // tulisan pada logo ikut terpotong.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
})
