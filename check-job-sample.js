require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkJobSample() {
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
    
    // Check sample from clickclickjob database
    const clickclickjobDb = client.db('clickclickjob');
    console.log('\n=== SAMPLE JOB FROM CLICKCLICKJOB DATABASE ===');
    const clickclickjobSample = await clickclickjobDb.collection('jobs').findOne({});
    console.log(JSON.stringify(clickclickjobSample, null, 2));
    
    // Check sample from test database
    const testDb = client.db('test');
    console.log('\n=== SAMPLE JOB FROM TEST DATABASE ===');
    const testSample = await testDb.collection('jobs').findOne({});
    console.log(JSON.stringify(testSample, null, 2));
    
    // Check sample from remote-jobs database
    const remoteJobsDb = client.db('remote-jobs');
    console.log('\n=== SAMPLE JOB FROM REMOTE-JOBS DATABASE ===');
    const remoteJobsSample = await remoteJobsDb.collection('jobs').findOne({});
    console.log(JSON.stringify(remoteJobsSample, null, 2));
    
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
checkJobSample().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 