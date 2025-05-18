#!/usr/bin/env node

/**
 * Script to purge the Vercel cache for specific pages 
 * This helps ensure that changes to pages are immediately visible
 */

const https = require('https');

// Path to purge
const pathsToPurge = [
  '/categories/data-entry',
  '/categories/administrative',
  '/categories/customer-support'
];

console.log('Purging cache for paths:', pathsToPurge.join(', '));

// You would need to replace these with your actual Vercel project details
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'your-project-id';
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'your-team-id';
const TOKEN = process.env.VERCEL_TOKEN || 'your-vercel-token';

// Construct the request
const data = JSON.stringify({
  paths: pathsToPurge
});

const options = {
  hostname: 'api.vercel.com',
  port: 443,
  path: `/v1/projects/${PROJECT_ID}/caches?teamId=${TEAM_ID}`,
  method: 'PURGE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Cache purge successful!');
      console.log(responseData);
    } else {
      console.error('❌ Cache purge failed:', res.statusCode);
      console.error(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error during cache purge:', error);
});

req.write(data);
req.end();

// Also attempt to use the site's internal API route as a fallback
console.log('Attempting internal revalidation as a fallback...');

// Change this URL to your site URL in production
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clickclickjob.com';

const internalRevalidate = https.request({
  hostname: siteUrl.replace(/^https?:\/\//, ''),
  port: 443,
  path: '/api/purge-cache',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log('Internal revalidation status:', res.statusCode);
});

internalRevalidate.on('error', (error) => {
  console.error('Error during internal revalidation:', error);
});

internalRevalidate.write(JSON.stringify({
  secret: process.env.CACHE_PURGE_SECRET || 'development-secret',
  paths: pathsToPurge
}));

internalRevalidate.end(); 