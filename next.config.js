/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },
  // Asegurar que CSS se compile correctamente
  experimental: {
    optimizeCss: false,
  },
}

module.exports = nextConfig

