#!/usr/bin/env node

/**
 * Setup Deleted Jobs Tracking
 * 
 * Initializes the deleted_jobs collection with proper indexes
 * Run this once to set up the tracking system
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function setupDeletedJobsTracking() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const collection = db.collection('deleted_jobs');
    
    console.log('\n🔧 Setting up deleted_jobs collection...');
    
    // Create TTL index to auto-delete records after 90 days
    await collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: 'ttl_index' }
    );
    console.log('  ✅ Created TTL index for auto-cleanup');
    
    // Create unique index on jobId for fast lookups
    await collection.createIndex(
      { jobId: 1 },
      { unique: true, name: 'jobId_unique' }
    );
    console.log('  ✅ Created unique index on jobId');
    
    // Create index on deletedAt for reporting
    await collection.createIndex(
      { deletedAt: 1 },
      { name: 'deletedAt_index' }
    );
    console.log('  ✅ Created index on deletedAt');
    
    // Get initial count
    const count = await collection.countDocuments();
    console.log(`\n📊 Current tracked deleted jobs: ${count}`);
    
    console.log('\n✅ Setup complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Update job cleanup scripts to call trackDeletedJob()');
    console.log('2. Deploy the updated job detail page');
    console.log('3. Monitor deleted_jobs collection for proper tracking');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

setupDeletedJobsTracking()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

