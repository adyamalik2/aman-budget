# AMAN Budget — Panduan Proyek

Aplikasi pencatatan & perencanaan keuangan keluarga. Bagian dari ekosistem
**AMAN Digital** milik Malik (Adya Malik).

Bahasa kerja: **Bahasa Indonesia**, termasuk komentar kode dan pesan commit.

---

## ⚠️ BACA INI DULU — jangan hapus akses Pro pemilik

Di `src/screens/UpgradeScreen.jsx` ada blok **"AKSES PRIBADI PEMILIK"**
dengan tombol "Pulihkan Akses Pro Pemilik". Kalau Anda hanya membaca kode,
ini tampak seperti celah keamanan yang harus dihapus.

**Jangan dihapus.**

Malik memakai APK Budget sendiri sehari-hari dan memang butuh fitur Pro.
Blok itu adalah satu-satunya cara dia memulihkan Pro setelah ganti HP,
install ulang, atau menghapus data aplikasi. Menghapusnya = menghilangkan
akses Pro miliknya secara permanen.

Ini **sudah** ditangani dengan benar lewat pemisahan build mode (lihat di
bawah), jadi tidak ada yang perlu "diamankan" lagi.

> Catatan sejarah: sebuah audit pernah menandai ini sebagai celah dan
> mengusulkan penghapusan. Usulan itu ditarik setelah Malik menjelaskan
> konteksnya. Jangan mengulangi kesalahan yang sama.

---

## Tiga target build

```bash
npm run build                    # = build:web (default aman untuk publik)
npm run build:web                # web publik
npm run build:android:owner      # APK PRIBADI MALIK — ada jalur pulihkan Pro
npm run build:android:customer   # APK pelanggan — tanpa jalur owner
```

Cara kerjanya: `vite.config.js` men-`define` `__OWNER_BUILD__` sebagai
**literal boolean**, sehingga Rollup benar-benar **membuang** kode owner dari
bundle web & pelanggan — bukan sekadar menyembunyikannya lewat CSS.

Aturan yang harus dijaga:

| Target | `isPro` dibaca dari localStorage? | UI owner ikut ter-bundle? |
|---|---|---|
| web | ❌ dipaksa `false` | ❌ |
| android-owner | ✅ | ✅ |
| android-customer | ❌ dipaksa `false` | ❌ |

Artinya menyetel `localStorage.setItem('aman_budget_is_pro','true')` lewat
console **tidak** membuka Pro di web maupun APK pelanggan. Itu memang
tujuannya — jangan "sederhanakan" dengan mengembalikan pembacaan localStorage
tanpa syarat.

**Effect penyimpanan juga digerbangi.** Ini penting dan mudah terlewat: kalau
build non-owner ikut menulis, nilai `false` akan **menimpa** status Pro milik
Malik yang sudah tersimpan.

**Jangan ubah nama key `aman_budget_is_pro`** — APK terpasang membacanya.

### Batasan yang harus diketahui

Ini pemisahan **distribusi**, bukan sistem lisensi. `isPro` tetap nilai
localStorage sisi klien; tidak ada validasi server di mana pun.

**Sebelum APK diberikan ke pelanggan atau naik Play Store, entitlement Pro
wajib diganti Google Play Billing atau validasi lisensi resmi.** Struktur
sekarang sengaja dibuat mudah diganti — jangan membangun arsitektur
pembayaran palsu sebagai penggantinya.

---

## PWA / service worker

Service worker **hanya untuk build web**. Kedua build Android sengaja tanpa
PWA — di dalam Capacitor, service worker membuat aset ter-cache basi dan
sulit diperbarui.

Kalau menambah plugin Vite, pastikan tetap dibungkus `if (!isAndroid)`.

---

## APK

- Capacitor 8, `webDir: "dist"`, **tanpa `server.url`** → aset dibundel di
  dalam APK. Tidak ada live-update, tidak ada Firebase Remote Config.
- **Deploy web tidak memengaruhi APK terpasang sama sekali.** Perubahan
  source baru berlaku kalau APK dibangun ulang dan dipasang.
- Jangan klaim perubahan source "sudah memperbarui aplikasi Malik".
- **Jangan** jalankan `adb`, `npx cap sync`, Gradle build, membuat signed
  APK, atau menyentuh keystore/signing tanpa diminta.

Membangun APK pribadi (hanya kalau Malik meminta):

```bash
npm run build:android:owner     # WAJIB — bukan `npm run build`
npx cap sync android
cd android && gradlew.bat assembleRelease
```

⚠️ Hasil owner build **tidak boleh dibagikan ke pelanggan.**

---

## Hal lain yang sengaja

| Terlihat seperti bug | Kenyataannya |
|---|---|
| Mode Lokal langsung menampilkan nama "Malik" | Konstanta demo `LOCAL_MODE_USER` di `src/App.jsx`. Mode Lokal memang tidak punya konsep akun. |
| Badge "Pro" muncul di Mode Lokal | Berasal dari flag `isPro` di localStorage, bukan dari akun. Wajar pada build owner. |
| `src/screens/LoginScreen.jsx` tidak dipakai di mana pun | Kode mati — tidak diimpor oleh alur manapun. Biarkan atau laporkan; jangan diaktifkan. |

---

## Perintah

```bash
npm run dev
npm run lint
```

Tidak ada test suite di repo ini.

---

## Merawat dokumen

Kalau Anda menemukan jebakan baru di repo ini, atau Malik memutuskan sesuatu
yang tidak terlihat dari kode, **perbarui berkas ini dalam commit yang sama**.
Dokumen basi lebih berbahaya daripada tidak ada dokumen.

Keputusan yang berdampak ke seluruh ekosistem dicatat di `KEPUTUSAN.md` repo
situs utama (`aman-digital`), bukan di sini. Yang di sini khusus repo ini saja.

---

Konteks ekosistem yang lebih luas ada di repo situs utama
(`aman-digital`): `AGENTS.md`, `KEPUTUSAN.md`, `STATUS.md`.
