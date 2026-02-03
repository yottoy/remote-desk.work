require('dotenv').config({ path: './frontend/.env.local' });
const { MongoClient } = require('mongodb');

async function checkDates() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db(process.env.MONGODB_DB);
  const jobs = await db.collection('jobs')
    .find({})
    .limit(5)
    .toArray();
  
  console.log('\n📅 Sample Job Dates:\n');
  
  jobs.forEach((job, i) => {
    console.log(`${i+1}. ${job.title.substring(0, 40)}`);
    console.log(`   postedAt: ${job.postedAt} (type: ${typeof job.postedAt})`);
    console.log(`   createdAt: ${job.createdAt} (type: ${typeof job.createdAt})`);
    console.log(`   _id timestamp: ${new Date(parseInt(job._id.toString().substring(0, 8), 16) * 1000)}`);
    console.log('');
  });
  
  await client.close();
}

checkDates().catch(console.error);
