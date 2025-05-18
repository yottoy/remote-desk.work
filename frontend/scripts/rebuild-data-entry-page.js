#!/usr/bin/env node

/**
 * REBUILD DATA ENTRY CATEGORY PAGE
 * 
 * This script specifically targets the data-entry category page
 * which is showing a mock TechCorp job, and forces a rebuild.
 * 
 * Run this script with Node.js:
 * node rebuild-data-entry-page.js
 */

import 'dotenv/config';
import fetch from 'node-fetch';
import { execSync } from 'child_process';

// Configuration
const VERCEL_DOMAIN = process.env.VERCEL_DOMAIN || 'clickclickjob.com';
const TARGET_PATH = '/categories/data-entry';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

/**
 * Method 1: Force cache invalidation by accessing with no-cache headers
 */
async function invalidateCache() {
  const url = `https://www.${VERCEL_DOMAIN}${TARGET_PATH}`;
  console.log(`Attempting to invalidate cache for: ${url}`);
  
  try {
    // Send a no-cache request to force a rebuild
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'User-Agent': 'ClickClickJob-CachePurger/1.0'
      }
    });
    
    if (response.ok) {
      console.log(`✅ Cache invalidation request successful: ${TARGET_PATH}`);
      return true;
    } else {
      console.error(`⚠️ Cache invalidation request returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error invalidating cache:`, error.message);
    return false;
  }
}

/**
 * Method 2: Deploy a new build to force a refresh of all pages
 */
async function triggerRebuild() {
  console.log('Attempting to trigger a rebuild via Vercel API...');
  
  if (!VERCEL_TOKEN) {
    console.log('⚠️ No VERCEL_TOKEN found in environment. Add this to .env to use this feature.');
    return false;
  }
  
  if (!VERCEL_PROJECT_ID) {
    console.log('⚠️ No VERCEL_PROJECT_ID found in environment. Add this to .env to use this feature.');
    return false;
  }
  
  try {
    // Create the API URL with or without team ID
    let apiUrl = `https://api.vercel.com/v13/deployments`;
    
    // Add required parameters
    const params = new URLSearchParams({
      forceNew: '1',
      target: 'production'
    });
    
    // Add team ID if available
    if (VERCEL_TEAM_ID) {
      params.append('teamId', VERCEL_TEAM_ID);
    }
    
    apiUrl = `${apiUrl}?${params.toString()}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: VERCEL_PROJECT_ID,
        project: VERCEL_PROJECT_ID,
        target: 'production',
        meta: {
          githubCommitAuthorName: 'Cache Purge Script',
          githubCommitMessage: 'Rebuild to remove mock jobs'
        }
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.id) {
      console.log(`✅ Successfully triggered rebuild! Deployment ID: ${result.id}`);
      console.log('   Rebuild is now in progress. This may take a few minutes to complete.');
      return true;
    } else {
      console.error(`❌ Failed to trigger rebuild:`);
      console.error(result);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error triggering rebuild:`, error.message);
    return false;
  }
}

/**
 * Method 3: Run git commit --amend and force push to trigger a rebuild
 */
function forceGitPush() {
  console.log('Attempting to force a rebuild with git commit --amend and force push...');
  
  try {
    // Create a dummy change to globals.css to trigger a rebuild
    execSync(`echo "/* Force rebuild timestamp: ${Date.now()} */" >> src/styles/globals.css`);
    
    // Amend the previous commit
    execSync('git commit --amend --no-edit src/styles/globals.css');
    
    // Force push to trigger rebuild
    execSync('git push --force');
    
    console.log('✅ Successfully forced git push to trigger rebuild!');
    return true;
  } catch (error) {
    console.error('❌ Error with git operations:', error.message);
    console.log('   You may need to run this script in a git repository with proper permissions.');
    return false;
  }
}

/**
 * Run all available methods to ensure a rebuild
 */
async function main() {
  console.log('DATA ENTRY PAGE REBUILD');
  console.log('======================');
  console.log('Running methods to force rebuild of category page with mock job.');
  console.log(`Target: ${TARGET_PATH}\n`);
  
  // Try all methods
  const cacheInvalidated = await invalidateCache();
  console.log(); // Spacing
  
  const rebuildTriggered = await triggerRebuild();
  console.log(); // Spacing
  
  console.log('ADDITIONAL MANUAL OPTIONS:');
  console.log('------------------------');
  console.log('1. In the Vercel dashboard, go to your project and trigger a new deployment');
  console.log('2. Make a small change to your code and push to trigger a rebuild');
  console.log('3. Run the delete-techcorp-jobs.js script to remove TechCorp jobs from the database');
  console.log('4. Run the following commands in your terminal:');
  console.log('   git commit --allow-empty -m "Force rebuild to remove mock jobs"');
  console.log('   git push');
}

// Run everything
main()
  .then(() => {
    console.log('\nRebuild process completed.');
    console.log('Note: It may take several minutes for changes to propagate.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 