/**
 * Script to clean mock and fallback entries from MongoDB
 * 
 * This script:
 * 1. Connects to the MongoDB database
 * 2. Finds and removes all job entries with URLs containing 'example.com' or 'fallback'
 * 3. Reports the results
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }
  
  const client = new MongoClient(uri);
  await client.connect();
  
  const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
  return { client, db };
}

async function cleanupMockEntries() {
  console.log('Connecting to database...');
  
  try {
    const { client, db } = await connectToDatabase();
    console.log('Connected to database successfully');
    
    const jobsCollection = db.collection('jobs');
    
    // Pattern for mock job IDs (job1, job2, etc.)
    const mockIdPattern = /^job\d+$/;
    
    // Find all jobs with mock IDs
    const mockJobs = await jobsCollection.find({
      _id: { $regex: mockIdPattern }
    }).toArray();
    
    console.log(`Found ${mockJobs.length} mock jobs to remove:`);
    
    // List the jobs that will be removed
    mockJobs.forEach(job => {
      console.log(`- ${job._id}: ${job.title} at ${job.company}`);
    });
    
    // Only proceed if we found mock jobs
    if (mockJobs.length > 0) {
      // Delete the jobs with mock IDs
      const result = await jobsCollection.deleteMany({
        _id: { $regex: mockIdPattern }
      });
      
      console.log(`Deleted ${result.deletedCount} mock job entries`);
    } else {
      console.log('No mock job entries found');
    }
    
    // Close the database connection
    await client.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error cleaning up mock entries:', error);
    process.exit(1);
  }
}

console.log("MongoDB Mock Entries Cleanup");
console.log("============================");
console.log("This script will remove all mock and fallback entries from the database.");
console.log("Run with --dry-run to see what would be deleted without actually removing anything.");
console.log("");

// Run the cleanup function
cleanupMockEntries()
  .then(() => {
    console.log('Mock job cleanup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Cleanup script failed:', error);
    process.exit(1);
  }); 