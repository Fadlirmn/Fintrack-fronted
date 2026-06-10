# FinTrack — Frontend Next.js

Repositori ini berisi aplikasi antarmuka web (Frontend) untuk **FinTrack** yang dibuat menggunakan Next.js. Aplikasi ini terhubung ke backend API FinTrack yang dideploy di VPS.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router, Standalone config)
- **Language**: TypeScript
- **Styling**: TailwindCSS & Vanilla CSS
- **Deployment**: Vercel (Singapore Region `sin1`)

---

## 🚀 Panduan Deployment (Vercel)

Aplikasi ini dikonfigurasi untuk dideploy langsung di **Vercel** dengan langkah mudah:

1. Push repositori ini ke GitHub Anda.
2. Buka dashboard Vercel dan **Import Project** dari repo tersebut.
3. Di tab **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_API_URL` = `https://api.domain-vps-kamu.com`
4. Klik **Deploy**.
5. Salin URL Vercel yang dihasilkan (misal: `https://fintrack-xxx.vercel.app`) dan tambahkan ke `ALLOWED_ORIGINS` di backend `.env` VPS Anda agar tidak terkena CORS block.

Konfigurasi build, custom headers, dan optimasi CDN Singapura sudah dikonfigurasi otomatis melalui file [vercel.json](vercel.json).

---

## 💻 Pengembangan Lokal (Development)

Untuk menjalankan frontend secara lokal:

1. Install dependensi:
   ```bash
   npm install
   ```
2. Buat file `.env` di root folder (lihat `.env.example` sebagai referensi):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```
3. Jalankan server local development:
   ```bash
   npm run dev
   ```
4. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📄 File Konfigurasi Tambahan
- `vercel.json` — Konfigurasi deploy Vercel & HTTP Security Headers.
- `next.config.js` — Konfigurasi compiler Next.js dan env forwarding.
