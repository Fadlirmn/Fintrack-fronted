# Deployment FinTrack (Split Vercel & VPS via Cloudflare Tunnel)

**Tanggal:** 2026-06-11  
**Status:** selesai  
**Versi:** v5  

## Konteks
Migrasi setup VPS backend via Cloudflare Tunnel (`fintrack.home-sumbul.my.id`), deployment frontend Next.js ke Vercel, perbaikan konfigurasi otentikasi, pembersihan data mockup, dan penambahan fitur kalender harian.

## Keputusan & Hasil
- Menutup port publik VPS & mengarahkan traffic backend ke domain `fintrack.home-sumbul.my.id` via Cloudflare Tunnel.
- Menghubungkan frontend Vercel secara langsung ke domain backend produksi di `.env` & `.env.example`.
- Menghapus semua data mockup fallbacks dan bypass login offline untuk integrasi riil.
- Mengimplementasikan fitur pelacakan pengeluaran harian berbasis grid kalender interaktif di tab Analisis beserta detail daftar transaksi per tanggal.
- Mengubah grafik tren sisa dana agar terhitung secara dinamis dari transaksi riil.

## Tindak Lanjut
- [ ] Lakukan verifikasi integrasi Telegram Bot & Webhook.

---
*Dibuat otomatis oleh agent · maks. 200 kata*
