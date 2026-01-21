#!/usr/bin/env node

/**
 * Revalidate Sitemap After Job Deletions
 * 
 * This script forces sitemap regeneration by purging cache.
 * Run this after bulk job deletions to immediately update the sitemap.
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';

const sitemapUrls = [
  '/sitemap.xml',
  '/sitemap-jobs.xml',
];

async function revalidateSitemap() {
  console.log('🔄 Revalidating sitemaps...\n');
  
  for (const sitemapPath of sitemapUrls) {
    const url = `${BASE_URL}${sitemapPath}`;
    
    try {
      console.log(`   Fetching: ${url}`);
      
      // Make a request with cache-busting
      const urlWithBust = `${url}?_t=${Date.now()}`;
      const protocol = BASE_URL.startsWith('https') ? https : http;
      
      await new Promise((resolve, reject) => {
        protocol.get(urlWithBust, { headers: { 'Cache-Control': 'no-cache' } }, (res) => {
          if (res.statusCode === 200) {
            console.log(`   ✅ Revalidated successfully (${res.statusCode})`);
            resolve();
          } else {
            console.log(`   ⚠️  Status: ${res.statusCode}`);
            resolve();
          }
          
          // Consume response data to free up memory
          res.on('data', () => {});
          res.on('end', () => {});
        }).on('error', reject);
      });
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Sitemap revalidation complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Submit updated sitemap to Google Search Console');
  console.log('2. Request URL removals for deleted job pages');
  console.log('3. Monitor GSC for indexing improvements');
}

revalidateSitemap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

