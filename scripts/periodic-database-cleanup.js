/**
 * Periodic Database Cleanup Script - FIXED VERSION
 * Now properly tracks deleted jobs to return 410 Gone
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

class DatabaseCleaner {
  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI);
    this.cleanupStats = {
      totalProcessed: 0,
      duplicatesRemoved: 0,
      oldJobsRemoved: 0,
      emptyJobsRemoved: 0,
      spaceSaved: 0,
      jobsTracked: 0
    };
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Connected to MongoDB');
  }

  async disconnect() {
    await this.client.close();
    console.log('✅ Disconnected from MongoDB');
  }

  /**
   * Track deleted jobs before removal (NEW - CRITICAL FIX)
   */
  async trackDeletedJobs(jobs, source) {
    if (jobs.length === 0) return;
    
    const db = this.client.db();
    const deletedJobsCollection = db.collection('deleted_jobs');
    
    const deletionDate = new Date();
    const expiresAt = new Date(deletionDate);
    expiresAt.setDate(expiresAt.getDate() + 90); // Keep tracking for 90 days
    
    const trackingOps = jobs.map(job => ({
      updateOne: {
        filter: { jobId: (job.uniqueIdentifier || job._id).toString() },
        update: {
          $set: {
            jobId: (job.uniqueIdentifier || job._id).toString(),
            deletedAt: deletionDate,
            expiresAt,
            originalTitle: job.title || 'N/A',
            originalCompany: job.company || 'N/A',
            originalUrl: job.url || job.job_url || 'N/A',
            source: source,
          }
        },
        upsert: true
      }
    }));
    
    if (trackingOps.length > 0) {
      await deletedJobsCollection.bulkWrite(trackingOps);
      this.cleanupStats.jobsTracked += trackingOps.length;
      console.log(`  📝 Tracked ${trackingOps.length} deleted jobs for 410 responses`);
    }
  }

  /**
   * Remove jobs older than specified days - NOW WITH TRACKING
   */
  async removeOldJobs(dbName, daysOld = 60) {
    const db = this.client.db(dbName);
    const collection = db.collection('jobs');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    console.log(`\n🗓️  Removing jobs older than ${daysOld} days from ${dbName}...`);
    
    // CRITICAL FIX: Get jobs BEFORE deletion to track them
    const oldJobs = await collection.find({
      $or: [
        { createdAt: { $lt: cutoffDate } },
        { scrapedDate: { $lt: cutoffDate } },
        { postedDate: { $lt: cutoffDate } }
      ]
    }, {
      projection: { _id: 1, uniqueIdentifier: 1, title: 1, company: 1, url: 1, job_url: 1 }
    }).toArray();
    
    if (oldJobs.length > 0) {
      // Track deleted jobs BEFORE deleting them
      await this.trackDeletedJobs(oldJobs, 'periodic_cleanup_old_jobs');
      
      // Now delete the jobs
      const result = await collection.deleteMany({
        $or: [
          { createdAt: { $lt: cutoffDate } },
          { scrapedDate: { $lt: cutoffDate } },
          { postedDate: { $lt: cutoffDate } }
        ]
      });
      
      console.log(`  ✅ Removed ${result.deletedCount} old jobs`);
      this.cleanupStats.oldJobsRemoved += result.deletedCount;
    } else {
      console.log(`  ✅ No old jobs found`);
    }
  }

  /**
   * Remove duplicate jobs based on URL - NOW WITH TRACKING
   */
  async removeDuplicates(dbName) {
    const db = this.client.db(dbName);
    const collection = db.collection('jobs');
    
    console.log(`\n🔍 Removing duplicate jobs from ${dbName}...`);
    
    const allJobs = await collection.find({}).toArray();
    const seenUrls = new Map();
    const idsToRemove = [];
    const jobsToTrack = [];
    
    for (const job of allJobs) {
      const url = job.url || job.job_url;
      if (!url) continue;
      
      if (seenUrls.has(url)) {
        // Keep the newer one, mark older for removal
        const existing = seenUrls.get(url);
        const existingDate = new Date(existing.createdAt || existing.scrapedDate || 0);
        const currentDate = new Date(job.createdAt || job.scrapedDate || 0);
        
        if (currentDate < existingDate) {
          idsToRemove.push(job._id);
          jobsToTrack.push(job);
        } else {
          idsToRemove.push(existing._id);
          jobsToTrack.push(existing);
          seenUrls.set(url, job);
        }
      } else {
        seenUrls.set(url, job);
      }
    }
    
    if (idsToRemove.length > 0) {
      // Track duplicates BEFORE deleting
      await this.trackDeletedJobs(jobsToTrack, 'periodic_cleanup_duplicates');
      
      // Delete duplicates
      const result = await collection.deleteMany({
        _id: { $in: idsToRemove }
      });
      console.log(`  ✅ Removed ${result.deletedCount} duplicate jobs`);
      this.cleanupStats.duplicatesRemoved += result.deletedCount;
    } else {
      console.log(`  ✅ No duplicate jobs found`);
    }
  }

  /**
   * Remove jobs with invalid/missing data - NOW WITH TRACKING
   */
  async removeInvalidJobs(dbName) {
    const db = this.client.db(dbName);
    const collection = db.collection('jobs');
    
    console.log(`\n🧹 Removing invalid jobs from ${dbName}...`);
    
    // Find invalid jobs
    const invalidJobs = await collection.find({
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' },
        { description: { $regex: /^.{0,20}$/ } }, // Very short descriptions
        { title: { $exists: false } },
        { title: null },
        { title: '' }
      ]
    }, {
      projection: { _id: 1, uniqueIdentifier: 1, title: 1, company: 1, url: 1, job_url: 1 }
    }).toArray();
    
    if (invalidJobs.length > 0) {
      // Track invalid jobs BEFORE deleting
      await this.trackDeletedJobs(invalidJobs, 'periodic_cleanup_invalid_jobs');
      
      // Delete invalid jobs
      const result = await collection.deleteMany({
        $or: [
          { description: { $exists: false } },
          { description: null },
          { description: '' },
          { description: { $regex: /^.{0,20}$/ } },
          { title: { $exists: false } },
          { title: null },
          { title: '' }
        ]
      });
      
      console.log(`  ✅ Removed ${result.deletedCount} invalid jobs`);
      this.cleanupStats.emptyJobsRemoved += result.deletedCount;
    } else {
      console.log(`  ✅ No invalid jobs found`);
    }
  }

  /**
   * Remove test/mock jobs - NOW WITH TRACKING
   */
  async removeTestJobs(dbName) {
    const db = this.client.db(dbName);
    const collection = db.collection('jobs');
    
    console.log(`\n🧪 Removing test/mock jobs from ${dbName}...`);
    
    // Find test jobs
    const testJobs = await collection.find({
      $or: [
        { url: { $regex: /example\.com/i } },
        { company: { $regex: /test|mock|sample/i } },
        { title: { $regex: /test|mock|sample|example/i } },
        { description: { $regex: /this is a test|mock data|sample job/i } }
      ]
    }, {
      projection: { _id: 1, uniqueIdentifier: 1, title: 1, company: 1, url: 1, job_url: 1 }
    }).toArray();
    
    if (testJobs.length > 0) {
      // Track test jobs BEFORE deleting
      await this.trackDeletedJobs(testJobs, 'periodic_cleanup_test_jobs');
      
      // Delete test jobs
      const result = await collection.deleteMany({
        $or: [
          { url: { $regex: /example\.com/i } },
          { company: { $regex: /test|mock|sample/i } },
          { title: { $regex: /test|mock|sample|example/i } },
          { description: { $regex: /this is a test|mock data|sample job/i } }
        ]
      });
      
      console.log(`  ✅ Removed ${result.deletedCount} test/mock jobs`);
    } else {
      console.log(`  ✅ No test/mock jobs found`);
    }
  }

  /**
   * Ensure deleted_jobs collection has proper indexes
   */
  async ensureDeletedJobsIndexes() {
    const db = this.client.db();
    const collection = db.collection('deleted_jobs');
    
    try {
      // Create TTL index to auto-delete after 90 days
      await collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      );
      
      // Create index on jobId for fast lookups
      await collection.createIndex(
        { jobId: 1 },
        { unique: true }
      );
      
      console.log('✅ Deleted jobs indexes verified');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error('⚠️  Error creating indexes:', error.message);
      }
    }
  }

  /**
   * Run all cleanup tasks
   */
  async runCleanup(maxAgeDays = 60) {
    console.log('\n🧹 Starting periodic database cleanup...');
    console.log(`   Max age: ${maxAgeDays} days\n`);
    
    try {
      // Ensure indexes are in place
      await this.ensureDeletedJobsIndexes();
      
      const dbName = process.env.MONGODB_DB || 'clickclickjob';
      
      // Run all cleanup operations
      await this.removeOldJobs(dbName, maxAgeDays);
      await this.removeDuplicates(dbName);
      await this.removeInvalidJobs(dbName);
      await this.removeTestJobs(dbName);
      
      // Print summary
      console.log('\n📊 Cleanup Summary:');
      console.log(`   Old jobs removed: ${this.cleanupStats.oldJobsRemoved}`);
      console.log(`   Duplicates removed: ${this.cleanupStats.duplicatesRemoved}`);
      console.log(`   Invalid jobs removed: ${this.cleanupStats.emptyJobsRemoved}`);
      console.log(`   ✅ Total tracked: ${this.cleanupStats.jobsTracked} (will return 410 Gone)`);
      
      const totalRemoved = this.cleanupStats.oldJobsRemoved + 
                          this.cleanupStats.duplicatesRemoved + 
                          this.cleanupStats.emptyJobsRemoved;
      console.log(`   Total jobs removed: ${totalRemoved}`);
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const cleaner = new DatabaseCleaner();
  
  try {
    await cleaner.connect();
    
    // Get max age from command line or use default
    const maxAge = process.argv.find(arg => arg.startsWith('--max-age='))?.split('=')[1] || 60;
    
    await cleaner.runCleanup(parseInt(maxAge));
    
    console.log('\n✅ Database cleanup completed successfully!');
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await cleaner.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseCleaner;
