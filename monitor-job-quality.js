const { MongoClient } = require('mongodb');
require('dotenv').config();

async function monitorJobQuality() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('='.repeat(60));
  console.log('ClickClickJob.com - Job Quality Monitoring Report');
  console.log('='.repeat(60));
  console.log(`Generated: ${new Date().toLocaleString()}\n`);
  
  // Overall statistics
  const totalJobs = await collection.countDocuments();
  const validatedJobs = await collection.countDocuments({ remoteConfidence: { $exists: true } });
  const remoteJobs = await collection.countDocuments({ remote: true });
  
  console.log('📊 Overall Statistics:');
  console.log(`Total jobs in database: ${totalJobs}`);
  console.log(`Jobs with validation: ${validatedJobs} (${((validatedJobs/totalJobs)*100).toFixed(1)}%)`);
  console.log(`Remote jobs: ${remoteJobs} (${((remoteJobs/totalJobs)*100).toFixed(1)}%)\n`);
  
  // Confidence distribution
  const confidenceStats = await collection.aggregate([
    { $match: { remoteConfidence: { $exists: true } } },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $gte: ["$remoteConfidence", 0.8] }, then: "High (0.8+)" },
              { case: { $gte: ["$remoteConfidence", 0.6] }, then: "Medium (0.6-0.8)" },
              { case: { $gte: ["$remoteConfidence", 0.4] }, then: "Low (0.4-0.6)" }
            ],
            default: "Very Low (<0.4)"
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ]).toArray();
  
  console.log('🎯 Remote Job Confidence Distribution:');
  confidenceStats.forEach(stat => {
    console.log(`${stat._id}: ${stat.count} jobs`);
  });
  console.log('');
  
  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentJobs = await collection.countDocuments({ 
    createdAt: { $gte: sevenDaysAgo } 
  });
  const recentValidatedJobs = await collection.countDocuments({ 
    createdAt: { $gte: sevenDaysAgo },
    remoteConfidence: { $exists: true }
  });
  
  console.log('📅 Recent Activity (Last 7 Days):');
  console.log(`New jobs added: ${recentJobs}`);
  console.log(`New validated jobs: ${recentValidatedJobs}`);
  console.log(`Daily average: ${(recentJobs/7).toFixed(1)} jobs/day\n`);
  
  // Sample recent high-quality jobs
  const sampleJobs = await collection.find({ 
    remoteConfidence: { $gte: 0.7 },
    remote: true 
  }).sort({ createdAt: -1 }).limit(3).toArray();
  
  console.log('⭐ Sample High-Quality Remote Jobs:');
  sampleJobs.forEach((job, i) => {
    console.log(`${i+1}. ${job.title} at ${job.company}`);
    console.log(`   Confidence: ${job.remoteConfidence?.toFixed(2)}, Location: ${job.location}`);
  });
  console.log('');
  
  // Quality alerts
  const lowQualityCount = await collection.countDocuments({
    remoteConfidence: { $lt: 0.5 },
    remote: true
  });
  
  console.log('🚨 Quality Alerts:');
  if (lowQualityCount > 0) {
    console.log(`⚠️  ${lowQualityCount} remote jobs with low confidence (<0.5)`);
  }
  
  if (recentJobs < 5) {
    console.log(`⚠️  Only ${recentJobs} jobs added in last 7 days (target: 10+)`);
  }
  
  if (validatedJobs < totalJobs * 0.1) {
    console.log(`⚠️  Low validation coverage: ${((validatedJobs/totalJobs)*100).toFixed(1)}% (target: 80%+)`);
  }
  
  if (lowQualityCount === 0 && recentJobs >= 5 && validatedJobs >= totalJobs * 0.1) {
    console.log('✅ All quality checks passed!');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('End of Report');
  console.log('='.repeat(60));
  
  await client.close();
}

monitorJobQuality().catch(console.error); 