require('dotenv').config({ path: './frontend/.env.local' });
const { MongoClient } = require('mongodb');

async function checkJobFreshness() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db(process.env.MONGODB_DB);
  const jobs = await db.collection('jobs')
    .find({})
    .sort({ postedAt: -1 })
    .limit(20)
    .toArray();
  
  console.log('\n📊 Job Freshness Check:\n');
  
  const now = new Date();
  jobs.forEach((job, i) => {
    const postedAt = new Date(job.postedAt);
    const daysOld = Math.floor((now - postedAt) / (1000 * 60 * 60 * 24));
    console.log(`${i+1}. ${job.title.substring(0, 50)} - ${daysOld} days old`);
  });
  
  await client.close();
}

checkJobFreshness().catch(console.error);
