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
    API_URL: process.env.API_URL || 'http://localhost:3000/api',
    SITE_NAME: 'ClickClickJob.com',
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB || 'clickclickjob'
  },
  // Remove custom distDir to use Next.js default (.next)
  // distDir: 'build',
  
  // Remove the experimental config that's causing path duplication
  experimental: {
    // outputFileTracingRoot removed to fix deployment path issues
  },
  
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  output: 'standalone',
  
  // Changed to true to ensure consistent URL patterns
  trailingSlash: true,
  
  // Add headers for CORS and caching
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Accept',
          }
        ],
      },
      {
        // Add longer cache for static assets
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        // Add caching for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
          }
        ],
      }
    ];
  },
  
  // Add custom rewrites and redirects to handle 404s more gracefully
  async rewrites() {
    return [
      {
        // Rewrite any unmatched routes to the 404 page without changing the URL
        source: '/:path*',
        destination: '/_404',
        has: [
          {
            type: 'header',
            key: 'x-matched-path',
            value: '((?!_next|api).*)'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig; 