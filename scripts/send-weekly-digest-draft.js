#!/usr/bin/env node
/**
 * Send the Weekly Job Digest draft campaign
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const CAMPAIGN_ID = '155671820296520923'; // Weekly Job Digest draft

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
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

async function sendDraft() {
  console.log('\n📧 Sending Weekly Job Digest Draft Campaign...\n');
  console.log(`Campaign ID: ${CAMPAIGN_ID}\n`);

  try {
    // Step 1: Schedule the campaign to send immediately
    console.log('⏳ Scheduling campaign for immediate send...');
    
    const scheduleResult = await makeRequest(
      `/api/campaigns/${CAMPAIGN_ID}/schedule`,
      'POST',
      {
        delivery: {
          type: 'instant'
        }
      }
    );

    if (scheduleResult.status === 200 || scheduleResult.status === 201) {
      console.log('✅ Campaign scheduled successfully!\n');
      console.log(JSON.stringify(scheduleResult.data, null, 2));
      console.log('\n🎉 Email is being sent to your 5 subscribers!');
      console.log('\n📧 Check yotamt@gmail.com inbox in 1-2 minutes!');
      console.log('   (Also check spam folder just in case)\n');
    } else if (scheduleResult.status === 422) {
      console.log('⚠️  Schedule endpoint returned 422. Trying alternative send method...\n');
      
      // Try alternative: directly send
      const sendResult = await makeRequest(
        `/api/campaigns/${CAMPAIGN_ID}/actions/send`,
        'POST'
      );
      
      if (sendResult.status === 200 || sendResult.status === 201) {
        console.log('✅ Campaign sent successfully via alternative method!\n');
        console.log(JSON.stringify(sendResult.data, null, 2));
        console.log('\n🎉 Email is being sent to your 5 subscribers!');
      } else {
        console.error('❌ Alternative send also failed:');
        console.error(`Status: ${sendResult.status}`);
        console.error(JSON.stringify(sendResult.data, null, 2));
      }
    } else {
      console.error('❌ Failed to schedule campaign:');
      console.error(`Status: ${scheduleResult.status}`);
      console.error(JSON.stringify(scheduleResult.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendDraft();
