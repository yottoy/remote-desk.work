/** @type {import('next').NextConfig} */
const path = require('path');

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
  // Remove custom distDir to use Next.js default (.next)
  // distDir: 'build',
  
  // Add experimental config for monorepo support
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
  
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig; 