#!/usr/bin/env node
/**
 * Enhanced MongoDB Job Cleanup Script
 * Removes old jobs and optionally invalid/duplicate jobs before scraping
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuration - can be overridden by command line args
const DEFAULT_MAX_AGE_DAYS = 30;  // Keep jobs from last 30 days
const DEFAULT_DRY_RUN = false;

// Parse command line arguments
const args = process.argv.slice(2);
const maxAgeDays = args.find(arg => arg.startsWith('--days='))?.split('=')[1] || DEFAULT_MAX_AGE_DAYS;
const dryRun = args.includes('--dry-run') || DEFAULT_DRY_RUN;
const removeInvalid = args.includes('--remove-invalid');
const removeDuplicates = args.includes('--remove-duplicates');
const verbose = args.includes('--verbose');

function log(message, force = false) {
  if (verbose || force) {
    console.log(message);
  }
}

async function cleanupOldJobs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const collection = db.collection('jobs');
    
    // Get initial count
    const initialCount = await collection.countDocuments();
    console.log(`\n📊 Initial job count: ${initialCount}`);
    
    let deletedCount = 0;
    
    // 1. Remove old jobs
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(maxAgeDays));
    
    console.log(`\n🔍 Step 1: Checking for jobs older than ${maxAgeDays} days (before ${cutoffDate.toISOString().split('T')[0]})`);
    
    const oldJobsCount = await collection.countDocuments({
      $or: [
        { scrapedDate: { $lt: cutoffDate } },
        { createdAt: { $lt: cutoffDate } },
        { date_posted: { $lt: cutoffDate } }
      ]
    });
    
    log(`   Found ${oldJobsCount} old jobs`, true);
    
    if (oldJobsCount > 0 && !dryRun) {
      const deleteResult = await collection.deleteMany({
        $or: [
          { scrapedDate: { $lt: cutoffDate } },
          { createdAt: { $lt: cutoffDate } },
          { date_posted: { $lt: cutoffDate } }
        ]
      });
      deletedCount += deleteResult.deletedCount;
      console.log(`   ✅ Deleted ${deleteResult.deletedCount} old jobs`);
    } else if (dryRun && oldJobsCount > 0) {
      console.log(`   🔍 DRY RUN: Would delete ${oldJobsCount} old jobs`);
    } else {
      console.log(`   ✅ No old jobs to remove`);
    }
    
    // 2. Remove invalid jobs (optional)
    if (removeInvalid) {
      console.log(`\n🔍 Step 2: Checking for invalid jobs (missing required fields)`);
      
      const invalidJobsCount = await collection.countDocuments({
        $or: [
          { title: { $exists: false } },
          { title: '' },
          { job_url: { $exists: false } },
          { job_url: '' },
          { company: { $exists: false } },
          { company: '' }
        ]
      });
      
      log(`   Found ${invalidJobsCount} invalid jobs`, true);
      
      if (invalidJobsCount > 0 && !dryRun) {
        const deleteResult = await collection.deleteMany({
          $or: [
            { title: { $exists: false } },
            { title: '' },
            { job_url: { $exists: false } },
            { job_url: '' },
            { company: { $exists: false } },
            { company: '' }
          ]
        });
        deletedCount += deleteResult.deletedCount;
        console.log(`   ✅ Deleted ${deleteResult.deletedCount} invalid jobs`);
      } else if (dryRun && invalidJobsCount > 0) {
        console.log(`   🔍 DRY RUN: Would delete ${invalidJobsCount} invalid jobs`);
      } else {
        console.log(`   ✅ No invalid jobs to remove`);
      }
    }
    
    // 3. Remove duplicates (optional)
    if (removeDuplicates) {
      console.log(`\n🔍 Step 3: Checking for duplicate jobs (same job_url)`);
      
      const duplicates = await collection.aggregate([
        {
          $group: {
            _id: '$job_url',
            count: { $sum: 1 },
            ids: { $push: '$_id' }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ]).toArray();
      
      log(`   Found ${duplicates.length} duplicate job URLs`, true);
      
      let duplicatesDeleted = 0;
      if (duplicates.length > 0 && !dryRun) {
        // Keep the newest one, delete the rest
        for (const dup of duplicates) {
          // Keep first, delete rest
          const idsToDelete = dup.ids.slice(1);
          const result = await collection.deleteMany({
            _id: { $in: idsToDelete }
          });
          duplicatesDeleted += result.deletedCount;
        }
        deletedCount += duplicatesDeleted;
        console.log(`   ✅ Deleted ${duplicatesDeleted} duplicate jobs (kept newest)`);
      } else if (dryRun && duplicates.length > 0) {
        const totalDuplicates = duplicates.reduce((sum, dup) => sum + (dup.count - 1), 0);
        console.log(`   🔍 DRY RUN: Would delete ${totalDuplicates} duplicate jobs`);
      } else {
        console.log(`   ✅ No duplicate jobs to remove`);
      }
    }
    
    // Final stats
    const finalCount = await collection.countDocuments();
    const recentJobs = await collection.countDocuments({
      $or: [
        { scrapedDate: { $gte: cutoffDate } },
        { createdAt: { $gte: cutoffDate } }
      ]
    });
    
    console.log(`\n📊 Cleanup Summary:`);
    console.log(`   Initial jobs: ${initialCount}`);
    if (!dryRun) {
      console.log(`   Deleted: ${deletedCount}`);
      console.log(`   Final jobs: ${finalCount}`);
    }
    console.log(`   Recent jobs (last ${maxAgeDays} days): ${recentJobs}`);
    
    // Show breakdown by source
    if (verbose) {
      console.log(`\n📊 Jobs by source:`);
      const sources = await collection.aggregate([
        {
          $group: {
            _id: '$site',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]).toArray();
      
      sources.forEach(source => {
        console.log(`   ${source._id || 'unknown'}: ${source.count}`);
      });
    }
    
    return {
      initialCount,
      deletedCount,
      finalCount,
      recentJobs
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
MongoDB Job Cleanup Script

Usage: node cleanup-old-jobs-enhanced.js [options]

Options:
  --days=N              Keep jobs from last N days (default: 30)
  --dry-run            Show what would be deleted without deleting
  --remove-invalid     Also remove jobs with missing required fields
  --remove-duplicates  Also remove duplicate jobs (same URL)
  --verbose            Show detailed output
  --help, -h           Show this help message

Examples:
  # Remove jobs older than 30 days
  node cleanup-old-jobs-enhanced.js

  # Remove jobs older than 45 days
  node cleanup-old-jobs-enhanced.js --days=45

  # See what would be deleted without actually deleting
  node cleanup-old-jobs-enhanced.js --dry-run

  # Full cleanup: old jobs + invalid + duplicates
  node cleanup-old-jobs-enhanced.js --days=30 --remove-invalid --remove-duplicates

  # Dry run of full cleanup with verbose output
  node cleanup-old-jobs-enhanced.js --days=30 --remove-invalid --remove-duplicates --dry-run --verbose
`);
  process.exit(0);
}

// Run cleanup
console.log('🧹 Starting MongoDB cleanup...');
if (dryRun) {
  console.log('🔍 DRY RUN MODE - No data will be deleted\n');
}

cleanupOldJobs()
  .then((stats) => {
    console.log('\n✅ Cleanup completed successfully');
    if (!dryRun) {
      console.log(`   Freed up space from ${stats.deletedCount} jobs`);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  });

