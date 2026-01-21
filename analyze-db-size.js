// Analyze MongoDB database size and find optimization opportunities
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function analyzeDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const collection = db.collection('jobs');
    
    // Get database stats
    const stats = await db.stats();
    console.log('\n📊 Database Stats:');
    console.log(`   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Get job counts
    const totalJobs = await collection.countDocuments();
    console.log(`\n📈 Job Counts:`);
    console.log(`   Total Jobs: ${totalJobs}`);
    
    // Jobs by age
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const jobs7days = await collection.countDocuments({ scrapedDate: { $gte: sevenDaysAgo } });
    const jobs14days = await collection.countDocuments({ scrapedDate: { $gte: fourteenDaysAgo } });
    const jobs30days = await collection.countDocuments({ scrapedDate: { $gte: thirtyDaysAgo } });
    
    console.log(`   Last 7 days: ${jobs7days}`);
    console.log(`   Last 14 days: ${jobs14days}`);
    console.log(`   Last 30 days: ${jobs30days}`);
    
    // Sample a few jobs to check size
    const sampleJobs = await collection.find().limit(5).toArray();
    if (sampleJobs.length > 0) {
      const avgSize = sampleJobs.reduce((sum, job) => sum + JSON.stringify(job).length, 0) / sampleJobs.length;
      console.log(`\n📏 Average Job Document Size: ${(avgSize / 1024).toFixed(2)} KB`);
      console.log(`   Estimated total size: ${(totalJobs * avgSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Check which fields are largest
      const fieldSizes = {};
      sampleJobs.forEach(job => {
        Object.keys(job).forEach(key => {
          if (!fieldSizes[key]) fieldSizes[key] = 0;
          if (job[key]) {
            fieldSizes[key] += JSON.stringify(job[key]).length;
          }
        });
      });
      
      console.log(`\n📦 Average Field Sizes:`);
      Object.entries(fieldSizes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([field, size]) => {
          console.log(`   ${field}: ${(size / sampleJobs.length / 1024).toFixed(2)} KB`);
        });
    }
    
    // Check for duplicate jobs (same title + company)
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: { title: "$title", company: "$company" },
          count: { $sum: 1 },
          ids: { $push: "$_id" }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      },
      {
        $count: "total"
      }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates[0].total} duplicate job groups (same title + company)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

analyzeDatabase()
  .then(() => {
    console.log('\n✅ Analysis completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Analysis failed:', error.message);
    process.exit(1);
  });
