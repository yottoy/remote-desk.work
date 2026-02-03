#!/usr/bin/env node
/**
 * Send a test digest email to a single subscriber
 */

const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const TEST_EMAIL = 'yotamt@gmail.com';

async function sendTestDigest() {
  console.log('\n📧 Sending test digest email...\n');
  console.log(`📍 Recipient: ${TEST_EMAIL}\n`);

  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB;
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;

  // Validate environment
  if (!MONGODB_URI || !MONGODB_DB) {
    console.error('❌ Database configuration missing');
    process.exit(1);
  }

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('❌ Email credentials missing');
    console.error('   Need: EMAIL_USER and EMAIL_PASS');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    console.log('⏳ Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

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

    console.log(`✅ Found ${recentJobs.length} jobs from last 7 days\n`);

    // If no recent jobs, get latest
    let jobsToSend = recentJobs;
    if (jobsToSend.length === 0) {
      console.log('⏳ No recent jobs, fetching latest available...');
      jobsToSend = await jobsCollection.find({
        title: { $exists: true, $ne: '' },
        company: { $exists: true, $ne: '' },
        url: { $exists: true, $ne: '' }
      })
      .sort({ postedAt: -1 })
      .limit(5)
      .toArray();
      console.log(`✅ Found ${jobsToSend.length} jobs\n`);
    }

    await client.close();

    if (jobsToSend.length === 0) {
      console.error('❌ No jobs found to send');
      process.exit(1);
    }

    // Create email HTML
    const emailHtml = generateDigestHtml(jobsToSend);
    const emailText = generateDigestText(jobsToSend);

    // Setup email transporter
    console.log('⏳ Setting up email transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    // Send email
    console.log(`⏳ Sending email to ${TEST_EMAIL}...`);
    const mailOptions = {
      from: `ClickClickJob Team <${EMAIL_USER}>`,
      to: TEST_EMAIL,
      subject: `🔔 ${jobsToSend.length} New Remote Jobs This Week - ${new Date().toLocaleDateString()}`,
      html: emailHtml,
      text: emailText
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('\n✅ SUCCESS! Email sent!\n');
    console.log(`📧 To: ${TEST_EMAIL}`);
    console.log(`📝 Subject: ${mailOptions.subject}`);
    console.log(`💼 Jobs: ${jobsToSend.length}`);
    console.log(`📨 Message ID: ${info.messageId}\n`);
    console.log('🎉 Check your inbox (and spam folder)!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

function generateDigestHtml(jobs) {
  const jobsHtml = jobs.map(job => `
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 20px;">
        <a href="${job.url}" style="color: #2563eb; text-decoration: none;">${job.title}</a>
      </h2>
      <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
        <strong>${job.company}</strong>
        ${job.location ? ` • ${job.location}` : ''}
        ${job.salary ? ` • ${job.salary}` : ''}
      </p>
      ${job.description ? `
        <p style="margin: 10px 0; color: #374151; font-size: 14px; line-height: 1.5;">
          ${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}
        </p>
      ` : ''}
      <a href="${job.url}" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 10px;">
        View Job →
      </a>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Remote Jobs Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e5e7eb;">
    <h1 style="margin: 0; color: #111827; font-size: 28px;">ClickClickJob</h1>
    <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">Your Weekly Remote Jobs Digest</p>
  </div>

  <div style="padding: 20px 0;">
    <p style="font-size: 16px; color: #374151;">
      Hi there! 👋
    </p>
    <p style="font-size: 16px; color: #374151;">
      Here are <strong>${jobs.length} new remote job opportunities</strong> we found for you this week:
    </p>
  </div>

  ${jobsHtml}

  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
    <p style="color: #6b7280; font-size: 14px;">
      Want to see more jobs? Visit <a href="https://clickclickjob.com" style="color: #2563eb;">ClickClickJob.com</a>
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
      You're receiving this because you subscribed to ClickClickJob weekly digest.
      <br>
      <a href="https://clickclickjob.com/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
    </p>
  </div>

</body>
</html>
  `;
}

function generateDigestText(jobs) {
  const jobsText = jobs.map((job, i) => `
${i + 1}. ${job.title}
   Company: ${job.company}
   ${job.location ? `Location: ${job.location}` : ''}
   ${job.salary ? `Salary: ${job.salary}` : ''}
   Apply: ${job.url}
   ${job.description ? `\n   ${job.description.substring(0, 150)}...\n` : ''}
  `).join('\n');

  return `
ClickClickJob - Your Weekly Remote Jobs Digest

Hi there!

Here are ${jobs.length} new remote job opportunities we found for you this week:

${jobsText}

Want to see more jobs? Visit https://clickclickjob.com

---
You're receiving this because you subscribed to ClickClickJob weekly digest.
Unsubscribe: https://clickclickjob.com/unsubscribe
  `;
}

sendTestDigest();
