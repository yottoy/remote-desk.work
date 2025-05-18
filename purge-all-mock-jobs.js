/**
 * PURGE ALL MOCK JOBS
 * 
 * This script aggressively removes any mock or test job entries from the database.
 * It searches for multiple patterns that might indicate mock data.
 * 
 * Run this script with Node.js to clean the database:
 * node purge-all-mock-jobs.js
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

async function purgeAllMockJobs() {
  console.log('MOCK JOB PURGE');
  console.log('==============');
  console.log('Starting aggressive mock job purge from the database');
  
  try {
    const { client, db } = await connectToDatabase();
    console.log('Connected to database successfully');
    
    const jobsCollection = db.collection('jobs');
    
    // Define comprehensive patterns for identifying mock jobs
    const mockPatterns = [
      // Pattern 1: Jobs with IDs like "job1", "job2", etc.
      { _id: { $regex: /^job\d+$/ } },
      
      // Pattern 2: Jobs from known mock companies
      { company: "TechCorp Solutions" },
      { company: { $regex: /Example|Test|Mock|Global Services LLC|DataFlow Inc|TranscribeNow|Executive Support Co/ } },
      
      // Pattern 3: Jobs explicitly marked as mock
      { isMock: true },
      { is_mock_data: true },
      
      // Pattern 4: Jobs with [MOCK] prefix in title or company
      { title: { $regex: /^\[MOCK\]/ } },
      { company: { $regex: /^\[MOCK\]/ } },
      
      // Pattern 5: Jobs with example.com URLs
      { url: { $regex: /example\.com|placeholder|test|mock/ } },
      
      // Pattern 6: Jobs with suspicious descriptions
      { description: { $regex: /this is a test|example job|mock job/i } }
    ];
    
    // First, find all jobs matching any of these patterns for logging
    const mockJobs = await jobsCollection.find({ $or: mockPatterns }).toArray();
    
    console.log(`Found ${mockJobs.length} potential mock jobs to remove:`);
    
    if (mockJobs.length > 0) {
      // Log some info about the jobs to be removed
      mockJobs.forEach((job, index) => {
        if (index < 10) { // Only show first 10 for brevity
          console.log(`- ${job._id}: ${job.title} at ${job.company}`);
        }
      });
      
      if (mockJobs.length > 10) {
        console.log(`... and ${mockJobs.length - 10} more`);
      }
      
      // Confirm before deleting
      console.log('\nDeleting all mock jobs...');
      
      // Delete all jobs matching any mock pattern
      const result = await jobsCollection.deleteMany({ $or: mockPatterns });
      
      console.log(`Successfully removed ${result.deletedCount} mock job entries`);
    } else {
      console.log('No mock jobs found - database is clean!');
    }
    
    // Close the database connection
    await client.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error purging mock jobs:', error);
    process.exit(1);
  }
}

// Run the purge function
purgeAllMockJobs()
  .then(() => {
    console.log('Mock job purge completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Purge script failed:', error);
    process.exit(1);
  }); 