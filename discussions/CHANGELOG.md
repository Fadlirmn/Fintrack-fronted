# Changelog — FinTrack Frontend

Semua perubahan penting pada proyek FinTrack Frontend dicatat di sini.

## [v1.1.0] - 2026-06-11

### Added
- `[Added]` Fitur Kalender Pelacakan Pengeluaran Harian di tab Analisis (mendukung navigasi bulan, rendering hari, visualisasi nominal ringkas, dan daftar detail transaksi per tanggal).

### Changed
- `[Changed]` Mengonfigurasi `NEXT_PUBLIC_API_URL` ke domain produksi riil (`https://fintrack.home-sumbul.my.id`).
- `[Changed]` Mengubah Line Chart di halaman dashboard untuk menghitung tren pengeluaran harian dari data transaksi riil bulan berjalan alih-alih data simulasi.

### Removed
- `[Removed]` Semua data mockup dan logic bypass kegagalan koneksi offline pada halaman Login/Register dan Dashboard.

## [v1.0.1] - 2026-06-11

### Added
- `[Added]` Panduan deployment komprehensif `DEPLOY.md` untuk Next.js frontend (Vercel dan Docker).

### Fixed
- `[Fixed]` Error tipe data Recharts pada komponen `YAxis` di halaman dashboard (mengubah properti `formatter` menjadi `tickFormatter`).
- `[Fixed]` Kegagalan build Next.js akibat resolusi barrel import `lucide-react` pada server-side dengan menambahkan konfigurasi `transpilePackages` di `next.config.js`.
