// Clean MongoDB and import fresh data
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function cleanAndImport() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const collection = db.collection('jobs');
    
    // Delete ALL old jobs
    const deleteResult = await collection.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old jobs`);
    
    // Now import fresh data without overwrite (no backup needed)
    await client.close();
    console.log('✅ Old data cleaned. Now run: node import-scraper-to-mongodb.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanAndImport();






