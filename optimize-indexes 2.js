// MongoDB Index Optimization Script for ClickClickJob.com
// Run with: node optimize-indexes.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function optimizeIndexes() {
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

    // Connect to collections
    const db = client.db('clickclickjob');
    const jobsCollection = db.collection('jobs');
    
    // Get existing indexes for reference
    console.log('Current indexes:');
    const currentIndexes = await jobsCollection.indexes();
    console.log(JSON.stringify(currentIndexes, null, 2));
    
    console.log('\nDropping existing indexes (except _id)...');
    // Drop all indexes except the _id index which cannot be dropped
    for (const index of currentIndexes) {
      if (index.name !== '_id_') {
        console.log(`Dropping index: ${index.name}`);
        try {
          await jobsCollection.dropIndex(index.name);
        } catch (error) {
          console.log(`Warning: Failed to drop index ${index.name}: ${error.message}`);
        }
      }
    }
    
    console.log('\nCreating optimized indexes...');
    
    // 1. Create compound index for common search patterns (job type, remote, recency)
    console.log('Creating index for job type + remote + recency search...');
    await jobsCollection.createIndex(
      { jobType: 1, remote: 1, postedDate: -1 },
      { background: true, name: 'job_search_optimization' }
    );
    
    // 2. Create index for remote filtering and sorting by recency
    console.log('Creating index for remote + recency search...');
    await jobsCollection.createIndex(
      { remote: 1, postedDate: -1 },
      { background: true, name: 'remote_recency_optimization' }
    );
    
    // 3. Create index for salary-based searching
    console.log('Creating index for salary filtering...');
    await jobsCollection.createIndex(
      { remote: 1, salary: 1 },
      { background: true, name: 'salary_search_optimization' }
    );
    
    // 4. Create index for skills-based searching
    console.log('Creating index for skills search...');
    await jobsCollection.createIndex(
      { skills: 1, remote: 1 },
      { background: true, name: 'skills_search_optimization' }
    );
    
    // 5. Create index for experience level filtering
    console.log('Creating index for experience level search...');
    await jobsCollection.createIndex(
      { experienceLevel: 1, remote: 1, postedDate: -1 },
      { background: true, name: 'experience_search_optimization' }
    );
    
    // 6. Create index for employment type filtering
    console.log('Creating index for employment type search...');
    await jobsCollection.createIndex(
      { employmentType: 1, remote: 1, postedDate: -1 },
      { background: true, name: 'employment_type_optimization' }
    );
    
    // 7. Create text index for title and description for keyword search
    console.log('Creating text search index...');
    await jobsCollection.createIndex(
      { title: 'text', description: 'text' },
      { 
        background: true, 
        name: 'text_search_optimization',
        weights: {
          title: 3,
          description: 1
        }
      }
    );
    
    // 8. Create TTL index for automatic document expiration (90 days)
    console.log('Creating TTL index for job expiration...');
    await jobsCollection.createIndex(
      { postedDate: 1 },
      { 
        expireAfterSeconds: 7776000, // 90 days in seconds
        background: true,
        name: 'job_ttl_expiration'
      }
    );
    
    // 9. Create unique compound index to prevent duplicates
    console.log('Creating unique index to prevent duplicate jobs...');
    await jobsCollection.createIndex(
      { title: 1, company: 1, url: 1 },
      { 
        unique: true, 
        background: true,
        name: 'unique_job_constraint',
        sparse: true // Allow null/missing values
      }
    );
    
    // Get updated indexes
    console.log('\nUpdated indexes:');
    const updatedIndexes = await jobsCollection.indexes();
    console.log(JSON.stringify(updatedIndexes, null, 2));
    
    console.log('\nIndex optimization complete!');
    
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
optimizeIndexes().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 