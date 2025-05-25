// MongoDB Diagnostic Script for ClickClickJob.com
// Run with: node mongo-diagnostic.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function runDiagnostics() {
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
    
    // Check all databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    console.log('\n=== DATABASE OVERVIEW ===');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name} (${Math.round(db.sizeOnDisk / 1024 / 1024)}MB)`);
    });
    
    // Check collections and job counts in each database
    console.log('\n=== JOB COLLECTIONS ACROSS DATABASES ===');
    
    // Check clickclickjob database
    const clickclickjobDb = client.db('clickclickjob');
    const clickclickjobCollections = await clickclickjobDb.listCollections().toArray();
    console.log('\nclickclickjob database:');
    for (const coll of clickclickjobCollections) {
      if (coll.name === 'jobs') {
        const count = await clickclickjobDb.collection(coll.name).countDocuments();
        console.log(`- ${coll.name}: ${count} documents`);
        
        // Sample document
        const sample = await clickclickjobDb.collection(coll.name).findOne({});
        console.log(`- Sample document fields: ${Object.keys(sample).join(', ')}`);
      }
    }
    
    // Check test database
    const testDb = client.db('test');
    const testCollections = await testDb.listCollections().toArray();
    console.log('\ntest database:');
    for (const coll of testCollections) {
      if (coll.name === 'jobs') {
        const count = await testDb.collection(coll.name).countDocuments();
        console.log(`- ${coll.name}: ${count} documents`);
        
        // Sample document
        const sample = await testDb.collection(coll.name).findOne({});
        console.log(`- Sample document fields: ${Object.keys(sample).join(', ')}`);
      }
    }
    
    // Check remote-jobs database
    const remoteJobsDb = client.db('remote-jobs');
    const remoteJobsCollections = await remoteJobsDb.listCollections().toArray();
    console.log('\nremote-jobs database:');
    for (const coll of remoteJobsCollections) {
      if (coll.name === 'jobs') {
        const count = await remoteJobsDb.collection(coll.name).countDocuments();
        console.log(`- ${coll.name}: ${count} documents`);
        
        // Sample document
        const sample = await remoteJobsDb.collection(coll.name).findOne({});
        console.log(`- Sample document fields: ${Object.keys(sample).join(', ')}`);
      }
    }
    
    // Check indexes in each jobs collection
    console.log('\n=== INDEX ANALYSIS ===');
    console.log('\nclickclickjob.jobs indexes:');
    const clickclickjobIndexes = await clickclickjobDb.collection('jobs').indexes();
    console.log(clickclickjobIndexes);
    
    console.log('\ntest.jobs indexes:');
    const testIndexes = await testDb.collection('jobs').indexes();
    console.log(testIndexes);
    
    console.log('\nremote-jobs.jobs indexes:');
    const remoteJobsIndexes = await remoteJobsDb.collection('jobs').indexes();
    console.log(remoteJobsIndexes);
    
    // Check TTL indexes
    console.log('\n=== TTL INDEX CHECK ===');
    console.log('TTL indexes in clickclickjob.jobs:');
    const clickclickjobTTL = clickclickjobIndexes.filter(idx => idx.expireAfterSeconds !== undefined);
    console.log(clickclickjobTTL.length ? clickclickjobTTL : 'No TTL indexes found');
    
    console.log('\nTTL indexes in test.jobs:');
    const testTTL = testIndexes.filter(idx => idx.expireAfterSeconds !== undefined);
    console.log(testTTL.length ? testTTL : 'No TTL indexes found');
    
    console.log('\nTTL indexes in remote-jobs.jobs:');
    const remoteJobsTTL = remoteJobsIndexes.filter(idx => idx.expireAfterSeconds !== undefined);
    console.log(remoteJobsTTL.length ? remoteJobsTTL : 'No TTL indexes found');
    
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
runDiagnostics().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 