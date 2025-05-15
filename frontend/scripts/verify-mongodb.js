const { MongoClient } = require('mongodb');

/**
 * Verifies MongoDB connection
 * Run this script on Vercel to test the connection
 */
async function verifyMongoDBConnection() {
  console.log('Verifying MongoDB connection...');

  if (!process.env.MONGODB_URI) {
    console.error('ERROR: MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || 'clickclickjob';
  let client;

  try {
    // Connect with timeout to prevent hanging
    client = new MongoClient(process.env.MONGODB_URI);
    console.log('Attempting to connect to MongoDB...');
    
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    // Check database
    const db = client.db(dbName);
    console.log(`Connected to database: ${db.databaseName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    if (collections.length > 0) {
      console.log(`Collections found: ${collections.map(c => c.name).join(', ')}`);
      
      // Check for jobs collection
      if (collections.some(c => c.name === 'jobs')) {
        const jobsCount = await db.collection('jobs').countDocuments();
        console.log(`Jobs collection contains ${jobsCount} documents`);
      }
    } else {
      console.warn('⚠️ No collections found. Database may be empty.');
    }
    
    console.log('✅ MongoDB connection verified successfully');
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    return false;
  } finally {
    if (client) await client.close();
    console.log('MongoDB connection closed');
  }
}

// Execute if run directly
if (require.main === module) {
  verifyMongoDBConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = verifyMongoDBConnection; 