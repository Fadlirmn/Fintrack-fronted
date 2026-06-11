/** @type {import('next').NextConfig} */
const nextConfig = {
  // CATATAN: output: 'standalone' TIDAK digunakan karena frontend deploy ke Vercel.
  // Vercel mengelola build dan serving otomatis.
  // Jika suatu saat ingin pindah ke Docker/VPS, tambahkan kembali: output: 'standalone'

  // API backend URL (VPS)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Keamanan: hanya izinkan domain tertentu untuk gambar
  images: {
    remotePatterns: [],
  },

  // Disable ESLint saat build production (tetap check di dev)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Transpile lucide-react untuk menghindari masalah resolusi barrel import pada server-side
  transpilePackages: ['lucide-react'],
};

module.exports = nextConfig;
