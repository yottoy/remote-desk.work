#!/usr/bin/env node
/**
 * Test SendGrid email sending to yotamt@gmail.com
 */

const { MongoClient } = require('mongodb');
const sgMail = require('@sendgrid/mail');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'hi@clickclickjob.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'ClickClickJob Team';
const TEST_EMAIL = 'yotamt@gmail.com';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

async function testSendGrid() {
  console.log('\n📧 Testing SendGrid Email Sending\n');
  console.log(`From: ${SENDGRID_FROM_NAME} <${SENDGRID_FROM_EMAIL}>`);
  console.log(`To: ${TEST_EMAIL}\n`);

  if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY not found in .env.local');
    console.error('\nTo fix:');
    console.error('1. Go to: https://app.sendgrid.com/settings/api_keys');
    console.error('2. Create API key');
    console.error('3. Add to frontend/.env.local:');
    console.error('   SENDGRID_API_KEY=SG.your-key-here');
    console.error('   SENDGRID_FROM_EMAIL=hi@clickclickjob.com');
    console.error('   SENDGRID_FROM_NAME=ClickClickJob Team\n');
    process.exit(1);
  }

  sgMail.setApiKey(SENDGRID_API_KEY);

  try {
    // Get some jobs from database
    console.log('⏳ Fetching jobs from MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const jobsCollection = db.collection('jobs');

    const jobs = await jobsCollection.find({
      title: { $exists: true, $ne: '' },
      company: { $exists: true, $ne: '' },
      url: { $exists: true, $ne: '' }
    })
    .sort({ postedAt: -1 })
    .limit(5)
    .toArray();

    await client.close();
    console.log(`✅ Found ${jobs.length} jobs\n`);

    // Generate email HTML with CCJ job page links
    const jobsHtml = jobs.map(job => {
      const jobPageUrl = `https://clickclickjob.com/jobs/view/${job._id}`;
      return `
      <div style="margin-bottom: 20px; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <h3 style="margin: 0 0 8px 0;"><a href="${jobPageUrl}" style="color: #2563eb;">${job.title}</a></h3>
        <p style="margin: 0; color: #6b7280;">🏢 ${job.company} ${job.location ? `• 📍 ${job.location}` : ''}</p>
        <a href="${jobPageUrl}" style="display: inline-block; margin-top: 8px; padding: 8px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px;">View on ClickClickJob →</a>
      </div>
    `;
    }).join('');

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">🔔 Test: Weekly Job Digest</h1>
        <p>Hi! This is a test email from ClickClickJob using SendGrid.</p>
        <p>Here are ${jobs.length} sample jobs:</p>
        ${jobsHtml}
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">© 2026 ClickClickJob.com</p>
      </div>
    `;

    // Send email
    console.log('⏳ Sending email via SendGrid...\n');
    const msg = {
      to: TEST_EMAIL,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME
      },
      subject: `🔔 Test: ${jobs.length} New Remote Jobs This Week`,
      text: `ClickClickJob Test Email\n\nThis is a test of the weekly digest.\n\nJobs included: ${jobs.length}`,
      html: emailHtml
    };

    await sgMail.send(msg);
    
    console.log('✅ SUCCESS! Email sent via SendGrid!\n');
    console.log('📧 Check your inbox:');
    console.log(`   To: ${TEST_EMAIL}`);
    console.log(`   From: ${SENDGRID_FROM_NAME} <${SENDGRID_FROM_EMAIL}>`);
    console.log(`   Subject: 🔔 Test: ${jobs.length} New Remote Jobs This Week\n`);
    console.log('🎉 If you don\'t see it, check spam folder!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.response) {
      console.error('\nSendGrid API Error:', error.response.body);
      
      if (error.response.body.errors) {
        error.response.body.errors.forEach(err => {
          console.error(`  - ${err.message}`);
          if (err.field) console.error(`    Field: ${err.field}`);
        });
      }
    }
    
    console.error('\n💡 Common issues:');
    console.error('   1. API key invalid → Generate new one');
    console.error('   2. From email not verified → Verify in SendGrid dashboard');
    console.error('   3. Domain not authenticated → Add DNS records\n');
  }
}

testSendGrid();
