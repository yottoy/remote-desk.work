// Check all collections in the database
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkAllCollections() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📦 Found ${collections.length} collections:\n`);
    
    // Get stats for each collection
    for (const collInfo of collections) {
      const collName = collInfo.name;
      const collection = db.collection(collName);
      
      try {
        const stats = await collection.stats();
        const count = await collection.countDocuments();
        
        console.log(`📊 ${collName}:`);
        console.log(`   Documents: ${count}`);
        console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Storage: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Indexes: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
        console.log('');
      } catch (err) {
        console.log(`⚠️  ${collName}: Unable to get stats (${err.message})`);
        console.log('');
      }
    }
    
    // Get overall database stats
    const dbStats = await db.stats();
    console.log(`\n🗄️  Overall Database Stats:`);
    console.log(`   Total Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Total Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Total Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

checkAllCollections()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Check failed:', error.message);
    process.exit(1);
  });
