# Decision Log — FinTrack Frontend

Dokumen ini mencatat keputusan teknis penting dan rasionalisasinya untuk Frontend.

## Keputusan 1: Penyusunan Panduan Deployment Terpisah
*   **Keputusan:** Membuat berkas `DEPLOY.md` yang merinci langkah-langkah deployment Vercel dan Docker khusus untuk frontend.
*   **Rasionalisasi:** Frontend Next.js memiliki alur build dan deployment (Vercel edge optimization/docker standalone build) yang berbeda dari backend Go. Dokumentasi terpisah mempermudah pemeliharaan repositori frontend secara independen.

## Keputusan 2: Penambahan `transpilePackages` untuk `lucide-react`
*   **Keputusan:** Menambahkan `transpilePackages: ['lucide-react']` pada berkas `next.config.js`.
*   **Rasionalisasi:** Mengatasi masalah resolusi impor barrel (`__barrel_optimize__`) pada build Next.js 14 yang menyebabkan ikon dari pustaka `lucide-react` menghasilkan `undefined` saat proses prerendering halaman statis.

## Keputusan 3: Penyatuan Fitur Kalender di Tab Analisis
*   **Keputusan:** Menambahkan fitur pelacak pengeluaran harian berbasis kalender di dalam tab **Analisis** menggunakan toggle tab internal, alih-alih membuat tab baru di bottom navigation bar.
*   **Rasionalisasi:** Bottom navigation bar dirancang untuk maksimal 4 item pada layar mobile agar tetap responsif dan tidak padat. Penyatuan ini juga logis karena kalender harian merupakan bagian dari analisis visual pengeluaran pengguna.
