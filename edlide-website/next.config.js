/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '10.203.0.245',
      },
    ],
  },
  // Для Turbopack в Next.js 16+
  turbopack: {
    // Пустая конфигурация для Turbopack
  },
}

module.exports = nextConfig