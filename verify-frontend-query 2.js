require('dotenv').config();
const { MongoClient } = require('mongodb');

async function verifyFrontendQuery() {
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

    // Count total jobs
    const totalJobs = await jobsCollection.countDocuments();
    console.log(`\nTotal jobs in database: ${totalJobs}`);

    // Simulate frontend query with isRemote: true
    const frontendQuery = { isRemote: true };
    const frontendQueryCount = await jobsCollection.countDocuments(frontendQuery);
    console.log(`Jobs matching isRemote=true: ${frontendQueryCount}`);

    // Verify all jobs have isRemote field
    const missingIsRemoteCount = await jobsCollection.countDocuments({ isRemote: { $exists: false } });
    console.log(`Jobs missing isRemote field: ${missingIsRemoteCount}`);

    // Check how many have both isRemote and remote fields
    const bothFieldsCount = await jobsCollection.countDocuments({ 
      isRemote: true,
      remote: true
    });
    console.log(`Jobs with both isRemote=true and remote=true: ${bothFieldsCount}`);

    // Check job types distribution
    const jobTypes = await jobsCollection.aggregate([
      { $group: { _id: "$jobType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log("\nJob Types Distribution:");
    jobTypes.forEach(type => {
      console.log(`- ${type._id || 'undefined'}: ${type.count}`);
    });

    // Check experience levels distribution
    const experienceLevels = await jobsCollection.aggregate([
      { $group: { _id: "$experienceLevel", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log("\nExperience Levels Distribution:");
    experienceLevels.forEach(level => {
      console.log(`- ${level._id || 'undefined'}: ${level.count}`);
    });

    // Test a mock frontend filter operation
    const filteredQuery = { 
      isRemote: true,
      jobType: { $in: ['full-time', 'part-time'] }
    };
    const filteredQueryCount = await jobsCollection.countDocuments(filteredQuery);
    console.log(`\nJobs matching isRemote=true AND jobType in ['full-time', 'part-time']: ${filteredQueryCount}`);

    // Check if there are any mock jobs remaining
    const mockJobsCount = await jobsCollection.countDocuments({
      url: { $regex: 'example.com', $options: 'i' }
    });
    console.log(`\nMock jobs (with example.com URLs) remaining: ${mockJobsCount}`);

    // Get a sample of jobs to verify schema
    console.log("\n=== SAMPLE JOB FIELDS ===");
    const sampleJob = await jobsCollection.findOne({});
    if (sampleJob) {
      console.log(Object.keys(sampleJob).join(', '));
    }

    console.log('\nVerification completed successfully!');
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
verifyFrontendQuery().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 