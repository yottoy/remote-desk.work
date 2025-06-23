const { MongoClient } = require('mongodb');
const remoteJobValidator = require('./src/utils/remoteJobValidator');
require('dotenv').config();

async function investigateDentistJob() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('🔍 Investigating Dentist Job Issue...\n');
  
  // Look for jobs with "dentist" in title
  const dentistJobs = await collection.find({ 
    title: { $regex: /dentist/i }
  }).toArray();
  
  console.log(`Found ${dentistJobs.length} dentist job(s):`);
  
  dentistJobs.forEach((job, i) => {
    console.log(`\n${i+1}. ${job.title} at ${job.company}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   Remote: ${job.remote}`);
    console.log(`   Job Type: ${job.jobType}`);
    console.log(`   Remote Confidence: ${job.remoteConfidence || 'Not validated'}`);
    console.log(`   Created: ${job.createdAt}`);
    console.log(`   Source: ${job.source}`);
    
    // Test this job with our validator
    console.log('\n   🧪 Testing with our validator:');
    const validation = remoteJobValidator.validateRemoteJob(job);
    console.log(`   - Should be remote: ${validation.isRemote}`);
    console.log(`   - Confidence: ${validation.confidence.toFixed(2)}`);
    console.log(`   - Recommendation: ${validation.recommendation}`);
    console.log(`   - Key reasons: ${validation.reasons.slice(0, 3).join(', ')}`);
  });
  
  // Check for other problematic jobs
  console.log('\n🚨 Checking for other problematic patterns...');
  
  // Jobs with "Work Location: In person" in description
  const inPersonJobs = await collection.find({
    description: { $regex: /work location.*in person/i },
    remote: true
  }).limit(5).toArray();
  
  console.log(`\nFound ${inPersonJobs.length} jobs marked remote but mention "Work Location: In person":`);
  inPersonJobs.forEach((job, i) => {
    console.log(`${i+1}. ${job.title} at ${job.company} (${job.location})`);
  });
  
  // Jobs with specific locations but marked remote
  const locationSpecificJobs = await collection.find({
    location: { $regex: /,\s*(OH|CA|NY|TX|FL)\s*,?\s*(US)?$/i },
    remote: true,
    remoteConfidence: { $exists: false }
  }).limit(10).toArray();
  
  console.log(`\nFound ${locationSpecificJobs.length} jobs with specific locations but no validation:`);
  locationSpecificJobs.forEach((job, i) => {
    console.log(`${i+1}. ${job.title} at ${job.company} (${job.location})`);
  });
  
  await client.close();
}

investigateDentistJob().catch(console.error); 