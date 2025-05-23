#!/usr/bin/env node

/**
 * Script to force a rebuild of the site and clear any cached content
 * Usage: node force-rebuild.js
 */

const https = require('https');
const { execSync } = require('child_process');

// Paths to completely purge from the cache
const PATHS_TO_PURGE = [
  '/categories/data-entry',
  '/categories/administrative',
  '/categories/customer-service',
  '/jobs'
];

// Deployment hook from Vercel to trigger a new build
const DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK || 'prj_YwLGN5bDdnx8Mm5Q3rnhfS8GMZiP/rFPZBxWn8e';

// Step 1: Try to trigger a build via the deployment hook
console.log('🚀 Step 1: Triggering a new build via Vercel deployment hook...');
const triggerBuild = () => {
  return new Promise((resolve, reject) => {
    const req = https.request(`https://api.vercel.com/v1/integrations/deploy/${DEPLOY_HOOK}`, {
      method: 'POST',
    }, (res) => {
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ Build successfully triggered!');
        resolve(true);
      } else {
        console.log(`❌ Error triggering build: ${res.statusCode}`);
        reject(new Error(`Failed to trigger build: ${res.statusCode}`));
      }
    });

    req.on('error', (error) => {
      console.error('❌ Error during request:', error);
      reject(error);
    });

    req.end();
  });
};

// Step 2: Manual cache purging by issuing PURGE requests
console.log('🚀 Step 2: Manually purging cache for specific paths...');
const purgeCache = async () => {
  for (const path of PATHS_TO_PURGE) {
    console.log(`🧹 Purging cache for ${path}...`);
    
    try {
      // Try PURGE method first
      execSync(`curl -X PURGE "https://www.clickclickjob.com${path}"`, { stdio: 'inherit' });
      
      // Also try direct fetch with cache-busting
      execSync(`curl -H "Cache-Control: no-cache, no-store, must-revalidate" -H "Pragma: no-cache" -s "https://www.clickclickjob.com${path}?purge=true&t=$(date +%s)" -o /dev/null`, { stdio: 'inherit' });
      
      console.log(`✅ Purge request sent for ${path}`);
    } catch (error) {
      console.error(`❌ Error purging ${path}:`, error.message);
    }
  }
};

// Step 3: Manual ISR revalidation if available
console.log('🚀 Step 3: Attempting on-demand revalidation via Next.js API...');
const triggerRevalidation = async () => {
  const revalidationToken = process.env.REVALIDATION_TOKEN || 'development-token';
  
  for (const path of PATHS_TO_PURGE) {
    try {
      execSync(`curl -s "https://www.clickclickjob.com/api/revalidate?secret=${revalidationToken}&path=${path}"`, { stdio: 'inherit' });
      console.log(`✅ Revalidation triggered for ${path}`);
    } catch (error) {
      console.error(`❌ Error revalidating ${path}:`, error.message);
    }
  }
};

// Execute all steps in sequence
async function main() {
  try {
    await purgeCache();
    await triggerRevalidation();
    await triggerBuild();
    
    console.log('✨ All done! Cache should be cleared and a new build has been triggered.');
    console.log('Note: It may take a few minutes for the changes to propagate.');
  } catch (error) {
    console.error('❌ An error occurred during the process:', error);
    process.exit(1);
  }
}

main(); 