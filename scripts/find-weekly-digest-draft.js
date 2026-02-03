#!/usr/bin/env node
/**
 * Find the Weekly Job Digest draft in MailerLite
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'connect.mailerlite.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function findDraft() {
  console.log('\n🔍 Looking for "Weekly Job Digest" in MailerLite drafts...\n');

  try {
    // Get all campaigns (including drafts)
    console.log('Fetching all campaigns...');
    const allCampaigns = await makeRequest('/api/campaigns?limit=100');
    
    if (allCampaigns.status !== 200) {
      console.error('❌ Failed to fetch campaigns:', allCampaigns.status);
      console.error(allCampaigns.data);
      return;
    }

    const campaigns = allCampaigns.data.data || [];
    console.log(`✅ Found ${campaigns.length} total campaigns\n`);

    // Filter for drafts
    const drafts = campaigns.filter(c => c.status === 'draft' || c.status === 'ready');
    console.log(`📝 Draft/Ready campaigns (${drafts.length}):`);
    
    drafts.forEach((d, i) => {
      console.log(`\n   ${i + 1}. ${d.name}`);
      console.log(`      ID: ${d.id}`);
      console.log(`      Status: ${d.status}`);
      console.log(`      Type: ${d.type}`);
      console.log(`      Created: ${d.created_at || 'N/A'}`);
    });

    // Find Weekly Job Digest
    const weeklyDigest = campaigns.find(c => 
      c.name && c.name.toLowerCase().includes('weekly') && c.name.toLowerCase().includes('job')
    );

    if (weeklyDigest) {
      console.log('\n\n✅ FOUND: Weekly Job Digest!\n');
      console.log(`   Campaign ID: ${weeklyDigest.id}`);
      console.log(`   Name: ${weeklyDigest.name}`);
      console.log(`   Status: ${weeklyDigest.status}`);
      console.log(`   Type: ${weeklyDigest.type}`);
      
      // Get full campaign details
      console.log('\n📋 Fetching full campaign details...');
      const details = await makeRequest(`/api/campaigns/${weeklyDigest.id}`);
      
      if (details.status === 200) {
        console.log('\n📧 Campaign Details:');
        console.log(JSON.stringify(details.data.data, null, 2));
      }
      
      return weeklyDigest;
    } else {
      console.log('\n\n⚠️  "Weekly Job Digest" not found in campaigns');
      console.log('\n📋 All campaign names:');
      campaigns.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name} (${c.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findDraft();
