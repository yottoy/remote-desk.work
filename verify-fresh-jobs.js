// Verify that fresh jobs are in the database
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function verifyJobs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const collection = db.collection('jobs');
    
    // Count total jobs
    const totalJobs = await collection.countDocuments();
    console.log(`\n📊 Total jobs in database: ${totalJobs}`);
    
    // Get the most recent jobs (sorted by postedDate)
    const recentJobs = await collection
      .find()
      .sort({ postedDate: -1 })
      .limit(10)
      .toArray();
    
    console.log(`\n🔝 Top 10 Most Recent Jobs (by postedDate):`);
    recentJobs.forEach((job, index) => {
      const postedDate = new Date(job.postedDate);
      const daysAgo = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
      console.log(`      Posted: ${postedDate.toISOString().split('T')[0]} (${daysAgo} days ago)`);
    });
    
    // Check how many jobs are from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jobsToday = await collection.countDocuments({
      postedDate: { $gte: today }
    });
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const jobsYesterday = await collection.countDocuments({
      postedDate: { $gte: yesterday, $lt: today }
    });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const jobsThisWeek = await collection.countDocuments({
      postedDate: { $gte: sevenDaysAgo }
    });
    
    console.log(`\n📅 Job Distribution:`);
    console.log(`   Posted today: ${jobsToday}`);
    console.log(`   Posted yesterday: ${jobsYesterday}`);
    console.log(`   Posted this week (last 7 days): ${jobsThisWeek}`);
    
    // Check database size
    const stats = await db.stats();
    console.log(`\n💾 Database Size:`);
    console.log(`   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

verifyJobs()
  .then(() => {
    console.log('\n✅ Verification completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  });
