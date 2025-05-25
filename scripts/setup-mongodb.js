const { MongoClient } = require('mongodb');

async function setupMongoDB() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB');

    const db = client.db(process.env.MONGODB_DB);
    const jobsCollection = db.collection('jobs');

    // Drop existing TTL index
    try {
      await jobsCollection.dropIndex('job_ttl_expiration');
      console.log('Dropped existing TTL index');
    } catch (error) {
      console.log('No existing TTL index to drop');
    }

    // Create indexes
    await jobsCollection.createIndex({ postedDate: -1 });
    await jobsCollection.createIndex({ source: 1 });
    await jobsCollection.createIndex({ company: 1 });
    await jobsCollection.createIndex({ title: 1 });
    
    // Create TTL index to expire jobs after 30 days
    await jobsCollection.createIndex(
      { postedDate: 1 },
      { 
        name: 'job_ttl_expiration',
        expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
        background: true
      }
    );

    console.log('Successfully created MongoDB indexes');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

setupMongoDB(); 