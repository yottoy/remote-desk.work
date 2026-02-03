#!/usr/bin/env node
/**
 * Send a test email via MailerLite to yotamt@gmail.com
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;
const TEST_EMAIL = 'yotamt@gmail.com';

console.log('\n📧 MailerLite Test Email to yotamt@gmail.com\n');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
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

async function sendTestEmail() {
  if (!MAILERLITE_API_KEY) {
    console.error('❌ MAILERLITE_API_KEY not found');
    process.exit(1);
  }

  try {
    // Step 1: Check if yotamt@gmail.com is a subscriber
    console.log('⏳ Step 1: Checking if you\'re a subscriber...');
    
    const subscriberCheck = await makeRequest({
      hostname: 'connect.mailerlite.com',
      path: `/api/subscribers/${encodeURIComponent(TEST_EMAIL)}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    let subscriberId = null;
    if (subscriberCheck.status === 200 && subscriberCheck.data.data) {
      subscriberId = subscriberCheck.data.data.id;
      console.log(`✅ Found! You're subscriber #${subscriberId}`);
      console.log(`   Status: ${subscriberCheck.data.data.status}`);
      console.log(`   Subscribed: ${subscriberCheck.data.data.subscribed_at || 'N/A'}\n`);
    } else {
      console.log('⚠️  Not found as subscriber');
      console.log('   Let\'s add you first...\n');
      
      // Add as subscriber
      const addResult = await makeRequest({
        hostname: 'connect.mailerlite.com',
        path: '/api/subscribers',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }, {
        email: TEST_EMAIL,
        groups: [MAILERLITE_GROUP_ID]
      });

      if (addResult.status === 200 || addResult.status === 201) {
        subscriberId = addResult.data.data.id;
        console.log(`✅ Added as subscriber #${subscriberId}\n`);
      } else {
        console.error('❌ Failed to add subscriber:', addResult.data);
        process.exit(1);
      }
    }

    // Step 2: Check available email options
    console.log('⏳ Step 2: Checking MailerLite plan capabilities...\n');

    // Try to get campaigns to see what's available
    const campaigns = await makeRequest({
      hostname: 'connect.mailerlite.com',
      path: '/api/campaigns?limit=5&filter[status]=sent',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (campaigns.status === 200) {
      console.log('✅ Recent campaigns:');
      if (campaigns.data.data && campaigns.data.data.length > 0) {
        campaigns.data.data.forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.name} (${c.status})`);
        });
      } else {
        console.log('   No campaigns found');
      }
      console.log('');
    }

    // Step 3: Try to send via automation/webhook
    console.log('⏳ Step 3: Attempting to send test email...\n');
    
    // Option A: Try campaign API (will likely fail on free plan)
    console.log('Trying campaign API...');
    const campaignResult = await makeRequest({
      hostname: 'connect.mailerlite.com',
      path: '/api/campaigns',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, {
      name: `Test Email - ${new Date().toISOString()}`,
      type: 'regular',
      emails: [{
        subject: '🔔 Test Email from ClickClickJob',
        from_name: 'ClickClickJob Team',
        from: 'hi@clickclickjob.com',
        content: `
          <h1>Test Email</h1>
          <p>Hi Yotam!</p>
          <p>This is a test email from ClickClickJob to verify the MailerLite integration is working.</p>
          <p>If you're seeing this, it means emails are working! 🎉</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            ClickClickJob - Remote Jobs Board<br>
            <a href="https://clickclickjob.com">clickclickjob.com</a>
          </p>
        `
      }],
      groups: [MAILERLITE_GROUP_ID]
    });

    if (campaignResult.status === 200 || campaignResult.status === 201) {
      const campaignId = campaignResult.data.data.id;
      console.log(`✅ Campaign created! ID: ${campaignId}`);
      
      // Try to send it
      console.log('⏳ Sending campaign...');
      const sendResult = await makeRequest({
        hostname: 'connect.mailerlite.com',
        path: `/api/campaigns/${campaignId}/send`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (sendResult.status === 200) {
        console.log('\n✅ SUCCESS! Email sent via MailerLite!\n');
        console.log('🎉 Check yotamt@gmail.com inbox (and spam folder)\n');
      } else {
        console.error('❌ Failed to send:', sendResult.data);
      }
    } else if (campaignResult.status === 422) {
      console.log('❌ Campaign API not available on your plan\n');
      console.log('📋 Your MailerLite plan doesn\'t support API email sending.');
      console.log('\n💡 Alternative options:\n');
      console.log('1. Manual Test via MailerLite Dashboard:');
      console.log('   → Go to: https://dashboard.mailerlite.com/campaigns');
      console.log('   → Create new campaign');
      console.log('   → Select "ClickClickJob" group (yotamt@gmail.com is in it)');
      console.log('   → Send test email\n');
      console.log('2. Upgrade MailerLite to Advanced Plan ($9/mo)');
      console.log('   → Enables API email sending\n');
      console.log('3. Use Gmail SMTP (free, but requires setup)');
      console.log('   → We already built this - just need Gmail app password\n');
    } else {
      console.error('❌ Unexpected error:', campaignResult.status, campaignResult.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendTestEmail();
