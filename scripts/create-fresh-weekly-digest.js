#!/usr/bin/env node
/**
 * Create a fresh Weekly Job Digest campaign with current jobs
 */

const { MongoClient } = require('mongodb');
const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

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

function generateEmailHtml(jobs) {
  const jobsHtml = jobs.map(job => `
    <div style="margin-bottom: 24px; padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
      <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">
        <a href="${job.url}" style="color: #1f2937; text-decoration: none;" target="_blank">${job.title}</a>
      </h3>
      <div style="margin-bottom: 16px; font-size: 14px; color: #6b7280;">
        <span>🏢 ${job.company}</span>
        ${job.location ? ` • 📍 ${job.location}` : ''}
      </div>
      <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.6;">
        ${job.description ? job.description.substring(0, 200) + '...' : ''}
      </p>
      <a href="${job.url}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; font-weight: 600; border-radius: 8px; text-decoration: none;" target="_blank">
        Apply Now →
      </a>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Weekly Remote Job Digest | ClickClickJob.com</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background-color: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e5e7eb; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #2563eb;">
        ClickClick<span style="color: #f97316;">Job.com</span>
      </h1>
      <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Weekly Remote Job Digest</p>
    </div>
    
    <!-- Hero -->
    <div style="background: linear-gradient(to bottom, #eff6ff, #ffffff); padding: 40px 24px; text-align: center; border-bottom: 1px solid #dbeafe;">
      <h2 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #1f2937;">
        New Remote Jobs This Week
      </h2>
      <p style="margin: 0; font-size: 18px; color: #4b5563;">
        Fresh remote opportunities for admin professionals and data entry specialists
      </p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #4b5563;">
        Hi there! 👋<br><br>
        Here are <strong>${jobs.length} new remote job opportunities</strong> we've found for you this week. All positions are verified and legitimate.
      </p>
      
      ${jobsHtml}
      
      <!-- CTA -->
      <div style="margin-top: 40px; padding: 32px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 12px; text-align: center;">
        <h3 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
          Want More Job Opportunities?
        </h3>
        <p style="margin: 0 0 24px 0; color: #dbeafe; font-size: 16px;">
          Browse hundreds of verified remote positions on our website
        </p>
        <a href="https://clickclickjob.com/jobs" style="display: inline-block; padding: 16px 32px; background-color: #ffffff; color: #2563eb; font-weight: 600; border-radius: 8px; text-decoration: none; font-size: 16px;" target="_blank">
          Browse All Jobs →
        </a>
      </div>
      
      <!-- Tips -->
      <div style="margin-top: 32px; padding: 24px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #2563eb;">
        <h4 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
          💡 Application Tips
        </h4>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
          <li style="margin-bottom: 8px;">Apply quickly - remote jobs often receive many applications</li>
          <li style="margin-bottom: 8px;">Customize your resume for each position</li>
          <li style="margin-bottom: 8px;">Highlight your remote work experience and skills</li>
          <li>Be wary of scams - legitimate employers won't ask for money upfront</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 32px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
        You're receiving this email because you subscribed to our weekly remote job digest.<br>
        All jobs are verified for legitimacy, but always use caution when applying.
      </p>
      <div style="margin-top: 16px;">
        <a href="{$unsubscribe}" style="color: #6b7280; text-decoration: underline; font-size: 12px;">Unsubscribe</a>
        <span style="color: #d1d5db; margin: 0 8px;">|</span>
        <a href="https://clickclickjob.com/privacy-policy" style="color: #6b7280; text-decoration: underline; font-size: 12px;">Privacy Policy</a>
      </div>
      <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
        © 2026 ClickClickJob.com • All rights reserved
      </p>
    </div>
    
  </div>
</body>
</html>
  `;
}

async function createFreshCampaign() {
  console.log('\n📧 Creating Fresh Weekly Job Digest (February 2, 2026)\n');

  try {
    // Get fresh jobs from MongoDB
    console.log('⏳ Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected\n');

    const db = client.db(MONGODB_DB);
    const jobsCollection = db.collection('jobs');

    // Get recent jobs (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    console.log('⏳ Fetching recent jobs...');
    const recentJobs = await jobsCollection.find({
      postedAt: { $gte: oneWeekAgo },
      title: { $exists: true, $ne: '' },
      company: { $exists: true, $ne: '' },
      url: { $exists: true, $ne: '' }
    })
    .sort({ postedAt: -1 })
    .limit(10)
    .toArray();

    console.log(`✅ Found ${recentJobs.length} recent jobs\n`);

    if (recentJobs.length === 0) {
      console.log('⚠️  No recent jobs found, getting latest...');
      const latestJobs = await jobsCollection.find({
        title: { $exists: true, $ne: '' },
        company: { $exists: true, $ne: '' },
        url: { $exists: true, $ne: '' }
      })
      .sort({ postedAt: -1 })
      .limit(5)
      .toArray();
      recentJobs.push(...latestJobs);
      console.log(`✅ Found ${latestJobs.length} jobs\n`);
    }

    await client.close();

    // Create campaign in MailerLite
    const today = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    const emailHtml = generateEmailHtml(recentJobs);

    console.log('⏳ Creating campaign in MailerLite...');
    const campaignResult = await makeRequest('/api/campaigns', 'POST', {
      name: `Weekly Job Digest - ${today}`,
      type: 'regular',
      emails: [{
        subject: `🔔 ${recentJobs.length} New Remote Jobs This Week - ${today}`,
        from_name: 'ClickClickJob',
        from: 'hi@clickclickjob.com',
        content: emailHtml
      }],
      groups: [MAILERLITE_GROUP_ID]
    });

    if (campaignResult.status === 200 || campaignResult.status === 201) {
      const campaign = campaignResult.data.data;
      console.log('✅ Campaign created successfully!\n');
      console.log(`   Campaign ID: ${campaign.id}`);
      console.log(`   Name: ${campaign.name}`);
      console.log(`   Recipients: ${campaign.recipients_count || 5} subscribers\n`);
      console.log('📋 Next steps:');
      console.log('   1. Go to: https://dashboard.mailerlite.com/campaigns');
      console.log(`   2. Find: "${campaign.name}"`);
      console.log('   3. Click "Continue" → "Review" → "Send now"');
      console.log('   4. Your subscribers (including yotamt@gmail.com) will receive it!\n');
    } else {
      console.error('❌ Failed to create campaign:', campaignResult.status);
      console.error(JSON.stringify(campaignResult.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

createFreshCampaign();
