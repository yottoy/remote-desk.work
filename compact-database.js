// Compact database by deleting all jobs and letting scraper reimport
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function compactDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const collection = db.collection('jobs');
    
    // Count current jobs
    const currentCount = await collection.countDocuments();
    console.log(`📊 Current job count: ${currentCount}`);
    
    // Get current stats
    const beforeStats = await db.stats();
    console.log(`📏 Current data size: ${(beforeStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n🗑️  Deleting all jobs to compact database...');
    
    // Keep only the most recent 100 jobs to maintain some content
    // while freeing up space
    const recentJobs = await collection.find()
      .sort({ scrapedDate: -1 })
      .limit(100)
      .toArray();
    
    console.log(`💾 Preserving ${recentJobs.length} most recent jobs`);
    
    // Delete all jobs
    const deleteResult = await collection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} jobs`);
    
    // Reinsert the recent jobs
    if (recentJobs.length > 0) {
      await collection.insertMany(recentJobs);
      console.log(`✅ Re-inserted ${recentJobs.length} recent jobs`);
    }
    
    // Get new stats
    const afterStats = await db.stats();
    console.log(`\n📊 After compaction:`);
    console.log(`   Jobs: ${await collection.countDocuments()}`);
    console.log(`   Data size: ${(afterStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Space freed: ${((beforeStats.dataSize - afterStats.dataSize) / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n📥 The next scraper run will import fresh jobs');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

compactDatabase()
  .then(() => {
    console.log('\n✅ Database compacted successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Compaction failed:', error.message);
    process.exit(1);
  });
