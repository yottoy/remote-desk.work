/**
 * Test MongoDB connection
 * 
 * This script tests the MongoDB connection using the configuration from config.js.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config/config');
const { MongoClient } = require('mongodb');

async function testMongooseConnection() {
  try {
    console.log('Testing MongoDB connection with Mongoose...');
    console.log(`MongoDB URI: ${config.mongodb.uri}`);
    
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('✅ Successfully connected to MongoDB with Mongoose!');
    
    // Display database information
    const db = mongoose.connection.db;
    console.log('Connected to database:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', ') || 'No collections found');
    
    return true;
  } catch (error) {
    console.error(`❌ Mongoose connection error: ${error.message}`);
    return false;
  } finally {
    try {
      await mongoose.disconnect();
      console.log('Mongoose connection closed');
    } catch (err) {
      // Ignore disconnect errors
    }
  }
}

async function testMongoClientConnection() {
  try {
    console.log('\nTesting MongoDB connection with MongoClient...');
    
    const client = new MongoClient(config.mongodb.uri, config.mongodb.options);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB with MongoClient!');
    
    // Display database information
    const db = client.db();
    console.log('Connected to database:', db.databaseName);
    
    // Get database stats
    const stats = await db.stats();
    console.log('Database stats:', {
      collections: stats.collections,
      documents: stats.objects,
      dataSize: `${Math.round(stats.dataSize / 1024 / 1024 * 100) / 100} MB`,
      storageSize: `${Math.round(stats.storageSize / 1024 / 1024 * 100) / 100} MB`
    });
    
    return true;
  } catch (error) {
    console.error(`❌ MongoClient connection error: ${error.message}`);
    return false;
  } finally {
    try {
      await client.close();
      console.log('MongoClient connection closed');
    } catch (err) {
      // Ignore disconnect errors
    }
  }
}

async function testMongoDBConnection() {
  console.log('Checking environment variables...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI not found in environment variables');
    console.log('Available environment variables:', Object.keys(process.env).filter(key => 
      !key.includes('SECRET') && 
      !key.includes('TOKEN') && 
      !key.includes('PASSWORD')).join(', '));
    return;
  }

  console.log('MongoDB URI exists:', true);
  console.log('URI begins with:', uri.substring(0, 10) + '...');

  try {
    console.log('Attempting to connect to MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', ') || 'No collections found');
    
    if (collections.some(c => c.name === 'jobs')) {
      const jobsCollection = db.collection('jobs');
      const count = await jobsCollection.countDocuments();
      console.log('Number of jobs in the database:', count);
    } else {
      console.log('No jobs collection found.');
    }
    
    await client.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('ERROR connecting to MongoDB:', error.message);
    console.log('Check if MongoDB server is running and URI is correct.');
  }
}

async function main() {
  console.log('=== MongoDB Connection Test ===');
  
  // Test with both methods
  const mongooseSuccess = await testMongooseConnection();
  const mongoClientSuccess = await testMongoClientConnection();
  
  // Check overall success
  if (mongooseSuccess && mongoClientSuccess) {
    console.log('\n✅ MongoDB connection tests passed!');
    process.exit(0);
  } else {
    console.error('\n❌ MongoDB connection tests failed!');
    
    // Provide troubleshooting help
    console.log('\nTroubleshooting Tips:');
    console.log('1. Ensure MongoDB is running locally (if using localhost)');
    console.log('2. Check if MongoDB connection URI is correct in .env file or config.js');
    console.log('3. Verify MongoDB credentials if using Atlas or other cloud service');
    console.log('4. Check network settings and firewall rules if connecting to remote database');
    
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

testMongoDBConnection(); 