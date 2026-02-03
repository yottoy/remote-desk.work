#!/usr/bin/env node
/**
 * Check available MailerLite templates for use with API
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'connect.mailerlite.com',
      path: path,
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    }).on('error', reject);
  });
}

async function checkTemplates() {
  console.log('\n🔍 Checking MailerLite Templates...\n');

  try {
    // Check for saved templates
    console.log('1. Checking for saved email templates...');
    const templates = await makeRequest('/api/campaigns?filter[type]=template&limit=50');
    
    if (templates.status === 200 && templates.data.data) {
      console.log(`✅ Found ${templates.data.data.length} templates:\n`);
      templates.data.data.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.name} (ID: ${t.id})`);
        console.log(`      Type: ${t.type}, Status: ${t.status}`);
        console.log(`      Created: ${t.created_at || 'N/A'}\n`);
      });
    } else {
      console.log('⚠️  No templates found or unable to fetch');
      console.log(`   Status: ${templates.status}`);
      console.log(`   Response: ${JSON.stringify(templates.data, null, 2)}\n`);
    }

    // Check campaigns endpoint for available options
    console.log('2. Checking recent campaigns...');
    const campaigns = await makeRequest('/api/campaigns?limit=5');
    
    if (campaigns.status === 200 && campaigns.data.data) {
      console.log(`✅ Found ${campaigns.data.data.length} campaigns:\n`);
      campaigns.data.data.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name}`);
        console.log(`      ID: ${c.id}`);
        console.log(`      Type: ${c.type}, Status: ${c.status}\n`);
      });
    }

    // Check what methods we can use
    console.log('\n💡 Solution for Free Tier:\n');
    console.log('Since inline HTML content requires paid plan, you need to:');
    console.log('1. Create a template in MailerLite dashboard');
    console.log('2. Save it as a reusable template');
    console.log('3. Reference the template ID in API calls');
    console.log('\nOR:');
    console.log('4. Use the drag-and-drop editor in MailerLite dashboard');
    console.log('5. Schedule/send campaigns manually\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTemplates();
