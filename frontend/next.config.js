/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    // Environment variables that will be available on the client side
    API_URL: process.env.API_URL || 'http://localhost:3001/api',
    SITE_NAME: 'ClickClickJob.com',
  },
  // Configure output build directory for production
  distDir: 'build',
  // Enable static exports if needed for static hosting
  // output: 'export',
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig; 