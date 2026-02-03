#!/usr/bin/env node
/**
 * MailerLite Integration Diagnostic Script
 * 
 * This script tests your MailerLite setup and identifies why emails aren't being sent
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testMailerLite() {
  log(`\n${colors.bold}${colors.blue}===========================================`, colors.blue);
  log('MailerLite Integration Diagnostic', colors.blue);
  log(`===========================================${colors.reset}\n`);

  const API_KEY = process.env.MAILERLITE_API_KEY;
  const GROUP_ID = process.env.MAILERLITE_GROUP_ID;

  // Step 1: Check environment variables
  log(`${colors.bold}Step 1: Environment Variables${colors.reset}`);
  if (!API_KEY) {
    log('✗ MAILERLITE_API_KEY not found', colors.red);
    return;
  }
  log(`✓ MAILERLITE_API_KEY configured (${API_KEY.substring(0, 20)}...)`, colors.green);
  
  if (!GROUP_ID) {
    log('✗ MAILERLITE_GROUP_ID not found', colors.red);
    return;
  }
  log(`✓ MAILERLITE_GROUP_ID configured (${GROUP_ID})`, colors.green);

  // Step 2: Test API connection
  log(`\n${colors.bold}Step 2: API Connection Test${colors.reset}`);
  try {
    const options = {
      hostname: 'connect.mailerlite.com',
      path: '/api/subscribers',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const result = await makeRequest(options);
    if (result.status === 200) {
      log('✓ Successfully connected to MailerLite API', colors.green);
      log(`  Found ${result.body.data?.length || 0} subscribers`, colors.blue);
    } else {
      log(`✗ API connection failed: ${result.status}`, colors.red);
      log(`  Response: ${JSON.stringify(result.body).substring(0, 200)}`, colors.yellow);
    }
  } catch (error) {
    log(`✗ API connection error: ${error.message}`, colors.red);
  }

  // Step 3: Check verified sender emails
  log(`\n${colors.bold}Step 3: Verified Sender Emails${colors.reset}`);
  try {
    const options = {
      hostname: 'connect.mailerlite.com',
      path: '/api/campaigns/senders',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const result = await makeRequest(options);
    if (result.status === 200 && result.body.data) {
      const senders = result.body.data;
      if (senders.length === 0) {
        log('✗ No verified sender emails found!', colors.red);
        log('  → You need to verify at least one sender email in MailerLite', colors.yellow);
        log('  → Go to: https://dashboard.mailerlite.com/settings/senders', colors.yellow);
      } else {
        log(`✓ Found ${senders.length} verified sender(s):`, colors.green);
        senders.forEach(sender => {
          log(`  • ${sender.email} (${sender.name || 'No name'})`, colors.blue);
        });
        
        // Check if hi@clickclickjob.com is verified
        const hasHi = senders.some(s => s.email === 'hi@clickclickjob.com');
        if (!hasHi) {
          log(`\n⚠️  WARNING: hi@clickclickjob.com is NOT verified!`, colors.yellow);
          log(`  Your digest emails use this sender address but it's not verified.`, colors.yellow);
          log(`  → Add and verify hi@clickclickjob.com as a sender`, colors.yellow);
        } else {
          log(`\n✓ hi@clickclickjob.com is verified and ready to send!`, colors.green);
        }
      }
    } else {
      log(`✗ Failed to fetch senders: ${result.status}`, colors.red);
    }
  } catch (error) {
    log(`✗ Error fetching senders: ${error.message}`, colors.red);
  }

  // Step 4: Check subscriber group
  log(`\n${colors.bold}Step 4: Subscriber Group${colors.reset}`);
  try {
    const options = {
      hostname: 'connect.mailerlite.com',
      path: `/api/groups/${GROUP_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const result = await makeRequest(options);
    if (result.status === 200) {
      const group = result.body.data;
      log(`✓ Group found: "${group.name}"`, colors.green);
      log(`  Active subscribers: ${group.active_count || 0}`, colors.blue);
      log(`  Total subscribers: ${group.total_count || 0}`, colors.blue);
      
      if (group.active_count === 0) {
        log(`\n⚠️  WARNING: No active subscribers in this group!`, colors.yellow);
        log(`  Emails won't be sent to anyone even if campaigns are created.`, colors.yellow);
      }
    } else {
      log(`✗ Group not found: ${result.status}`, colors.red);
      log(`  Check if group ID ${GROUP_ID} is correct`, colors.yellow);
    }
  } catch (error) {
    log(`✗ Error fetching group: ${error.message}`, colors.red);
  }

  // Step 5: List recent campaigns
  log(`\n${colors.bold}Step 5: Recent Campaigns${colors.reset}`);
  try {
    const options = {
      hostname: 'connect.mailerlite.com',
      path: '/api/campaigns?limit=5',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const result = await makeRequest(options);
    if (result.status === 200 && result.body.data) {
      const campaigns = result.body.data;
      if (campaigns.length === 0) {
        log('ℹ️  No campaigns found', colors.blue);
      } else {
        log(`Found ${campaigns.length} recent campaign(s):`, colors.green);
        campaigns.forEach(campaign => {
          const statusColor = campaign.status === 'sent' ? colors.green : 
                             campaign.status === 'draft' ? colors.yellow : colors.blue;
          log(`  • ${campaign.name || 'Untitled'}`, colors.blue);
          log(`    Status: ${campaign.status}`, statusColor);
          log(`    Created: ${new Date(campaign.created_at).toLocaleString()}`, colors.blue);
          if (campaign.status === 'draft') {
            log(`    ⚠️  Campaign is in DRAFT status - not sent!`, colors.yellow);
          }
        });
      }
    }
  } catch (error) {
    log(`✗ Error fetching campaigns: ${error.message}`, colors.red);
  }

  // Step 6: Check cron configuration
  log(`\n${colors.bold}Step 6: Cron Configuration${colors.reset}`);
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log('✗ CRON_SECRET not configured', colors.red);
  } else {
    log(`✓ CRON_SECRET configured`, colors.green);
  }
  
  log(`\nℹ️  Cron job scheduled for: Mondays at 14:00 UTC (2 PM UTC)`, colors.blue);
  log(`   Next run: Check Vercel dashboard → Cron Jobs`, colors.blue);

  // Summary and recommendations
  log(`\n${colors.bold}${colors.blue}===========================================`);
  log('Summary & Recommendations');
  log(`===========================================${colors.reset}\n`);

  log(`${colors.bold}Common Issues:${colors.reset}`);
  log(`1. Unverified sender email - campaigns created but not sent`, colors.yellow);
  log(`2. No active subscribers - campaigns sent to no one`, colors.yellow);
  log(`3. Campaigns stuck in draft - need manual approval`, colors.yellow);
  log(`4. Cron not triggering - check Vercel dashboard`, colors.yellow);

  log(`\n${colors.bold}Next Steps:${colors.reset}`);
  log(`1. Verify hi@clickclickjob.com in MailerLite`, colors.blue);
  log(`   → https://dashboard.mailerlite.com/settings/senders`);
  log(`2. Check your subscriber count`, colors.blue);
  log(`   → https://dashboard.mailerlite.com/subscribers`);
  log(`3. Review recent campaigns`, colors.blue);
  log(`   → https://dashboard.mailerlite.com/campaigns`);
  log(`4. Test manual send:`, colors.blue);
  log(`   → curl -X POST https://your-site.vercel.app/api/digest/weekly \\`);
  log(`          -H "Authorization: Bearer ${cronSecret || 'YOUR_CRON_SECRET'}" \\`);
  log(`          -H "Content-Type: application/json"\n`);
}

testMailerLite().catch(error => {
  log(`\nFatal error: ${error.message}`, colors.red);
  process.exit(1);
});
