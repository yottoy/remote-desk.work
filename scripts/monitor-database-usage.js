/**
 * Database Usage Monitor
 * Tracks MongoDB usage to prevent quota issues
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function monitorDatabaseUsage() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('📊 DATABASE USAGE MONITOR');
    console.log('='.repeat(40));
    
    const databases = ['clickclickjob', 'test', 'remote-jobs'];
    let totalJobs = 0;
    let estimatedSizeMB = 0;
    const warnings = [];
    
    for (const dbName of databases) {
      const db = client.db(dbName);
      const collection = db.collection('jobs');
      
      const jobCount = await collection.countDocuments();
      totalJobs += jobCount;
      
      // Estimate size (rough calculation: ~1.5KB per job)
      const estimatedDbSize = (jobCount * 1.5) / 1024; // MB
      estimatedSizeMB += estimatedDbSize;
      
      console.log(`${dbName}:`);
      console.log(`  Jobs: ${jobCount}`);
      console.log(`  Estimated size: ${estimatedDbSize.toFixed(2)} MB`);
      
      // Check for potential issues
      if (jobCount > 1000) {
        warnings.push(`${dbName} has ${jobCount} jobs - consider cleanup`);
      }
      
      // Check for old jobs
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const oldJobs = await collection.countDocuments({
        $or: [
          { createdAt: { $lt: thirtyDaysAgo } },
          { scrapedDate: { $lt: thirtyDaysAgo } }
        ]
      });
      
      if (oldJobs > 0) {
        console.log(`  Old jobs (30+ days): ${oldJobs}`);
        if (oldJobs > 100) {
          warnings.push(`${dbName} has ${oldJobs} old jobs - cleanup recommended`);
        }
      }
      
      // Check for duplicates
      const duplicates = await collection.aggregate([
        { $group: { _id: '$url', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: 'duplicates' }
      ]).toArray();
      
      const duplicateCount = duplicates[0]?.duplicates || 0;
      if (duplicateCount > 0) {
        console.log(`  Duplicate URLs: ${duplicateCount}`);
        if (duplicateCount > 50) {
          warnings.push(`${dbName} has ${duplicateCount} duplicate URLs - cleanup recommended`);
        }
      }
      
      console.log('');
    }
    
    // Overall status
    console.log('📈 OVERALL STATUS:');
    console.log(`Total jobs: ${totalJobs}`);
    console.log(`Estimated total size: ${estimatedSizeMB.toFixed(2)} MB`);
    console.log(`MongoDB limit: 512 MB`);
    console.log(`Usage: ${((estimatedSizeMB / 512) * 100).toFixed(1)}%`);
    
    // Status indicator
    if (estimatedSizeMB > 400) {
      console.log('🔴 HIGH USAGE - Cleanup needed soon!');
      warnings.push('Database usage over 78% - immediate cleanup recommended');
    } else if (estimatedSizeMB > 300) {
      console.log('🟡 MODERATE USAGE - Monitor closely');
      warnings.push('Database usage over 58% - schedule cleanup');
    } else {
      console.log('🟢 HEALTHY USAGE');
    }
    
    // Show warnings
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(warning => console.log(`  • ${warning}`));
      
      console.log('\n💡 RECOMMENDATION:');
      console.log('Run: node scripts/periodic-database-cleanup.js');
    }
    
    // Export metrics for potential alerting
    const metrics = {
      totalJobs,
      estimatedSizeMB,
      usagePercent: ((estimatedSizeMB / 512) * 100),
      warnings: warnings.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n📋 METRICS (JSON):');
    console.log(JSON.stringify(metrics, null, 2));
    
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  monitorDatabaseUsage();
}

module.exports = { monitorDatabaseUsage }; 