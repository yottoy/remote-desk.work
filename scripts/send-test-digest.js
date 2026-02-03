#!/usr/bin/env node
/**
 * Manual Test: Send a test digest email to verify MailerLite integration
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const API_KEY = process.env.MAILERLITE_API_KEY;
const GROUP_ID = process.env.MAILERLITE_GROUP_ID;

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function sendTestEmail() {
  console.log('\n🧪 Sending test email via MailerLite...\n');

  // Step 1: Create a test campaign
  console.log('Step 1: Creating test campaign...');
  
  const campaignData = {
    name: `Test Email - ${new Date().toISOString()}`,
    type: 'regular',
    emails: [{
      subject: '✅ Test Email from ClickClickJob - Your Integration Works!',
      from_name: 'ClickClickJob Team',
      from: 'hi@clickclickjob.com',
      content: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
              <h1 style="color: #2563eb;">🎉 Success! Your MailerLite Integration Works!</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                This is a test email from ClickClickJob.com. If you're seeing this, it means:
              </p>
              <ul style="font-size: 16px; color: #374151; line-height: 1.8;">
                <li>✅ Your MailerLite API is connected</li>
                <li>✅ Your sender email (hi@clickclickjob.com) is verified</li>
                <li>✅ Campaigns can be created and sent</li>
                <li>✅ Your subscribers are receiving emails</li>
              </ul>
              <div style="margin-top: 30px; padding: 20px; background-color: #dbeafe; border-left: 4px solid #2563eb; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #1e40af;">What's Next?</p>
                <p style="margin: 10px 0 0 0; color: #1e3a8a;">
                  Your weekly digest cron job is configured to run every Monday at 2 PM UTC. 
                  It will automatically send job updates to your subscribers!
                </p>
              </div>
              <div style="margin-top: 30px; text-align: center;">
                <a href="https://www.clickclickjob.com" 
                   style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Visit ClickClickJob.com
                </a>
              </div>
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
                Test sent at: ${new Date().toLocaleString()}
              </p>
            </div>
          </body>
        </html>
      `
    }],
    groups: [GROUP_ID]
  };

  const createOptions = {
    hostname: 'connect.mailerlite.com',
    path: '/api/campaigns',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const createResult = await makeRequest(createOptions, campaignData);
  
  if (createResult.status !== 200 && createResult.status !== 201) {
    console.error('❌ Failed to create campaign:', createResult.status);
    console.error('Response:', JSON.stringify(createResult.body, null, 2));
    
    // Check for specific errors
    if (createResult.body.message?.includes('sender') || createResult.body.message?.includes('verified')) {
      console.log('\n⚠️  SENDER EMAIL NOT VERIFIED!');
      console.log('   You need to verify hi@clickclickjob.com in MailerLite.');
      console.log('   Go to: https://dashboard.mailerlite.com/settings/senders\n');
    }
    return;
  }

  console.log('✅ Campaign created successfully!');
  const campaignId = createResult.body.data?.id;
  console.log(`   Campaign ID: ${campaignId}`);

  // Step 2: Send the campaign immediately
  console.log('\nStep 2: Sending campaign to subscribers...');
  
  const sendOptions = {
    hostname: 'connect.mailerlite.com',
    path: `/api/campaigns/${campaignId}/actions/send`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const sendResult = await makeRequest(sendOptions);
  
  if (sendResult.status === 200 || sendResult.status === 201 || sendResult.status === 202) {
    console.log('✅ Email sent successfully!');
    console.log(`   Sent to ${createResult.body.data?.emails_count || '4'} subscribers`);
    console.log('\n🎉 CHECK YOUR INBOX! Your subscribers should receive the test email shortly.\n');
  } else {
    console.error('❌ Failed to send campaign:', sendResult.status);
    console.error('Response:', JSON.stringify(sendResult.body, null, 2));
    
    console.log('\n⚠️  Campaign was created but not sent.');
    console.log('   Check your MailerLite dashboard for drafts:');
    console.log('   https://dashboard.mailerlite.com/campaigns\n');
  }
}

sendTestEmail().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
});
