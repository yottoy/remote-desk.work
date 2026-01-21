// Clean up old backup collections to free up space
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function cleanupBackups() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} total collections\n`);
    
    // Identify backup collections to delete
    const backupCollections = collections.filter(c => 
      c.name.includes('backup') || 
      c.name.includes('archive') || 
      c.name === 'deleted_jobs' ||
      c.name === 'analytics_events'
    );
    
    console.log(`🗑️  Found ${backupCollections.length} backup/archive collections to delete:\n`);
    backupCollections.forEach(c => console.log(`   - ${c.name}`));
    
    if (backupCollections.length === 0) {
      console.log('\n✅ No backup collections to delete');
      return;
    }
    
    console.log(`\n⚠️  This will delete ${backupCollections.length} collections`);
    console.log('Proceeding in 2 seconds...\n');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Delete each backup collection
    let deletedCount = 0;
    for (const collInfo of backupCollections) {
      try {
        await db.collection(collInfo.name).drop();
        console.log(`✅ Deleted: ${collInfo.name}`);
        deletedCount++;
      } catch (err) {
        console.log(`⚠️  Failed to delete ${collInfo.name}: ${err.message}`);
      }
    }
    
    console.log(`\n🗑️  Successfully deleted ${deletedCount} of ${backupCollections.length} collections`);
    
    // Get new stats
    const afterStats = await db.stats();
    console.log(`\n📊 Database Stats After Cleanup:`);
    console.log(`   Data Size: ${(afterStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Storage Size: ${(afterStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    // List remaining collections
    const remainingCollections = await db.listCollections().toArray();
    console.log(`\n📦 Remaining collections (${remainingCollections.length}):`);
    remainingCollections.forEach(c => console.log(`   - ${c.name}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

cleanupBackups()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  });
