#!/usr/bin/env node

/**
 * PURGE TECHCORP JOBS
 * 
 * This script specifically targets and removes all TechCorp Solutions jobs
 * from the database, which are showing up as mock data in our listings.
 * 
 * Run this script with Node.js to clean the database:
 * node delete-techcorp-jobs.js
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

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

async function deleteAllTechCorpJobs() {
  console.log('TECHCORP JOBS PURGE');
  console.log('===================');
  console.log('Starting targeted removal of all TechCorp Solutions jobs');
  
  try {
    const { client, db } = await connectToDatabase();
    console.log('Connected to database successfully');
    
    const jobsCollection = db.collection('jobs');
    
    // Define patterns to identify TechCorp jobs
    const techCorpPatterns = [
      // Direct match on company name
      { company: "TechCorp Solutions" },
      // Partial match on company name
      { company: { $regex: /TechCorp/ } },
      // Match on any job with TechCorp in the title
      { title: { $regex: /TechCorp/ } },
      // Job with ID containing "job" and TechCorp in company
      { 
        _id: { $regex: /job/ },
        company: { $regex: /TechCorp/ }
      },
      // Specifically look for "Remote Data Entry Specialist" from TechCorp
      {
        title: "Remote Data Entry Specialist",
        company: "TechCorp Solutions"
      }
    ];
    
    // First, find all TechCorp jobs for logging
    const techCorpJobs = await jobsCollection.find({ $or: techCorpPatterns }).toArray();
    
    console.log(`Found ${techCorpJobs.length} TechCorp jobs to remove:`);
    
    if (techCorpJobs.length > 0) {
      // Log details about the jobs to be removed
      techCorpJobs.forEach((job) => {
        console.log(`- ${job._id}: ${job.title} at ${job.company}`);
      });
      
      // Confirm deletion
      console.log('\nDeleting all TechCorp jobs...');
      
      // Delete all jobs matching any TechCorp pattern
      const result = await jobsCollection.deleteMany({ $or: techCorpPatterns });
      
      console.log(`Successfully removed ${result.deletedCount} TechCorp job entries`);
    } else {
      console.log('No TechCorp jobs found in the database!');
    }
    
    // Close the database connection
    await client.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error purging TechCorp jobs:', error);
    process.exit(1);
  }
}

// Run the purge function
deleteAllTechCorpJobs()
  .then(() => {
    console.log('TechCorp jobs purge completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Purge script failed:', error);
    process.exit(1);
  }); 