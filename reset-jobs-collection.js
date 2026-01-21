// Reset jobs collection to reclaim space
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function resetCollection() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    
    // Get stats before
    const beforeStats = await db.stats();
    console.log(`📊 Before reset:`);
    console.log(`   Data size: ${(beforeStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Storage size: ${(beforeStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Drop the jobs collection entirely
    console.log('\n🗑️  Dropping jobs collection...');
    await db.collection('jobs').drop();
    console.log('✅ Jobs collection dropped');
    
    // Recreate the collection
    console.log('📦 Recreating jobs collection...');
    await db.createCollection('jobs');
    console.log('✅ Jobs collection created');
    
    // Create indexes for performance
    console.log('🔍 Creating indexes...');
    const collection = db.collection('jobs');
    await collection.createIndex({ scrapedDate: -1 });
    await collection.createIndex({ postedDate: -1 });
    await collection.createIndex({ company: 1 });
    await collection.createIndex({ title: 1 });
    console.log('✅ Indexes created');
    
    // Get stats after
    const afterStats = await db.stats();
    console.log(`\n📊 After reset:`);
    console.log(`   Data size: ${(afterStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Storage size: ${(afterStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Space reclaimed: ${((beforeStats.dataSize - afterStats.dataSize) / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n✅ Collection reset complete');
    console.log('📥 Trigger the scraper to import fresh jobs');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

resetCollection()
  .then(() => {
    console.log('\n✅ Reset completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Reset failed:', error.message);
    process.exit(1);
  });
