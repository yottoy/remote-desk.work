/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Temporarily ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    // Environment variables that will be available on the client side
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://www.clickclickjob.com',
    NEXT_PUBLIC_SITE_URL: 'https://www.clickclickjob.com',
    SITE_NAME: 'ClickClickJob.com',
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB || 'clickclickjob'
  },
  
  // Fix for dynamic routes
  onDemandEntries: {
    // Keep the dynamic pages in memory for longer
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    // Number of pages to keep in memory
    pagesBufferLength: 5,
  },
  
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  output: 'standalone',
  
  // Enable asset prefix for proper static file serving
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
  
  // Ensure build reproducibility
  generateBuildId: async () => {
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return process.env.VERCEL_GIT_COMMIT_SHA;
    }
    return null; // Use default behavior
  },
  
  // Changed to false to ensure clean URLs
  trailingSlash: false,
  
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
        // Reduce caching for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control', value: 'public, max-age=0, s-maxage=30, stale-while-revalidate=60',
          }
        ],
      }
    ];
  },
  
  // Add custom rewrites and redirects to handle 404s more gracefully
  async rewrites() {
    return [
      // Ensure API requests are handled correctly
      {
        source: '/api/jobs/:id',
        destination: '/api/jobs/:id',
      },
      // SEO keyword landing pages
      {
        source: '/remote-data-entry-jobs-no-experience',
        destination: '/[keyword]?keyword=remote-data-entry-jobs-no-experience',
      },
      {
        source: '/legitimate-work-from-home-admin-jobs',
        destination: '/[keyword]?keyword=legitimate-work-from-home-admin-jobs',
      },
      {
        source: '/virtual-assistant-jobs-part-time-remote',
        destination: '/[keyword]?keyword=virtual-assistant-jobs-part-time-remote',
      },
      {
        source: '/entry-level-remote-administrative-assistant',
        destination: '/[keyword]?keyword=entry-level-remote-administrative-assistant',
      },
      {
        source: '/work-from-anywhere-data-entry-positions',
        destination: '/[keyword]?keyword=work-from-anywhere-data-entry-positions',
      },
      {
        source: '/remote-executive-assistant-jobs-full-time',
        destination: '/[keyword]?keyword=remote-executive-assistant-jobs-full-time',
      },
      {
        source: '/online-administrative-jobs-no-scams',
        destination: '/[keyword]?keyword=online-administrative-jobs-no-scams',
      },
      {
        source: '/beginner-friendly-remote-admin-positions',
        destination: '/[keyword]?keyword=beginner-friendly-remote-admin-positions',
      },
    ];
  }
};

module.exports = nextConfig; 