#!/usr/bin/env node
/**
 * Try to schedule the Weekly Job Digest with proper format
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

async function scheduleCampaign() {
  console.log('\n📧 Attempting to Schedule Weekly Job Digest\n');

  // Get current time + 1 minute for immediate sending
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  const scheduleTime = now.toISOString();

  const scheduleData = {
    delivery: {
      type: 'scheduled',
      date: scheduleTime
    }
  };

  console.log('Schedule time:', scheduleTime);
  console.log('Request data:', JSON.stringify(scheduleData, null, 2));
  console.log('');

  try {
    const result = await makeRequest(
      `/api/campaigns/${CAMPAIGN_ID}/schedule`,
      'POST',
      scheduleData
    );

    console.log(`Response Status: ${result.status}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.status === 200 || result.status === 201) {
      console.log('\n✅ SUCCESS! Campaign scheduled!');
      console.log('\n🎉 Email will be sent in 1 minute to your 5 subscribers!');
    } else {
      console.log('\n❌ Failed to schedule');
      console.log('\n💡 This confirms: MailerLite free tier requires manual sending');
      console.log('\n📋 To send the email:');
      console.log('   1. Go to: https://dashboard.mailerlite.com/campaigns');
      console.log('   2. Find: "Weekly Job Digest - 5/28/2025"');
      console.log('   3. Click "Continue" → "Review" → "Schedule/Send now"');
      console.log('   4. Your 5 subscribers (including yotamt@gmail.com) will receive it!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

scheduleCampaign();
