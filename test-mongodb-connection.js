/**
 * Test MongoDB connection and verify job data access
 * Run with: node test-mongodb-connection.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

// Connection URI from environment
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'clickclickjob';

// Exit if missing URI
if (!uri) {
  console.error('Error: MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('Testing MongoDB connection...');
  console.log(`Using database: ${dbName}`);

  // Create a new MongoClient
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');

    // Get database reference
    const db = client.db(dbName);
    
    // Get list of collections
    const collections = await db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Count jobs in the "jobs" collection
    const jobsCollection = db.collection('jobs');
    const totalJobs = await jobsCollection.countDocuments();
    console.log(`\nTotal jobs in collection: ${totalJobs}`);
    
    // Check for remote jobs
    const remoteJobs = await jobsCollection.countDocuments({ remote: true });
    console.log(`Remote jobs: ${remoteJobs}`);
    
    // Check for admin-related jobs
    const adminJobs = await jobsCollection.countDocuments({
      $or: [
        { title: { $regex: 'admin|administrative|data entry|virtual assistant', $options: 'i' } },
        { jobType: { $in: ['Administrative', 'Data Entry', 'Virtual Assistant', 'Customer Service'] } }
      ]
    });
    console.log(`Admin-related jobs: ${adminJobs}`);
    
    // Sample a few jobs to display
    console.log('\nSample jobs:');
    const sampleJobs = await jobsCollection.find().limit(3).toArray();
    sampleJobs.forEach((job, index) => {
      console.log(`\nJob ${index + 1}:`);
      console.log(`- Title: ${job.title}`);
      console.log(`- Company: ${job.company}`);
      console.log(`- Type: ${job.jobType || 'Not specified'}`);
      console.log(`- Remote: ${job.remote ? 'Yes' : 'No'}`);
    });

    console.log('\n✅ MongoDB connection test completed successfully!');

  } catch (err) {
    console.error('❌ Error connecting to MongoDB:', err.message);
    if (err.name === 'MongoServerSelectionError') {
      console.error('\nThis error typically occurs when:');
      console.error('1. Your connection string is incorrect');
      console.error('2. The MongoDB server is not running');
      console.error('3. Network firewall or security group is blocking the connection');
      console.error('4. IP access list restrictions are preventing connection (Atlas)');
    }
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the main function
main().catch(console.error); 