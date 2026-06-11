# Deployment FinTrack (Split Vercel & VPS via Cloudflare Tunnel)

**Tanggal:** 2026-06-11  
**Status:** selesai  
**Versi:** v4  

## Konteks
Migrasi setup VPS via Cloudflare Tunnel (`server.home-sumbul.my.id`), setup deployment frontend Next.js, dan perbaikan kegagalan build/deploy.

## Keputusan & Hasil
- Menutup port publik VPS & memakai Cloudflare Tunnel.
- Menghapus Nginx & Certbot di VPS, SSL diurus Cloudflare.
- Deploy frontend di Vercel terhubung ke VPS backend.
- Menambahkan file DEPLOY.md berisi panduan lengkap deploy Vercel & Docker untuk frontend.
- Memperbaiki kegagalan build Vercel dengan:
  1. Mengubah properti `formatter` menjadi `tickFormatter` pada `YAxis` (Recharts).
  2. Menambahkan `transpilePackages: ['lucide-react']` di `next.config.js` untuk mengatasi error barrel import.

## Tindak Lanjut
- [ ] Monitor status deployment frontend di Vercel.

---
*Dibuat otomatis oleh agent · maks. 200 kata*
