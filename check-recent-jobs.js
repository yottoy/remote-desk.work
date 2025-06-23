const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkRecentJobs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  // Get the most recent jobs with remote validation info
  const recentJobs = await collection.find({ 
    remoteConfidence: { $exists: true } 
  }).sort({ createdAt: -1 }).limit(5).toArray();
  
  console.log('Recent jobs with validation:');
  recentJobs.forEach((job, i) => {
    console.log(`${i+1}. ${job.title} at ${job.company}`);
    console.log(`   Remote: ${job.remote}, Confidence: ${job.remoteConfidence?.toFixed(2) || 'N/A'}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   URL: ${job.url}`);
    console.log('');
  });
  
  // Check overall validation stats
  const totalWithValidation = await collection.countDocuments({ remoteConfidence: { $exists: true } });
  const highConfidenceRemote = await collection.countDocuments({ 
    remoteConfidence: { $gte: 0.7 }, 
    remote: true 
  });
  
  console.log('Validation Statistics:');
  console.log(`Total jobs with validation: ${totalWithValidation}`);
  console.log(`High confidence remote jobs: ${highConfidenceRemote}`);
  
  await client.close();
}

checkRecentJobs().catch(console.error); 