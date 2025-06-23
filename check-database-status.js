const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDatabaseStatus() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  
  console.log('📊 Database Status Check\n');
  console.log('='.repeat(60));
  
  // List all collections
  const collections = await db.listCollections().toArray();
  console.log('Collections in database:');
  
  for (const collection of collections) {
    const count = await db.collection(collection.name).countDocuments();
    console.log(`  ${collection.name}: ${count} documents`);
    
    // Check for backup collections
    if (collection.name.includes('backup')) {
      console.log(`    ↳ This appears to be a backup collection`);
      
      // Show sample from backup
      const sample = await db.collection(collection.name).findOne();
      if (sample) {
        console.log(`    ↳ Sample job: ${sample.title || 'Unknown'} at ${sample.company || 'Unknown'}`);
      }
    }
  }
  
  // Check current jobs collection
  console.log('\n📋 Current Jobs Analysis:');
  const jobsCount = await db.collection('jobs').countDocuments();
  console.log(`Total jobs: ${jobsCount}`);
  
  // Get sample of current jobs
  const sampleJobs = await db.collection('jobs').find({}).limit(5).toArray();
  console.log('\nSample current jobs:');
  sampleJobs.forEach((job, i) => {
    console.log(`${i+1}. ${job.title || 'Unknown'} at ${job.company || 'Unknown'} (${job.location || 'Unknown'})`);
  });
  
  // Check if jobs have validation info
  const jobsWithValidation = await db.collection('jobs').countDocuments({ remoteValidation: { $exists: true } });
  console.log(`\nJobs with validation info: ${jobsWithValidation}`);
  
  await client.close();
  console.log('\n✅ Status check complete!');
}

checkDatabaseStatus().catch(console.error); 