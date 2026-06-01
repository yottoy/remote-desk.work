#!/usr/bin/env node
/**
 * Manually trigger a test digest email to your subscribers
 * This bypasses the cron schedule for immediate testing
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const CRON_SECRET = process.env.CRON_SECRET;

console.log('\n📧 Manually triggering weekly digest email...\n');
console.log('This will:');
console.log('1. Fetch your subscribers from MailerLite');
console.log('2. Fetch recent jobs from MongoDB');
console.log('3. Send email via Gmail SMTP to all active subscribers\n');

// Determine the endpoint URL
const isProduction = process.argv.includes('--production');
const endpoint = isProduction 
  ? 'https://clickclickjob-gkvykv6ig-yottoys-projects.vercel.app'
  : 'http://localhost:3000';

console.log(`📍 Target: ${endpoint}/api/digest/weekly`);
console.log(`🔑 Using CRON_SECRET: ${CRON_SECRET.substring(0, 10)}...\n`);

const url = new URL(`${endpoint}/api/digest/weekly`);

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json'
  }
};

const makeRequest = (opts) => {
  return new Promise((resolve, reject) => {
    const protocol = opts.port === 443 || endpoint.includes('https') ? https : require('http');
    
    const req = protocol.request(opts, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
};

async function sendDigest() {
  try {
    console.log('⏳ Sending request...\n');
    const result = await makeRequest(options);
    
    if (result.status === 200) {
      console.log('✅ SUCCESS! Digest sent!\n');
      console.log('Response:', JSON.stringify(result.body, null, 2));
      console.log('\n🎉 Check your subscribers\' inboxes (including spam folder)!\n');
    } else {
      console.error('❌ Failed to send digest');
      console.error(`Status: ${result.status}`);
      console.error('Response:', JSON.stringify(result.body, null, 2));
      
      if (result.status === 401) {
        console.log('\n⚠️  Authorization failed. Check your CRON_SECRET.');
      } else if (result.status === 500) {
        console.log('\n⚠️  Server error. Check the logs for details.');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Connection refused. Is your server running?');
      console.log('   For local testing: npm run dev');
      console.log('   For production: Add --production flag');
    }
  }
}

sendDigest();
