const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: './frontend/.env.local' });

async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB || 'clickclickjob';
  
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  
  return { client, db };
}

const jobIds = [
  '695816cfb51fd39530aebc9e',
  '683da14bba2b958c334e3ab1',
  '683da14eba2b958c334e3cb4',
  '6872b48baec91b61d00f783e',
  '69756617f94d6d1af717452a',
  '69756617f94d6d1af7174528'
];

async function checkJobs() {
  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      console.error('Failed to connect to database');
      return;
    }

    console.log('Checking job validation failures...\n');

    for (const jobId of jobIds) {
      console.log(`\n========================================`);
      console.log(`Checking Job ID: ${jobId}`);
      console.log(`========================================`);

      // Try to find in jobs collection
      let job = null;

      try {
        if (ObjectId.isValid(jobId)) {
          job = await db.collection('jobs').findOne({ _id: new ObjectId(jobId) });
        }
      } catch (e) {
        console.log('Not a valid ObjectId, trying string search');
      }

      if (!job) {
        job = await db.collection('jobs').findOne({
          $or: [
            { _id: jobId },
            { uniqueIdentifier: jobId }
          ]
        });
      }

      if (job) {
        console.log('✅ Job FOUND in database');
        console.log(`   Title: ${job.title}`);
        console.log(`   Company: ${job.company}`);
        console.log(`   Posted Date: ${job.postedDate}`);
        console.log(`   Quality Score: ${job.qualityScore || 'N/A'}`);
        console.log(`   URL: ${job.url || 'N/A'}`);
        
        // Check for validation issues
        const issues = [];
        if (!job.title) issues.push('Missing title');
        if (!job.company) issues.push('Missing company');
        if (!job.description && !job.descriptionText) issues.push('Missing description');
        if (!job.location) issues.push('Missing location');
        if (!job.postedDate) issues.push('Missing postedDate');
        
        if (issues.length > 0) {
          console.log('   ⚠️  VALIDATION ISSUES:');
          issues.forEach(issue => console.log(`      - ${issue}`));
        } else {
          console.log('   ✓ No validation issues found');
        }
      } else {
        console.log('❌ Job NOT FOUND in jobs collection');
        
        // Check deleted jobs collection
        const deletedJob = await db.collection('deleted_jobs').findOne({
          $or: [
            { jobId: jobId },
            { jobId: new ObjectId(jobId) }
          ]
        });
        
        if (deletedJob) {
          console.log('📝 Job found in DELETED_JOBS collection');
          console.log(`   Original Title: ${deletedJob.originalTitle || 'N/A'}`);
          console.log(`   Original Company: ${deletedJob.originalCompany || 'N/A'}`);
          console.log(`   Deleted At: ${deletedJob.deletedAt}`);
          console.log(`   → This should return 410 Gone status`);
        } else {
          console.log('❌ Job not found in deleted_jobs either');
          console.log(`   → This should return 404 Not Found`);
        }
      }
    }

    console.log('\n========================================');
    console.log('Check complete');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking jobs:', error);
    process.exit(1);
  }
}

checkJobs();
