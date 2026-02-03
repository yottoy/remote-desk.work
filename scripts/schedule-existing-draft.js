#!/usr/bin/env node
/**
 * Schedule the existing Weekly Job Digest draft using correct API format
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const CAMPAIGN_ID = '155671820296520923'; // Your existing Weekly Job Digest

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

async function scheduleExistingDraft() {
  console.log('\n📧 Scheduling Existing Weekly Job Digest Draft\n');
  console.log(`Campaign ID: ${CAMPAIGN_ID}\n`);

  try {
    // Schedule for instant delivery using the correct format from docs
    console.log('⏳ Scheduling campaign for instant delivery...');
    
    const scheduleData = {
      delivery: 'instant'
    };

    const result = await makeRequest(
      `/api/campaigns/${CAMPAIGN_ID}/schedule`,
      'POST',
      scheduleData
    );

    console.log(`Response Status: ${result.status}`);
    
    if (result.status === 200 || result.status === 201) {
      console.log('✅ SUCCESS! Campaign scheduled!\n');
      console.log('Campaign Details:', JSON.stringify(result.data, null, 2));
      console.log('\n🎉 Email is being sent to your 5 subscribers!');
      console.log('\n📧 Check yotamt@gmail.com inbox in 1-2 minutes!\n');
    } else {
      console.log('❌ Failed to schedule\n');
      console.log('Response:', JSON.stringify(result.data, null, 2));
      
      if (result.status === 422 && result.data.message === 'Campaign settings missing') {
        console.log('\n💡 The draft campaign needs to be updated first.');
        console.log('   Go to dashboard and make sure it has:');
        console.log('   - Email content (from drag & drop editor)');
        console.log('   - Recipients selected (ClickClickJob group)');
        console.log('   - From email verified');
        console.log('   Then try again!\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

scheduleExistingDraft();
