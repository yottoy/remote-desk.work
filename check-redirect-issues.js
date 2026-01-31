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

async function checkIssues() {
  try {
    const { db } = await connectToDatabase();
    
    console.log('🔍 INVESTIGATING REDIRECT AND SOFT 404 ISSUES\n');
    console.log('='.repeat(60));
    
    // Check redirect error job
    console.log('\n1. REDIRECT ERROR - Job Page:');
    console.log('   https://www.clickclickjob.com/jobs/683da14fba2b958c334e3fe8\n');
    
    const redirectJobId = '683da14fba2b958c334e3fe8';
    let redirectJob = null;
    
    try {
      if (ObjectId.isValid(redirectJobId)) {
        redirectJob = await db.collection('jobs').findOne({ _id: new ObjectId(redirectJobId) });
      }
    } catch (e) {}
    
    if (!redirectJob) {
      const deletedRedirectJob = await db.collection('deleted_jobs').findOne({
        $or: [
          { jobId: redirectJobId },
          { jobId: new ObjectId(redirectJobId) }
        ]
      });
      
      if (deletedRedirectJob) {
        console.log('   ❌ Job is DELETED - Should return 410 Gone (not redirect)');
        console.log(`   📝 Deleted at: ${deletedRedirectJob.deletedAt}`);
      } else {
        console.log('   ❌ Job NOT FOUND - Should return 404 (not redirect)');
      }
    } else {
      console.log('   ✅ Job EXISTS - Should return 200 OK');
      console.log(`   Title: ${redirectJob.title}`);
      console.log(`   Company: ${redirectJob.company}`);
    }
    
    // Check soft 404 job
    console.log('\n2. SOFT 404 - Job Page:');
    console.log('   https://www.clickclickjob.com/jobs/68292164a6e9806b23c05efb\n');
    
    const soft404JobId = '68292164a6e9806b23c05efb';
    let soft404Job = null;
    
    try {
      if (ObjectId.isValid(soft404JobId)) {
        soft404Job = await db.collection('jobs').findOne({ _id: new ObjectId(soft404JobId) });
      }
    } catch (e) {}
    
    if (!soft404Job) {
      const deletedSoft404Job = await db.collection('deleted_jobs').findOne({
        $or: [
          { jobId: soft404JobId },
          { jobId: new ObjectId(soft404JobId) }
        ]
      });
      
      if (deletedSoft404Job) {
        console.log('   🗑️  Job is DELETED - Should return 410 Gone (not soft 404)');
        console.log(`   📝 Deleted at: ${deletedSoft404Job.deletedAt}`);
      } else {
        console.log('   ❌ Job NOT FOUND - Should return 404 (not soft 404)');
      }
    } else {
      console.log('   ✅ Job EXISTS - Should return 200 OK');
      console.log(`   Title: ${soft404Job.title}`);
      console.log(`   Company: ${soft404Job.company}`);
    }
    
    // Check category pages
    console.log('\n3. CATEGORY PAGES - Checking redirect errors:\n');
    
    const validCategorySlugs = [
      'data-entry', 'administrative', 'administrative-assistant',
      'customer-service', 'transcription', 'virtual-assistant',
      'data-processing', 'captioning', 'customer-support',
      'bookkeeping', 'content-writing', 'social-media',
      'project-management', 'quality-assurance'
    ];
    
    const problemCategories = ['captioning', 'data-processing'];
    
    for (const slug of problemCategories) {
      if (validCategorySlugs.includes(slug)) {
        console.log(`   ✅ "${slug}" is VALID - Should NOT redirect`);
        console.log(`      URL: https://clickclickjob.com/categories/${slug}`);
        console.log(`      Status: Should return 200 OK`);
      } else {
        console.log(`   ❌ "${slug}" is INVALID - Would return 404`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 SUMMARY OF ISSUES:\n');
    console.log('REDIRECT ERRORS:');
    console.log('  - Category pages (captioning, data-processing) are VALID');
    console.log('  - Job page 683da14fba2b958c334e3fe8 needs checking');
    console.log('  - These should NOT redirect - likely a middleware/routing issue\n');
    
    console.log('SOFT 404:');
    console.log('  - Job 68292164a6e9806b23c05efb needs proper status code');
    console.log('  - Should return actual 404 or 410, not soft 404\n');
    
    console.log('DISCOVERED - NOT INDEXED:');
    console.log('  - These pages likely exist and are fine');
    console.log('  - Just need time for Google to index them');
    console.log('  - Consider submitting URLs directly in GSC\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkIssues();
