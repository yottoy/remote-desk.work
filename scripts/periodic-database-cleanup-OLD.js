/**
 * Periodic Database Cleanup Script
 * Prevents MongoDB quota issues by automatically cleaning old and duplicate jobs
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
      spaceSaved: 0
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
   * Remove jobs older than specified days
   */
  async removeOldJobs(dbName, daysOld = 60) {
    const db = this.client.db(dbName);
    const collection = db.collection('jobs');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    console.log(`\n🗓️  Removing jobs older than ${daysOld} days from ${dbName}...`);
    
    const oldJobs = await collection.find({
      $or: [
        { createdAt: { $lt: cutoffDate } },
        { scrapedDate: { $lt: cutoffDate } },
        { postedDate: { $lt: cutoffDate } }
      ]
    }).toArray();
    
    if (oldJobs.length > 0) {
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
   * Remove duplicate jobs based on URL
   */
  async removeDuplicates(dbName) {
    const db = this.client.db(dbName);
    const collection = db.collection('jobs');
    
    console.log(`\n🔗 Removing duplicate jobs from ${dbName}...`);
    
    // Find duplicates by URL
    const duplicates = await collection.aggregate([
      { $match: { url: { $exists: true, $ne: null } } },
      { $group: { 
          _id: '$url', 
          ids: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    let totalDuplicatesRemoved = 0;
    
    for (const duplicate of duplicates) {
      // Keep the first job, remove the rest
      const idsToRemove = duplicate.ids.slice(1);
      const result = await collection.deleteMany({
        _id: { $in: idsToRemove }
      });
      totalDuplicatesRemoved += result.deletedCount;
    }
    
    console.log(`  ✅ Removed ${totalDuplicatesRemoved} duplicate jobs`);
    this.cleanupStats.duplicatesRemoved += totalDuplicatesRemoved;
  }

  /**
   * Remove jobs with empty or missing descriptions
   */
  async removeEmptyJobs(dbName) {
    const db = this.client.db(dbName);
    const collection = db.collection('jobs');
    
    console.log(`\n📝 Removing jobs with empty descriptions from ${dbName}...`);
    
    const result = await collection.deleteMany({
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' },
        { description: { $regex: /^.{0,20}$/ } }, // Very short descriptions
        { title: { $exists: false } },
        { title: null },
        { title: '' }
      ]
    });
    
    console.log(`  ✅ Removed ${result.deletedCount} empty/invalid jobs`);
    this.cleanupStats.emptyJobsRemoved += result.deletedCount;
  }

  /**
   * Remove test/mock jobs
   */
  async removeTestJobs(dbName) {
    const db = this.client.db(dbName);
    const collection = db.collection('jobs');
    
    console.log(`\n🧪 Removing test/mock jobs from ${dbName}...`);
    
    const result = await collection.deleteMany({
      $or: [
        { url: { $regex: /example\.com/i } },
        { company: { $regex: /test|mock|sample/i } },
        { title: { $regex: /test|mock|sample|example/i } },
        { description: { $regex: /this is a test|mock data|sample job/i } }
      ]
    });
    
    console.log(`  ✅ Removed ${result.deletedCount} test/mock jobs`);
    this.cleanupStats.emptyJobsRemoved += result.deletedCount;
  }

  /**
   * Optimize database collections
   */
  async optimizeDatabase(dbName) {
    const db = this.client.db(dbName);
    
    console.log(`\n⚡ Optimizing ${dbName} database...`);
    
    try {
      // Ensure indexes exist for common queries
      const collection = db.collection('jobs');
      
      await collection.createIndex({ createdAt: 1 });
      await collection.createIndex({ url: 1 });
      await collection.createIndex({ postedDate: -1 });
      await collection.createIndex({ company: 1 });
      
      console.log(`  ✅ Database indexes optimized`);
    } catch (error) {
      console.log(`  ⚠️  Index optimization failed: ${error.message}`);
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(dbName) {
    const db = this.client.db(dbName);
    const collection = db.collection('jobs');
    
    const count = await collection.countDocuments();
    
    try {
      const stats = await collection.stats();
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      
      return { count, sizeMB };
    } catch (error) {
      return { count, sizeMB: 'Unknown' };
    }
  }

  /**
   * Main cleanup function
   */
  async runCleanup(options = {}) {
    const {
      databases = ['clickclickjob', 'test', 'remote-jobs'],
      maxAgedays = 60,
      removeDupes = true,
      removeEmpty = true,
      removeTest = true,
      optimize = true
    } = options;

    console.log('🧹 STARTING PERIODIC DATABASE CLEANUP');
    console.log('='.repeat(50));
    console.log(`Target databases: ${databases.join(', ')}`);
    console.log(`Max job age: ${maxAgeDays} days`);
    console.log('');

    try {
      await this.connect();

      // Get initial stats
      console.log('📊 BEFORE CLEANUP:');
      const beforeStats = {};
      for (const dbName of databases) {
        const stats = await this.getDatabaseStats(dbName);
        beforeStats[dbName] = stats;
        console.log(`  ${dbName}: ${stats.count} jobs (~${stats.sizeMB} MB)`);
      }

      // Run cleanup operations
      for (const dbName of databases) {
        console.log(`\n🗂️  CLEANING DATABASE: ${dbName}`);
        console.log('='.repeat(30));

        if (removeTest) await this.removeTestJobs(dbName);
        if (removeEmpty) await this.removeEmptyJobs(dbName);
        if (removeDupes) await this.removeDuplicates(dbName);
        await this.removeOldJobs(dbName, maxAgedays);
        if (optimize) await this.optimizeDatabase(dbName);
      }

      // Get final stats
      console.log('\n📊 AFTER CLEANUP:');
      const afterStats = {};
      for (const dbName of databases) {
        const stats = await this.getDatabaseStats(dbName);
        afterStats[dbName] = stats;
        const reduction = beforeStats[dbName].count - stats.count;
        console.log(`  ${dbName}: ${stats.count} jobs (~${stats.sizeMB} MB) [${reduction > 0 ? '-' + reduction : 'no change'}]`);
      }

      // Summary
      console.log('\n✅ CLEANUP SUMMARY:');
      console.log('='.repeat(30));
      console.log(`Old jobs removed: ${this.cleanupStats.oldJobsRemoved}`);
      console.log(`Duplicates removed: ${this.cleanupStats.duplicatesRemoved}`);
      console.log(`Empty jobs removed: ${this.cleanupStats.emptyJobsRemoved}`);
      console.log(`Total jobs removed: ${this.cleanupStats.oldJobsRemoved + this.cleanupStats.duplicatesRemoved + this.cleanupStats.emptyJobsRemoved}`);

    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }

    return this.cleanupStats;
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const maxAge = parseInt(args.find(arg => arg.startsWith('--max-age='))?.split('=')[1]) || 60;

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }

  const cleaner = new DatabaseCleaner();
  
  try {
    if (dryRun) {
      // Just show what would be cleaned
      await cleaner.connect();
      
      for (const dbName of ['clickclickjob', 'test', 'remote-jobs']) {
        const stats = await cleaner.getDatabaseStats(dbName);
        console.log(`${dbName}: ${stats.count} jobs (~${stats.sizeMB} MB)`);
      }
      
      await cleaner.disconnect();
    } else {
      await cleaner.runCleanup({ maxAgedays: maxAge });
    }
    
    console.log('\n🎉 Database cleanup completed successfully!');
  } catch (error) {
    console.error('💥 Database cleanup failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = DatabaseCleaner;

// Run if called directly
if (require.main === module) {
  main();
} 