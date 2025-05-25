/**
 * Comprehensive MongoDB Cleanup Script for ClickClickJob
 * 
 * This script:
 * 1. Removes any mock/fallback entries (with example.com URLs)
 * 2. Addresses data quality issues (missing descriptions, etc.)
 * 3. Provides a detailed report of the cleanup
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function cleanupDatabase() {
  // MongoDB connection URI
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MongoDB URI not provided in environment variables.');
    return;
  }

  const DRY_RUN = process.argv.includes('--dry-run');
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE: No changes will be made to the database');
  }

  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB successfully');

    // Get database references
    const dbNames = ['clickclickjob', 'test', 'remote-jobs'];
    const results = {
      mockEntriesRemoved: 0,
      emptyDescriptionsRemoved: 0,
      lowQualityRemoved: 0,
      totalRemoved: 0,
      totalProcessed: 0
    };

    for (const dbName of dbNames) {
      const db = client.db(dbName);
      console.log(`\n==========================================`);
      console.log(`Processing database: ${dbName}`);
      console.log(`==========================================`);

      // Check if the jobs collection exists in this database
      const collections = await db.listCollections({ name: 'jobs' }).toArray();
      if (collections.length === 0) {
        console.log(`No 'jobs' collection found in ${dbName} database.`);
        continue;
      }

      const jobsCollection = db.collection('jobs');
      
      // Get total job count before cleanup
      const totalJobs = await jobsCollection.countDocuments();
      console.log(`Total jobs in ${dbName}.jobs before cleanup: ${totalJobs}`);
      results.totalProcessed += totalJobs;
      
      // 1. STEP: Remove mock entries (fallback data)
      console.log('\n1. Removing mock/fallback entries:');
      const mockQuery = {
        $or: [
          { url: { $regex: 'example.com', $options: 'i' } },
          { url: { $regex: 'fallback', $options: 'i' } },
          { url: { $regex: 'mock', $options: 'i' } },
          { is_mock_data: true },
          { mock_reason: { $exists: true } },
          { isMock: true },
          { source: 'mock_data' }
        ]
      };
      
      const mockCount = await jobsCollection.countDocuments(mockQuery);
      console.log(`Found ${mockCount} mock/fallback entries`);
      
      if (mockCount > 0) {
        if (DRY_RUN) {
          console.log(`Would delete ${mockCount} mock entries`);
          results.mockEntriesRemoved += mockCount;
        } else {
          const deleteResult = await jobsCollection.deleteMany(mockQuery);
          console.log(`Deleted ${deleteResult.deletedCount} mock entries`);
          results.mockEntriesRemoved += deleteResult.deletedCount;
        }
      }
      
      // 2. STEP: Remove entries with missing or empty descriptions
      console.log('\n2. Handling entries with missing descriptions:');
      const missingDescQuery = {
        $or: [
          { $and: [
            { description: { $exists: false } },
            { descriptionText: { $exists: false } }
          ]},
          { $and: [
            { description: null },
            { descriptionText: null }
          ]},
          { $and: [
            { description: "" },
            { descriptionText: "" }
          ]}
        ]
      };
      
      const emptyDescCount = await jobsCollection.countDocuments(missingDescQuery);
      console.log(`Found ${emptyDescCount} entries with empty/missing descriptions`);
      
      if (emptyDescCount > 0) {
        if (DRY_RUN) {
          console.log(`Would delete ${emptyDescCount} entries with empty descriptions`);
          results.emptyDescriptionsRemoved += emptyDescCount;
        } else {
          const deleteResult = await jobsCollection.deleteMany(missingDescQuery);
          console.log(`Deleted ${deleteResult.deletedCount} entries with empty descriptions`);
          results.emptyDescriptionsRemoved += deleteResult.deletedCount;
        }
      }
      
      // 3. STEP: Remove very low-quality entries with extremely short descriptions
      console.log('\n3. Handling entries with very short descriptions:');
      // Only consider descriptions that are extremely short (<20 chars) as low quality
      const shortDescQuery = {
        $or: [
          { 
            description: { $exists: true, $ne: null, $ne: "", $type: "string" }, 
            $expr: { $lt: [{ $strLenCP: "$description" }, 20] } 
          },
          { 
            descriptionText: { $exists: true, $ne: null, $ne: "", $type: "string" }, 
            $expr: { $lt: [{ $strLenCP: "$descriptionText" }, 20] } 
          }
        ]
      };
      
      const shortDescCount = await jobsCollection.countDocuments(shortDescQuery);
      console.log(`Found ${shortDescCount} entries with very short descriptions (<20 chars)`);
      
      if (shortDescCount > 0) {
        // Sample some short descriptions
        const samples = await jobsCollection.find(shortDescQuery).limit(3).toArray();
        console.log('\nSamples of very short descriptions:');
        samples.forEach(job => {
          console.log(`- "${job.title}" at "${job.company}"`);
          console.log(`  Description: "${job.descriptionText || job.description}"`);
        });
        
        if (DRY_RUN) {
          console.log(`Would delete ${shortDescCount} entries with very short descriptions`);
          results.lowQualityRemoved += shortDescCount;
        } else {
          const deleteResult = await jobsCollection.deleteMany(shortDescQuery);
          console.log(`Deleted ${deleteResult.deletedCount} entries with very short descriptions`);
          results.lowQualityRemoved += deleteResult.deletedCount;
        }
      }
      
      // Get final count for this database
      const remainingJobs = await jobsCollection.countDocuments();
      const removedFromDb = totalJobs - remainingJobs;
      const wouldRemove = mockCount + emptyDescCount + shortDescCount;
      
      if (DRY_RUN) {
        console.log(`\nWould remove ${wouldRemove} jobs from ${dbName}`);
      } else {
        console.log(`\nRemoved ${removedFromDb} jobs from ${dbName}`);
        results.totalRemoved += removedFromDb;
      }
      console.log(`Remaining jobs: ${remainingJobs}`);
    }

    // Final summary across all databases
    console.log(`\n====== CLEANUP SUMMARY ======`);
    if (DRY_RUN) {
      const totalWouldRemove = results.mockEntriesRemoved + results.emptyDescriptionsRemoved + results.lowQualityRemoved;
      console.log(`DRY RUN SUMMARY - No changes were made`);
      console.log(`Would remove ${totalWouldRemove} entries in total:`);
      console.log(`- Mock/fallback entries: ${results.mockEntriesRemoved}`);
      console.log(`- Entries with empty descriptions: ${results.emptyDescriptionsRemoved}`);
      console.log(`- Entries with very short descriptions: ${results.lowQualityRemoved}`);
    } else {
      console.log(`Processed ${results.totalProcessed} jobs across all databases`);
      console.log(`Removed ${results.totalRemoved} entries in total:`);
      console.log(`- Mock/fallback entries: ${results.mockEntriesRemoved}`);
      console.log(`- Entries with empty descriptions: ${results.emptyDescriptionsRemoved}`);
      console.log(`- Entries with very short descriptions: ${results.lowQualityRemoved}`);
      console.log(`\nDatabase cleanup completed successfully!`);
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

console.log("=================================");
console.log("ClickClickJob Database Cleanup Tool");
console.log("=================================");
console.log("This script will clean up the job database by removing:");
console.log("1. Mock/fallback entries with example.com URLs");
console.log("2. Entries with missing or empty descriptions");
console.log("3. Low-quality entries with extremely short descriptions");
console.log("");
console.log("Run with --dry-run to see what would be deleted without making changes");
console.log("");

// Run the script
cleanupDatabase().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 