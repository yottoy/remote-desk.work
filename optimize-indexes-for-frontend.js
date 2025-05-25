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
    console.log('Connected to MongoDB successfully');

    // Get the target collection
    const db = client.db('clickclickjob');
    const jobsCollection = db.collection('jobs');
    
    // List existing indexes
    console.log('\n=== EXISTING INDEXES ===');
    const existingIndexes = await jobsCollection.indexes();
    const existingIndexNames = existingIndexes.map(index => index.name);
    existingIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Create optimized indexes for frontend queries
    console.log('\n=== CREATING OPTIMIZED INDEXES ===');
    
    // Compound index for isRemote and postedDate (most common query)
    if (!existingIndexNames.includes('isRemote_postedDate')) {
      console.log('Creating index for isRemote and postedDate...');
      await jobsCollection.createIndex(
        { isRemote: 1, postedDate: -1 },
        { name: 'isRemote_postedDate', background: true }
      );
    } else {
      console.log('Index for isRemote and postedDate already exists.');
    }
    
    // Skip text index since it already exists
    console.log('Skipping text index creation as it already exists as text_search_optimization.');
    
    // Index for filtering by job category
    if (!existingIndexNames.includes('jobCategory_isRemote_postedDate')) {
      console.log('Creating index for job category filtering...');
      await jobsCollection.createIndex(
        { jobCategory: 1, isRemote: 1, postedDate: -1 },
        { name: 'jobCategory_isRemote_postedDate', background: true }
      );
    } else {
      console.log('Index for job category filtering already exists.');
    }

    // Index for filtering by job type
    if (!existingIndexNames.includes('jobType_isRemote_postedDate')) {
      console.log('Creating index for job type filtering...');
      await jobsCollection.createIndex(
        { jobType: 1, isRemote: 1, postedDate: -1 },
        { name: 'jobType_isRemote_postedDate', background: true }
      );
    } else {
      console.log('Index for job type filtering already exists.');
    }

    // Index for filtering by experience level
    if (!existingIndexNames.includes('experienceLevel_isRemote_postedDate')) {
      console.log('Creating index for experience level filtering...');
      await jobsCollection.createIndex(
        { experienceLevel: 1, isRemote: 1, postedDate: -1 },
        { name: 'experienceLevel_isRemote_postedDate', background: true }
      );
    } else {
      console.log('Index for experience level filtering already exists.');
    }

    // TTL index to automatically remove old jobs (90 days)
    const ttlIndexExists = existingIndexes.some(index => 
      index.expireAfterSeconds !== undefined && index.key.postedDate === 1);
    
    if (!ttlIndexExists) {
      console.log('Creating TTL index for expiring old jobs...');
      await jobsCollection.createIndex(
        { postedDate: 1 },
        { 
          name: 'postedDate_ttl',
          expireAfterSeconds: 7776000, // 90 days
          background: true
        }
      );
    } else {
      console.log('TTL index for postedDate already exists.');
    }

    // List final indexes
    console.log('\n=== FINAL INDEXES ===');
    const finalIndexes = await jobsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\nIndex optimization completed successfully!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the script
optimizeIndexes().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 