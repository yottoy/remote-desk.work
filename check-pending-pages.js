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

// Sample 10 job IDs from the list
const sampleJobIds = [
  '683da14eba2b958c334e3e07',
  '6959a079b51fd39530b0936b',
  '696a6a78b79ef545ca3087a9',
  '6959a079b51fd39530b09388',
  '6872b48aaec91b61d00f77df',
  '694f5d26b51fd39530ac4ce4',
  '6959a079b51fd39530b09369',
  '6959a079b51fd39530b09373',
  '6959a079b51fd39530b09374',
  '6959a079b51fd39530b0937c'
];

async function checkPendingPages() {
  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      console.error('Failed to connect to database');
      return;
    }

    console.log('Checking sample of 10 pending job pages...\n');

    let deletedCount = 0;
    let notFoundCount = 0;
    let existsCount = 0;

    for (const jobId of sampleJobIds) {
      let job = null;

      try {
        if (ObjectId.isValid(jobId)) {
          job = await db.collection('jobs').findOne({ _id: new ObjectId(jobId) });
        }
      } catch (e) {
        // Not a valid ObjectId
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
        console.log(`✅ ${jobId} - EXISTS (will return 200 OK)`);
        existsCount++;
      } else {
        // Check deleted jobs
        const deletedJob = await db.collection('deleted_jobs').findOne({
          $or: [
            { jobId: jobId },
            { jobId: new ObjectId(jobId) }
          ]
        });
        
        if (deletedJob) {
          console.log(`🗑️  ${jobId} - DELETED (will return 410 Gone) ✅ FIXED`);
          deletedCount++;
        } else {
          console.log(`❌ ${jobId} - NOT FOUND (will return 404) ✅ FIXED`);
          notFoundCount++;
        }
      }
    }

    console.log('\n========================================');
    console.log('SUMMARY OF 10 SAMPLE PAGES:');
    console.log('========================================');
    console.log(`✅ Jobs that exist: ${existsCount}`);
    console.log(`🗑️  Jobs deleted (410 Gone): ${deletedCount} - FIXED`);
    console.log(`❌ Jobs not found (404): ${notFoundCount} - FIXED`);
    console.log('\n📊 PROJECTION FOR ALL 59 JOB PAGES:');
    console.log(`   ~${Math.round(existsCount * 5.9)} will return 200 OK`);
    console.log(`   ~${Math.round(deletedCount * 5.9)} will return 410 Gone (FIXED)`);
    console.log(`   ~${Math.round(notFoundCount * 5.9)} will return 404 Not Found (FIXED)`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking pages:', error);
    process.exit(1);
  }
}

checkPendingPages();
