# Changelog — FinTrack Frontend

Semua perubahan penting pada proyek FinTrack Frontend dicatat di sini.

## [v1.0.1] - 2026-06-11

### Added
- `[Added]` Panduan deployment komprehensif `DEPLOY.md` untuk Next.js frontend (Vercel dan Docker).

### Fixed
- `[Fixed]` Error tipe data Recharts pada komponen `YAxis` di halaman dashboard (mengubah properti `formatter` menjadi `tickFormatter`).
- `[Fixed]` Kegagalan build Next.js akibat resolusi barrel import `lucide-react` pada server-side dengan menambahkan konfigurasi `transpilePackages` di `next.config.js`.
