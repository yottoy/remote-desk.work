const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixRecentJobsCount() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('🔧 Fixing Recent Jobs Count Issue...\n');
  console.log('='.repeat(60));
  
  // Get current stats
  const totalJobs = await collection.countDocuments();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const jobsLast7Days = await collection.countDocuments({
    postedDate: { $gte: sevenDaysAgo }
  });
  
  const jobsLast14Days = await collection.countDocuments({
    postedDate: { $gte: fourteenDaysAgo }
  });
  
  console.log('📊 Current Database Stats:');
  console.log(`   Total jobs: ${totalJobs}`);
  console.log(`   Jobs in last 7 days: ${jobsLast7Days}`);
  console.log(`   Jobs in last 14 days: ${jobsLast14Days}`);
  
  // Test the API endpoint directly
  console.log('\n🧪 Testing API endpoint...');
  
  try {
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/jobs'
      : 'https://clickclickjob.vercel.app/api/jobs';
    
    console.log(`Calling API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      const jobs = result.jobs || result;
      
      console.log(`✅ API returned ${jobs.length} jobs`);
      
      // Count recent jobs from API response
      const recentJobs = jobs.filter(job => {
        if (!job.postedDate) return false;
        const postedDate = new Date(job.postedDate);
        return !isNaN(postedDate.getTime()) && postedDate >= sevenDaysAgo;
      });
      
      console.log(`   Recent jobs from API: ${recentJobs.length}`);
      
      // Sample of recent jobs
      console.log('\n📋 Sample recent jobs from API:');
      recentJobs.slice(0, 5).forEach((job, i) => {
        const postedDate = new Date(job.postedDate);
        const daysAgo = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));
        console.log(`${i+1}. ${job.title} - ${daysAgo} days ago`);
      });
      
    } else {
      console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ API request error: ${error.message}`);
  }
  
  // Check for any caching issues
  console.log('\n🔍 Checking for potential caching issues...');
  
  // Look for jobs with identical posting times (suggests batch processing)
  const duplicateDates = await collection.aggregate([
    {
      $group: {
        _id: "$postedDate",
        count: { $sum: 1 }
      }
    },
    {
      $match: { count: { $gt: 10 } }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]).toArray();
  
  if (duplicateDates.length > 0) {
    console.log('⚠️  Found dates with many jobs (possible batch processing):');
    duplicateDates.forEach(item => {
      console.log(`   ${item._id}: ${item.count} jobs`);
    });
  } else {
    console.log('✅ No suspicious date clustering found');
  }
  
  // Recommendations
  console.log('\n\n🎯 RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  if (jobsLast7Days !== jobsLast14Days) {
    console.log('✅ GOOD: Recent job counts are working correctly');
    console.log(`   Database shows ${jobsLast7Days} jobs in last 7 days`);
    console.log(`   Database shows ${jobsLast14Days} jobs in last 14 days`);
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Clear browser cache and test the homepage');
  console.log('2. Check if Vercel has any caching layers');
  console.log('3. Consider reducing API cache time from 60s to 30s');
  console.log('4. Monitor the count over the next few days');
  
  await client.close();
  console.log('\n✅ Analysis complete!');
}

fixRecentJobsCount().catch(console.error); 