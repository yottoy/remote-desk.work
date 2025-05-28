const { MongoClient } = require('mongodb');
require('dotenv').config();
const remoteJobValidator = require('./src/utils/remoteJobValidator');

async function analyzeJobIssues() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('🔍 Analyzing Job Quality Issues...\n');
  console.log('='.repeat(60));
  
  // Issue 1: On-site jobs analysis
  console.log('📍 ISSUE 1: ON-SITE JOBS ANALYSIS');
  console.log('='.repeat(60));
  
  const totalJobs = await collection.countDocuments();
  console.log(`Total jobs in database: ${totalJobs}`);
  
  // Get a sample of jobs to analyze
  const sampleJobs = await collection.find({}).limit(100).toArray();
  
  let onsiteJobs = [];
  let remoteJobs = [];
  let unclearJobs = [];
  
  console.log('\n🧪 Testing jobs with remote validator...');
  
  for (const job of sampleJobs) {
    const validation = remoteJobValidator.validateRemoteJob(job);
    
    if (!validation.isRemote && validation.confidence > 0.5) {
      onsiteJobs.push({
        title: job.title,
        company: job.company,
        location: job.location,
        confidence: validation.confidence,
        reasons: validation.reasons.slice(0, 3),
        description: job.description ? job.description.substring(0, 200) + '...' : 'No description'
      });
    } else if (validation.isRemote && validation.confidence > 0.5) {
      remoteJobs.push({
        title: job.title,
        company: job.company,
        location: job.location,
        confidence: validation.confidence
      });
    } else {
      unclearJobs.push({
        title: job.title,
        company: job.company,
        location: job.location,
        confidence: validation.confidence,
        isRemote: validation.isRemote
      });
    }
  }
  
  console.log(`\n📊 Analysis Results (sample of ${sampleJobs.length} jobs):`);
  console.log(`   ✅ Clearly Remote: ${remoteJobs.length} (${Math.round(remoteJobs.length/sampleJobs.length*100)}%)`);
  console.log(`   ❌ Clearly On-site: ${onsiteJobs.length} (${Math.round(onsiteJobs.length/sampleJobs.length*100)}%)`);
  console.log(`   ❓ Unclear: ${unclearJobs.length} (${Math.round(unclearJobs.length/sampleJobs.length*100)}%)`);
  
  if (onsiteJobs.length > 0) {
    console.log('\n🚨 PROBLEMATIC ON-SITE JOBS FOUND:');
    onsiteJobs.slice(0, 5).forEach((job, i) => {
      console.log(`\n${i+1}. ${job.title} at ${job.company}`);
      console.log(`   Location: ${job.location}`);
      console.log(`   Confidence: ${job.confidence.toFixed(2)}`);
      console.log(`   Reasons: ${job.reasons.join(', ')}`);
      console.log(`   Description: ${job.description}`);
    });
  }
  
  // Issue 2: Recent jobs count analysis
  console.log('\n\n📅 ISSUE 2: RECENT JOBS COUNT ANALYSIS');
  console.log('='.repeat(60));
  
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  console.log(`Current time: ${now.toISOString()}`);
  console.log(`7 days ago: ${sevenDaysAgo.toISOString()}`);
  console.log(`14 days ago: ${fourteenDaysAgo.toISOString()}`);
  
  // Count jobs by different time periods
  const jobsLast7Days = await collection.countDocuments({
    postedDate: { $gte: sevenDaysAgo }
  });
  
  const jobsLast14Days = await collection.countDocuments({
    postedDate: { $gte: fourteenDaysAgo }
  });
  
  const jobsLast30Days = await collection.countDocuments({
    postedDate: { $gte: thirtyDaysAgo }
  });
  
  console.log(`\n📊 Jobs by time period:`);
  console.log(`   Last 7 days: ${jobsLast7Days}`);
  console.log(`   Last 14 days: ${jobsLast14Days}`);
  console.log(`   Last 30 days: ${jobsLast30Days}`);
  
  // Check if all jobs have the same posting date (indicating a problem)
  const uniqueDates = await collection.distinct('postedDate');
  console.log(`\n📅 Unique posting dates: ${uniqueDates.length}`);
  
  if (uniqueDates.length < 10 && totalJobs > 100) {
    console.log('🚨 WARNING: Very few unique posting dates detected!');
    console.log('This suggests posting dates may be overridden or not properly set.');
  }
  
  // Show date distribution
  const dateDistribution = await collection.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$postedDate" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 10 }
  ]).toArray();
  
  console.log('\n📅 Recent date distribution:');
  dateDistribution.forEach(item => {
    console.log(`   ${item._id}: ${item.count} jobs`);
  });
  
  // Check for jobs with missing or invalid posting dates
  const jobsWithoutDates = await collection.countDocuments({
    $or: [
      { postedDate: { $exists: false } },
      { postedDate: null },
      { postedDate: "" }
    ]
  });
  
  console.log(`\n📊 Jobs without valid posting dates: ${jobsWithoutDates}`);
  
  // Sample recent jobs to check their actual posting dates
  const recentJobsSample = await collection.find({})
    .sort({ postedDate: -1 })
    .limit(10)
    .toArray();
  
  console.log('\n📋 Sample of most recent jobs:');
  recentJobsSample.forEach((job, i) => {
    const postedDate = new Date(job.postedDate);
    const daysAgo = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));
    console.log(`${i+1}. ${job.title} - Posted ${daysAgo} days ago (${postedDate.toLocaleDateString()})`);
  });
  
  console.log('\n\n🎯 RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  if (onsiteJobs.length > sampleJobs.length * 0.1) {
    console.log('❌ HIGH PRIORITY: Significant number of on-site jobs detected');
    console.log('   → Implement enhanced remote job validation in the scraping pipeline');
    console.log('   → Add location-based filtering rules');
    console.log('   → Review job descriptions for on-site indicators');
  }
  
  if (jobsLast7Days < 10) {
    console.log('❌ MEDIUM PRIORITY: Very few recent jobs');
    console.log('   → Check if scraping is running regularly');
    console.log('   → Verify posting date assignment logic');
  }
  
  if (uniqueDates.length < totalJobs * 0.1) {
    console.log('❌ HIGH PRIORITY: Posting dates appear to be overridden');
    console.log('   → Fix posting date logic to preserve original dates');
    console.log('   → Implement proper date parsing from job sources');
  }
  
  await client.close();
}

analyzeJobIssues().catch(console.error); 