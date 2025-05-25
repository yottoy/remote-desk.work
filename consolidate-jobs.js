require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function consolidateJobs() {
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

    // Get database references
    const clickclickjobDb = client.db('clickclickjob');
    const testDb = client.db('test');
    const remoteJobsDb = client.db('remote-jobs');
    
    // Get collection references
    const targetCollection = clickclickjobDb.collection('jobs');
    const testCollection = testDb.collection('jobs');
    const remoteJobsCollection = remoteJobsDb.collection('jobs');

    // Get counts before consolidation
    const clickclickjobCount = await targetCollection.countDocuments();
    const testCount = await testCollection.countDocuments();
    const remoteJobsCount = await remoteJobsCollection.countDocuments();
    
    console.log('\n=== BEFORE CONSOLIDATION ===');
    console.log(`clickclickjob.jobs: ${clickclickjobCount} documents`);
    console.log(`test.jobs: ${testCount} documents`);
    console.log(`remote-jobs.jobs: ${remoteJobsCount} documents`);
    console.log(`Total: ${clickclickjobCount + testCount + remoteJobsCount} documents`);

    // Remove mock jobs from clickclickjob.jobs
    const mockJobsResult = await targetCollection.deleteMany({
      url: { $regex: 'example.com', $options: 'i' }
    });
    console.log(`\nRemoved ${mockJobsResult.deletedCount} mock jobs from clickclickjob.jobs`);

    // Process test.jobs collection
    console.log('\n=== PROCESSING test.jobs ===');
    const testJobs = await testCollection.find({
      url: { $not: { $regex: 'example.com', $options: 'i' } }
    }).toArray();
    console.log(`Found ${testJobs.length} non-mock jobs in test.jobs`);

    // Process remote-jobs.jobs collection
    console.log('\n=== PROCESSING remote-jobs.jobs ===');
    const remoteJobs = await remoteJobsCollection.find({
      url: { $not: { $regex: 'example.com', $options: 'i' } }
    }).toArray();
    console.log(`Found ${remoteJobs.length} non-mock jobs in remote-jobs.jobs`);

    // Insert jobs into clickclickjob.jobs - manually check for duplicates
    console.log(`\nProcessing ${testJobs.length + remoteJobs.length} jobs from other databases...`);

    // Handle test.jobs first
    let insertedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const job of testJobs) {
      try {
        // Check if this job already exists in the target collection
        const existingJob = await targetCollection.findOne({
          $or: [
            // Match by URL if it exists (most reliable)
            ...(job.url ? [{ url: job.url }] : []),
            // Match by title + company combination
            ...(job.title && job.company ? [{ 
              title: job.title, 
              company: job.company 
            }] : [])
          ]
        });

        // If job already exists, skip it
        if (existingJob) {
          duplicateCount++;
          continue;
        }

        // Prepare job document (exclude _id to get a new one)
        const { _id, ...jobData } = job;
        
        // Add necessary fields
        const normalizedJob = {
          ...jobData,
          remote: true,
          isRemote: true,
          jobType: job.jobType || 'other',
          experienceLevel: job.experienceLevel || 'not_specified',
          // Fix future dates
          postedDate: job.postedDate && new Date(job.postedDate) > new Date() ? 
                      new Date() : job.postedDate
        };

        // Insert the job
        await targetCollection.insertOne(normalizedJob);
        insertedCount++;
      } catch (err) {
        console.error(`Error processing job ${job._id || 'unknown'}: ${err.message}`);
        errorCount++;
      }
    }

    // Handle remote-jobs.jobs next
    for (const job of remoteJobs) {
      try {
        // Check if this job already exists in the target collection
        const existingJob = await targetCollection.findOne({
          $or: [
            // Match by URL if it exists (most reliable)
            ...(job.url ? [{ url: job.url }] : []),
            // Match by title + company combination
            ...(job.title && job.company ? [{ 
              title: job.title, 
              company: job.company 
            }] : [])
          ]
        });

        // If job already exists, skip it
        if (existingJob) {
          duplicateCount++;
          continue;
        }

        // Prepare job document (exclude _id to get a new one)
        const { _id, ...jobData } = job;
        
        // Add necessary fields
        const normalizedJob = {
          ...jobData,
          remote: true,
          isRemote: true,
          jobType: job.jobType || 'other',
          experienceLevel: job.experienceLevel || 'not_specified',
          // Fix future dates
          postedDate: job.postedDate && new Date(job.postedDate) > new Date() ? 
                      new Date() : job.postedDate
        };

        // Insert the job
        await targetCollection.insertOne(normalizedJob);
        insertedCount++;
      } catch (err) {
        console.error(`Error processing job ${job._id || 'unknown'}: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\nInserted ${insertedCount} new jobs, skipped ${duplicateCount} duplicates, encountered ${errorCount} errors`);

    // Get counts after consolidation
    const finalCount = await targetCollection.countDocuments();
    const finalMockCount = await targetCollection.countDocuments({
      url: { $regex: 'example.com', $options: 'i' }
    });
    
    console.log('\n=== AFTER CONSOLIDATION ===');
    console.log(`clickclickjob.jobs: ${finalCount} documents`);
    console.log(`Mock jobs remaining: ${finalMockCount}`);
    console.log(`Net change: ${finalCount - clickclickjobCount} documents`);

    // Verify schema fields are consistent
    console.log('\n=== VERIFYING SCHEMA CONSISTENCY ===');
    // Fix missing remote/isRemote fields
    const remoteFieldResult = await targetCollection.updateMany(
      { remote: { $exists: false } },
      { $set: { remote: true } }
    );
    console.log(`Added missing remote field to ${remoteFieldResult.modifiedCount} documents`);

    const isRemoteFieldResult = await targetCollection.updateMany(
      { isRemote: { $exists: false } },
      { $set: { isRemote: true } }
    );
    console.log(`Added missing isRemote field to ${isRemoteFieldResult.modifiedCount} documents`);

    // Fix future dates
    const futureDateResult = await targetCollection.updateMany(
      { postedDate: { $gt: new Date() } },
      { $set: { postedDate: new Date() } }
    );
    console.log(`Fixed future dates in ${futureDateResult.modifiedCount} documents`);

    console.log('\nJob consolidation completed successfully!');
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
consolidateJobs().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 