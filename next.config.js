/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output untuk Docker/self-hosted deployment
  output: 'standalone',

  // API backend URL
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Proxy /api/* ke backend Go agar browser tidak perlu tahu alamat internal
  // Ini bekerja saat NEXT_PUBLIC_API_URL dikosongkan (gunakan relative path)
  async rewrites() {
    const apiUrl = process.env.FINTRACK_API_INTERNAL_URL;
    if (!apiUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
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
