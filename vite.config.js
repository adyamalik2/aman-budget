import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Tiga target distribusi yang sengaja dipisah (pola sama seperti AMAN-in):
 *
 *   npm run build:web              -> web publik (default, aman untuk umum)
 *   npm run build:android:owner    -> APK PRIBADI Malik, ada jalur pulihkan Pro
 *   npm run build:android:customer -> APK pelanggan, tanpa jalur owner
 *
 * `__OWNER_BUILD__` di-define sebagai literal boolean supaya Rollup benar-benar
 * MEMBUANG kode owner dari bundle web & customer, bukan sekadar menyembunyikan
 * lewat CSS. Ini pemisah DISTRIBUSI, bukan sistem lisensi: sebelum APK
 * diberikan ke pelanggan, entitlement Pro wajib diganti Google Play Billing
 * atau validasi lisensi resmi.
 *
 * PWA/service worker sengaja hanya untuk web. Di dalam Capacitor, service
 * worker membuat aset ter-cache basi dan sulit diperbarui.
 */
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isAndroid = mode === 'android-owner' || mode === 'android-customer'
  const isOwner = mode === 'android-owner'

  const plugins = [react()]

  if (!isAndroid) {
    plugins.push(
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
      })
    )
  }

  return {
    base: './',
    define: {
      __OWNER_BUILD__: JSON.stringify(isOwner),
    },
    plugins,
  }
})
