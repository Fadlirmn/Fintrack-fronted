# Panduan Deployment — FinTrack Frontend Next.js

Dokumen ini berisi panduan untuk mendeploy aplikasi antarmuka web (Frontend) FinTrack yang dibangun menggunakan Next.js 14.

---

## 🏗️ Arsitektur Integrasi
Aplikasi frontend Next.js dideploy di **Vercel** (atau container Docker), dan berkomunikasi secara langsung ke backend REST API Go yang berjalan di VPS di bawah Cloudflare Tunnel.

```
Browser ──→ Vercel / Docker Container (Frontend)
                │  fetch API
                ▼
      Cloudflare Tunnel (Edge)
                │
                ▼
          VPS cloudflared ──→ Go Backend :8080
```

---

## 🚀 Opsi 1: Deployment ke Vercel (Rekomendasi)

Vercel adalah platform terbaik untuk menghosting aplikasi Next.js dengan dukungan automatic deployment dan optimasi CDN edge.

### Langkah-langkah:
1. **Push Kode ke GitHub**:
   Pastikan repositori lokal Anda telah terhubung dan di-push ke GitHub:
   ```bash
   git remote add origin https://github.com/USERNAME/fintrack-frontend.git
   git branch -M main
   git push -u origin main
   ```
2. **Import Project di Vercel**:
   - Masuk ke dashboard [Vercel](https://vercel.com).
   - Klik **Add New** → **Project**.
   - Cari dan pilih repositori `fintrack-frontend` Anda.
3. **Konfigurasi Project**:
   - **Framework Preset**: Pilih `Next.js` (biasanya terdeteksi otomatis).
   - **Root Directory**: `.`
4. **Environment Variables**:
   Tambahkan variabel lingkungan berikut:
   
   | Nama Variabel | Nilai Contoh | Deskripsi |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://server.home-sumbul.my.id` | URL Backend API yang dilindungi Cloudflare Tunnel |

   > [!IMPORTANT]
   > Jangan sertakan tanda slash (`/`) di akhir URL API. Gunakan protokol HTTPS.

5. **Deploy & Region**:
   - Klik **Deploy**.
   - Secara default, konfigurasi wilayah CDN diatur ke wilayah Singapura (`sin1`) melalui berkas [vercel.json](vercel.json) untuk performa optimal di Asia Tenggara.

6. **Daftarkan URL Frontend di Backend (CORS)**:
   Setelah proses deploy selesai, Anda akan mendapatkan URL Vercel (misalnya `https://fintrack-frontend.vercel.app`).
   - Salin URL tersebut.
   - Buka konfigurasi `.env` backend di VPS dan tambahkan URL tersebut ke dalam daftar `ALLOWED_ORIGINS` untuk menghindari pemblokiran CORS:
     ```env
     ALLOWED_ORIGINS=https://fintrack-frontend.vercel.app,http://localhost:3000
     ```

---

## 🐳 Opsi 2: Deployment menggunakan Docker (Self-Hosted/VPS)

Jika Anda ingin mendeploy frontend secara mandiri (self-hosted) menggunakan Docker pada VPS Anda sendiri:

### Persyaratan:
- Docker dan Docker Compose telah terinstall di server.

### Berkas Pendukung:
- **Dockerfile**: Menggunakan multi-stage build (Node.js 20-alpine) dengan output `standalone` yang optimal untuk produksi (meminimalkan ukuran image).
- **.dockerignore**: Menghindari penyalinan direktori `node_modules` atau build artifacts lokal ke dalam image.

### Langkah-langkah Deployment Docker:
1. **Buat File `.env` Produksi**:
   Buat file `.env` di root direktori frontend VPS Anda:
   ```env
   NEXT_PUBLIC_API_URL=https://server.home-sumbul.my.id
   ```
2. **Build Docker Image**:
   Jalankan perintah berikut di direktori root frontend:
   ```bash
   docker build -t fintrack-frontend .
   ```
3. **Jalankan Kontainer**:
   Jalankan kontainer dengan memetakan port internal 3000 ke port host eksternal yang diaktifkan (misal port 3000):
   ```bash
   docker run -d \
     --name fintrack-frontend-app \
     -p 3000:3000 \
     --env-file .env \
     --restart unless-stopped \
     fintrack-frontend
   ```
4. **Verifikasi Kontainer**:
   Periksa log kontainer untuk memastikan aplikasi berjalan tanpa error:
   ```bash
   docker logs -f fintrack-frontend-app
   ```

---

## 🔒 Praktik Keamanan & Praktik Terbaik (Best Practices)
1. **Kredensial Sensitif**:
   - Jangan pernah melakukan commit file `.env` yang berisi data riil atau URL privat ke dalam repositori Git.
   - Gunakan selalu `.env.example` sebagai placeholder.
2. **HTTP Headers**:
   - Konfigurasi keamanan bawaan seperti `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, dan `Referrer-Policy` telah diaktifkan secara otomatis pada level edge melalui [vercel.json](vercel.json).
