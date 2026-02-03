#!/usr/bin/env node
/**
 * Get latest jobs formatted for email campaign
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

async function getLatestJobs() {
  console.log('\n📋 Fetching Latest Jobs for Email Campaign\n');

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const jobsCollection = db.collection('jobs');

    // Get latest 10 jobs
    const jobs = await jobsCollection.find({
      title: { $exists: true, $ne: '' },
      company: { $exists: true, $ne: '' },
      url: { $exists: true, $ne: '' }
    })
    .sort({ postedAt: -1 })
    .limit(10)
    .toArray();

    await client.close();

    console.log(`✅ Found ${jobs.length} jobs\n`);
    console.log('=' .repeat(80));
    console.log('COPY THIS INTO YOUR MAILERLITE CAMPAIGN:');
    console.log('='.repeat(80));
    console.log('\n');

    jobs.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title}`);
      console.log(`   Company: ${job.company}`);
      console.log(`   Location: ${job.location || 'Remote'}`);
      if (job.salary) console.log(`   Salary: ${job.salary}`);
      console.log(`   URL: ${job.url}`);
      if (job.description) {
        const desc = job.description.substring(0, 150).replace(/\n/g, ' ');
        console.log(`   Description: ${desc}...`);
      }
      console.log(`   Posted: ${job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'N/A'}`);
      console.log('\n');
    });

    console.log('='.repeat(80));
    console.log('\n📧 Next Steps:');
    console.log('   1. Go to: https://dashboard.mailerlite.com/campaigns/create');
    console.log('   2. Choose "Regular campaign"');
    console.log('   3. Use drag & drop editor');
    console.log('   4. Copy-paste the jobs above');
    console.log('   5. Select "ClickClickJob" group (5 subscribers)');
    console.log('   6. Subject: "🔔 New Remote Jobs This Week - Feb 2, 2026"');
    console.log('   7. Send!');
    console.log('   8. Check yotamt@gmail.com inbox\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getLatestJobs();
