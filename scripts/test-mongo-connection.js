const { MongoClient } = require('mongodb');

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB');

    const db = client.db(process.env.MONGODB_DB);
    const jobsCollection = db.collection('jobs');

    // Get the most recent jobs
    const recentJobs = await jobsCollection
      .find({})
      .sort({ postedDate: -1 })
      .limit(5)
      .toArray();

    console.log('\nMost recent jobs:');
    recentJobs.forEach(job => {
      console.log(`\nTitle: ${job.title}`);
      console.log(`Company: ${job.company}`);
      console.log(`Posted Date: ${job.postedDate}`);
      console.log(`Source: ${job.source}`);
    });

    // Get job count by source
    const jobCounts = await jobsCollection.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    console.log('\nJob counts by source:');
    jobCounts.forEach(count => {
      console.log(`${count._id}: ${count.count} jobs`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testConnection(); 