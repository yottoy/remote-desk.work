require('dotenv').config({ path: './frontend/.env.local' });
const { MongoClient } = require('mongodb');

async function testQuery() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db(process.env.MONGODB_DB);
  const jobsCollection = db.collection('jobs');

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  console.log('\n🔍 Testing Fresh Jobs Query:\n');
  console.log(`Looking for jobs created after: ${oneWeekAgo.toISOString()}\n`);

  const recentJobs = await jobsCollection.find({
    createdAt: { $gte: oneWeekAgo },
    title: { $exists: true, $ne: '' },
    company: { $exists: true, $ne: '' },
    url: { $exists: true, $ne: '' },
    description: { $exists: true, $ne: '' }
  })
  .sort({ createdAt: -1 })
  .limit(10)
  .toArray();

  console.log(`✅ Found ${recentJobs.length} fresh jobs (last 7 days)\n`);

  recentJobs.forEach((job, i) => {
    const age = Math.floor((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
    console.log(`${i+1}. ${job.title.substring(0, 50)}`);
    console.log(`   Company: ${job.company}`);
    console.log(`   Age: ${age} days old ✅`);
    console.log('');
  });

  await client.close();
}

testQuery().catch(console.error);
