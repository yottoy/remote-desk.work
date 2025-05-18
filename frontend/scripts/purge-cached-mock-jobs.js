#!/usr/bin/env node

/**
 * PURGE CACHED MOCK JOBS
 * 
 * This script clears the Vercel cache for pages that might still display mock TechCorp jobs.
 * It sends cache invalidation requests to ensure these pages are rebuilt without mock data.
 * 
 * Run this script with Node.js to purge cached pages:
 * node purge-cached-mock-jobs.js
 */

import 'dotenv/config';
import fetch from 'node-fetch';

// Configuration
const VERCEL_DOMAIN = process.env.VERCEL_DOMAIN || 'clickclickjob.com';
const PATHS_TO_PURGE = [
  '/categories/data-entry',
  '/categories/administrative',
  '/categories/customer-service',
  '/categories/transcription',
  '/categories/virtual-assistant',
  '/categories/data-processing',
  '/jobs'
];

/**
 * Send a request to purge a specific page from cache
 */
async function purgePage(path) {
  const fullUrl = `https://www.${VERCEL_DOMAIN}${path}`;
  console.log(`Attempting to purge cache for: ${fullUrl}`);
  
  try {
    // Force Vercel to rebuild the page by sending a no-cache request
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'User-Agent': 'ClickClickJob-CachePurger/1.0'
      }
    });
    
    if (response.ok) {
      console.log(`✅ Successfully purged cache for: ${path}`);
      return true;
    } else {
      console.error(`❌ Failed to purge cache for ${path}: Status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error purging cache for ${path}:`, error.message);
    return false;
  }
}

/**
 * Purge all configured paths
 */
async function purgeAllPages() {
  console.log('CACHE PURGE: TARGETING MOCK TECHCORP JOBS');
  console.log('=========================================');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const path of PATHS_TO_PURGE) {
    const success = await purgePage(path);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nPURGE SUMMARY');
  console.log('-------------');
  console.log(`✅ Successfully purged: ${successCount} pages`);
  console.log(`❌ Failed to purge: ${failCount} pages`);
  
  if (failCount > 0) {
    console.log('\nSome pages could not be purged. You may need to:');
    console.log('1. Check your network connection');
    console.log('2. Verify the domain is correct');
    console.log('3. Manually trigger a rebuild in your Vercel dashboard');
  } else {
    console.log('\nAll pages successfully purged! The mock jobs should no longer appear.');
    console.log('Note: It may take a few minutes for the changes to fully propagate.');
  }
}

// Run the purge function
purgeAllPages()
  .then(() => {
    console.log('Cache purge process completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Purge script failed:', error);
    process.exit(1);
  }); 