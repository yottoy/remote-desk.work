#!/usr/bin/env node
/**
 * Test different methods to send MailerLite campaign
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const CAMPAIGN_ID = '155671820296520923';

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

async function testSendMethods() {
  console.log('\n🧪 Testing MailerLite Send Methods\n');

  const methods = [
    { name: 'Schedule Instant', path: `/api/campaigns/${CAMPAIGN_ID}/schedule`, method: 'POST', data: { delivery: { type: 'instant' } } },
    { name: 'Schedule (no body)', path: `/api/campaigns/${CAMPAIGN_ID}/schedule`, method: 'POST', data: null },
    { name: 'Send Action', path: `/api/campaigns/${CAMPAIGN_ID}/actions/send`, method: 'POST', data: null },
    { name: 'Send (no actions)', path: `/api/campaigns/${CAMPAIGN_ID}/send`, method: 'POST', data: null },
    { name: 'Trigger Send', path: `/api/campaigns/${CAMPAIGN_ID}`, method: 'PUT', data: { status: 'sent' } },
  ];

  for (const test of methods) {
    console.log(`\n📝 Testing: ${test.name}`);
    console.log(`   ${test.method} ${test.path}`);
    
    try {
      const result = await makeRequest(test.path, test.method, test.data);
      
      if (result.status === 200 || result.status === 201) {
        console.log(`   ✅ SUCCESS! Status: ${result.status}`);
        console.log(`   Response:`, JSON.stringify(result.data, null, 2));
        console.log('\n🎉 THIS METHOD WORKS! Email should be sent!\n');
        return;
      } else {
        console.log(`   ❌ Failed: ${result.status}`);
        console.log(`   Error:`, typeof result.data === 'object' ? JSON.stringify(result.data) : result.data);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n⚠️  None of the API methods worked.');
  console.log('\n💡 Solution: You may need to send manually from MailerLite dashboard:');
  console.log('   1. Go to: https://dashboard.mailerlite.com/campaigns');
  console.log(`   2. Find: "Weekly Job Digest - 5/28/2025"`);
  console.log('   3. Click "Send" or "Schedule"');
  console.log('   4. Confirm and send to your 5 subscribers\n');
}

testSendMethods();
