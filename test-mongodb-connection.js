/**
 * Test MongoDB Connection for GitHub Actions
 * 
 * This script tests if the MongoDB connection works with the secrets
 * provided in the GitHub Actions environment.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testMongoConnection() {
  console.log('🔍 Testing MongoDB connection...');
  
  // Get connection details from environment
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'clickclickjob';
  
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable not found');
    process.exit(1);
  }
  
  console.log(`📡 Connecting to database: ${dbName}`);
  console.log(`🔗 URI starts with: ${uri.substring(0, 20)}...`);
  
  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    // Test database access
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);
    
    // Test jobs collection specifically
    const jobsCollection = db.collection('jobs');
    const jobCount = await jobsCollection.countDocuments();
    console.log(`💼 Jobs collection contains ${jobCount} documents`);
    
    // Test write permissions by creating a test document
    const testDoc = {
      _test: true,
      timestamp: new Date(),
      source: 'github-actions-test'
    };
    
    await jobsCollection.insertOne(testDoc);
    console.log('✅ Successfully tested write permissions');
    
    // Clean up test document
    await jobsCollection.deleteOne({ _test: true });
    console.log('🧹 Cleaned up test document');
    
    console.log('🎉 MongoDB connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

testMongoConnection().catch(console.error); 