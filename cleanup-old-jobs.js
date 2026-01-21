// Automated MongoDB Cleanup
// This script deletes jobs older than X days to keep database size manageable

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuration
const MAX_AGE_DAYS = 30;  // Keep jobs from last 30 days only (reduced from 45 to free up space)
const DRY_RUN = false;     // Set to true to see what would be deleted without actually deleting

async function cleanupOldJobs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const collection = db.collection('jobs');
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_AGE_DAYS);
    
    console.log(`🔍 Looking for jobs older than ${MAX_AGE_DAYS} days (before ${cutoffDate.toISOString()})`);
    
    // Count jobs that would be deleted
    const oldJobsCount = await collection.countDocuments({
      scrapedDate: { $lt: cutoffDate }
    });
    
    console.log(`📊 Found ${oldJobsCount} jobs older than ${MAX_AGE_DAYS} days`);
    
    if (oldJobsCount === 0) {
      console.log('✅ No old jobs to clean up!');
      return;
    }
    
    if (DRY_RUN) {
      console.log('🔍 DRY RUN MODE - No jobs will be deleted');
      console.log(`   Would delete ${oldJobsCount} jobs`);
      return;
    }
    
    // Delete old jobs
    const deleteResult = await collection.deleteMany({
      scrapedDate: { $lt: cutoffDate }
    });
    
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old jobs`);
    
    // Show current stats
    const totalJobs = await collection.countDocuments();
    const recentJobs = await collection.countDocuments({
      scrapedDate: { $gte: cutoffDate }
    });
    
    console.log(`\n📊 Database stats after cleanup:`);
    console.log(`   Total jobs: ${totalJobs}`);
    console.log(`   Recent jobs (last ${MAX_AGE_DAYS} days): ${recentJobs}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Run cleanup
cleanupOldJobs()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  });






