/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output untuk Docker/self-hosted deployment
  output: 'standalone',

  // Proxy /api/* ke backend Go agar browser tidak perlu tahu alamat internal.
  // Berlaku untuk SEMUA request (client-side & server-side) karena Next.js
  // akan proxy di edge/server sebelum mengirim ke browser.
  //
  // Cara kerja di Docker:
  //   Browser → https://fintrack.home-sumbul.my.id/api/... → Cloudflared
  //   → Next.js:3000 → rewrite → http://fintrack-api:8080/api/...
  //
  // NEXT_PUBLIC_API_URL harus dikosongkan ("") di Docker agar relative path digunakan.
  async rewrites() {
    const apiUrl =
      process.env.FINTRACK_API_INTERNAL_URL || 'http://fintrack-api:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/internal/:path*',
        destination: `${apiUrl}/internal/:path*`,
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
