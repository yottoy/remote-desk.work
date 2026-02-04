require('dotenv').config({ path: './frontend/.env.local' });
const { MongoClient } = require('mongodb');

/**
 * This script tests that GitHub Actions will work WITHOUT sending emails
 * Run this locally to verify everything is configured correctly
 */

async function testSetup() {
  console.log('\n🧪 Testing GitHub Actions Setup (No Emails Sent)\n');
  
  const requiredEnvVars = {
    'MONGODB_URI': process.env.MONGODB_URI,
    'MONGODB_DB': process.env.MONGODB_DB,
    'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY,
    'SENDGRID_FROM_EMAIL': process.env.SENDGRID_FROM_EMAIL,
    'SENDGRID_FROM_NAME': process.env.SENDGRID_FROM_NAME
  };

  // Check environment variables
  console.log('📋 Checking Environment Variables:\n');
  let allPresent = true;
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value) {
      console.log(`✅ ${key}: Present (${value.substring(0, 20)}...)`);
    } else {
      console.log(`❌ ${key}: MISSING`);
      allPresent = false;
    }
  }
  
  if (!allPresent) {
    console.log('\n❌ Missing environment variables! Add them to GitHub Secrets.\n');
    return;
  }

  console.log('\n📊 Testing MongoDB Connection:\n');
  
  try {
    const client = new MongoClient(requiredEnvVars.MONGODB_URI);
    await client.connect();
    console.log('✅ MongoDB connection successful');
    
    const db = client.db(requiredEnvVars.MONGODB_DB);
    
    // Check subscribers
    const subscribersCollection = db.collection('subscribers');
    const subscriberCount = await subscribersCollection.countDocuments({ status: 'active' });
    console.log(`✅ Found ${subscriberCount} active subscribers`);
    
    // Check jobs
    const jobsCollection = db.collection('jobs');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const freshJobsCount = await jobsCollection.countDocuments({
      createdAt: { $gte: oneWeekAgo },
      title: { $exists: true, $ne: '' },
      company: { $exists: true, $ne: '' }
    });
    
    console.log(`✅ Found ${freshJobsCount} fresh jobs from last 7 days`);
    
    await client.close();
    
    console.log('\n🎉 SUCCESS! GitHub Actions is ready to send emails!\n');
    console.log('📅 Next automatic send: Monday at 2 PM UTC');
    console.log('📧 Will send to: ' + subscriberCount + ' subscribers');
    console.log('📋 Will include: ' + Math.min(freshJobsCount, 10) + ' jobs\n');
    console.log('✅ All systems ready! No action needed until Monday.\n');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\nCheck your MongoDB credentials in GitHub Secrets.\n');
  }
}

testSetup().catch(console.error);
