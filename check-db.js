// Database check script for debugging job URL issues
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MongoDB URI not provided in environment variables.');
    return;
  }

  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const jobsCollection = db.collection('jobs');
    
    // Get total job count first
    const totalJobs = await jobsCollection.countDocuments();
    console.log(`Total jobs in database: ${totalJobs}`);
    
    // Check for jobs with various URL issues
    const noUrlJobs = await jobsCollection.countDocuments({ url: { $exists: false } });
    const nullUrlJobs = await jobsCollection.countDocuments({ url: null });
    const emptyUrlJobs = await jobsCollection.countDocuments({ url: "" });
    const exampleUrlJobs = await jobsCollection.countDocuments({ url: { $regex: "example.com" } });
    const hiddenJobs = await jobsCollection.countDocuments({ hidden: true });
    const validJobs = totalJobs - noUrlJobs - nullUrlJobs - emptyUrlJobs - exampleUrlJobs;
    
    console.log(`URL statistics:`);
    console.log(`- Missing URL field: ${noUrlJobs}`);
    console.log(`- Null URL: ${nullUrlJobs}`);
    console.log(`- Empty URL: ${emptyUrlJobs}`);
    console.log(`- Example.com URL: ${exampleUrlJobs}`);
    console.log(`- Hidden jobs: ${hiddenJobs}`);
    console.log(`- Valid URL jobs: ${validJobs}`);
    
    // Check the first few jobs to diagnose issues
    console.log("\nSample jobs from database:");
    const sampleJobs = await jobsCollection.find({}).limit(5).toArray();
    sampleJobs.forEach((job, index) => {
      console.log(`\nJob ${index + 1}:`);
      console.log(`- ID: ${job._id}`);
      console.log(`- Title: ${job.title}`);
      console.log(`- Company: ${job.company}`);
      console.log(`- URL: ${job.url}`);
      console.log(`- Hidden: ${job.hidden || false}`);
    });
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the script
checkDatabase().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 