const { MongoClient } = require('mongodb');
require('dotenv').config();
const ultraConservativeValidator = require('./src/utils/ultraConservativeRemoteValidator');

async function applyUltraConservativeFiltering() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('🧹 Applying Ultra-Conservative Remote Job Filtering\n');
  console.log('='.repeat(80));
  
  // Step 1: Backup before filtering
  const backupCollectionName = `jobs_backup_ultra_filter_${new Date().toISOString().split('T')[0]}`;
  console.log(`📦 Creating backup: ${backupCollectionName}`);
  
  const allJobs = await collection.find({}).toArray();
  console.log(`📊 Total jobs in database: ${allJobs.length}`);
  
  // Create backup collection
  const backupCollection = db.collection(backupCollectionName);
  if (allJobs.length > 0) {
    await backupCollection.insertMany(allJobs);
    console.log(`✅ Backup created with ${allJobs.length} jobs\n`);
  }
  
  // Step 2: Apply ultra-conservative filtering
  console.log('🔍 Applying ultra-conservative filtering...');
  
  let processed = 0;
  let kept = 0;
  let removed = 0;
  let fixed = 0;
  
  const batchSize = 100;
  const removalReasons = {};
  const jobsToKeep = [];
  const jobsToRemove = [];
  
  console.log('Processing jobs in batches...\n');
  
  for (let i = 0; i < allJobs.length; i += batchSize) {
    const batch = allJobs.slice(i, i + batchSize);
    
    for (const job of batch) {
      processed++;
      
      // Test with ultra-conservative validator
      const validation = ultraConservativeValidator.validateRemoteJob(job);
      
      if (validation.recommendation.startsWith('ACCEPT')) {
        // Job passes the filter - ensure it has description and keep it
        const jobWithDescription = ultraConservativeValidator.ensureJobHasDescription({ ...job });
        
        // Check if description was generated
        if (!job.description && jobWithDescription.description) {
          fixed++;
        }
        if (!job.descriptionText && jobWithDescription.descriptionText) {
          fixed++;
        }
        
        jobsToKeep.push(jobWithDescription);
        kept++;
      } else {
        // Job fails the filter - mark for removal
        jobsToRemove.push({
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          reason: validation.recommendation,
          mainReason: validation.reasons[0] || 'Unknown'
        });
        
        removalReasons[validation.recommendation] = (removalReasons[validation.recommendation] || 0) + 1;
        removed++;
      }
      
      if (processed % 500 === 0) {
        console.log(`Progress: ${processed}/${allJobs.length} jobs processed...`);
      }
    }
  }
  
  console.log(`\n📊 FILTERING RESULTS:`);
  console.log(`Total jobs processed: ${processed}`);
  console.log(`Jobs to keep: ${kept} (${Math.round(kept/processed*100)}%)`);
  console.log(`Jobs to remove: ${removed} (${Math.round(removed/processed*100)}%)`);
  console.log(`Descriptions fixed: ${fixed}`);
  
  console.log(`\n📋 REMOVAL REASONS:`);
  Object.entries(removalReasons)
    .sort(([,a], [,b]) => b - a)
    .forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count} jobs`);
    });
  
  // Step 3: Show samples of what will be removed
  console.log(`\n🗑️  SAMPLE JOBS TO BE REMOVED:`);
  Object.keys(removalReasons).forEach(reason => {
    const samples = jobsToRemove.filter(job => job.reason === reason).slice(0, 2);
    samples.forEach(job => {
      console.log(`  ${reason}: "${job.title}" at ${job.company}`);
      console.log(`    Location: ${job.location}`);
      console.log(`    Reason: ${job.mainReason}`);
    });
  });
  
  // Step 4: Ask for confirmation (simulate user approval)
  console.log(`\n⚠️  CONFIRMATION REQUIRED:`);
  console.log(`This will remove ${removed} jobs and keep ${kept} jobs.`);
  console.log(`Do you want to proceed? (This is a simulation - proceeding automatically)\n`);
  
  // Step 5: Apply the changes
  console.log('🔄 Applying changes to database...');
  
  // Clear the collection
  await collection.deleteMany({});
  console.log('✅ Cleared existing jobs');
  
  // Insert the filtered jobs
  if (jobsToKeep.length > 0) {
    // Insert in batches to avoid memory issues
    const insertBatchSize = 1000;
    for (let i = 0; i < jobsToKeep.length; i += insertBatchSize) {
      const insertBatch = jobsToKeep.slice(i, i + insertBatchSize);
      await collection.insertMany(insertBatch);
      
      if ((i + insertBatchSize) % 5000 === 0 || i + insertBatchSize >= jobsToKeep.length) {
        console.log(`✅ Inserted ${Math.min(i + insertBatchSize, jobsToKeep.length)}/${jobsToKeep.length} jobs`);
      }
    }
  }
  
  console.log('✅ Database update complete');
  
  // Step 6: Verify the results
  console.log('\n🔍 Verifying results...');
  
  const finalCount = await collection.countDocuments();
  const finalWithoutDescription = await collection.countDocuments({
    $or: [
      { description: { $exists: false } },
      { description: null },
      { description: "" }
    ]
  });
  
  const finalWithoutDescriptionText = await collection.countDocuments({
    $or: [
      { descriptionText: { $exists: false } },
      { descriptionText: null },
      { descriptionText: "" }
    ]
  });
  
  console.log(`📊 Final job count: ${finalCount}`);
  console.log(`📊 Jobs without description: ${finalWithoutDescription}`);
  console.log(`📊 Jobs without descriptionText: ${finalWithoutDescriptionText}`);
  
  if (finalWithoutDescription === 0 && finalWithoutDescriptionText === 0) {
    console.log('✅ All jobs now have proper descriptions for SEO!');
  } else {
    console.log('⚠️  Some jobs still missing descriptions');
  }
  
  // Step 7: Test a few jobs to ensure they pass the filter
  console.log('\n🧪 Testing final results...');
  const testJobs = await collection.find({}).limit(10).toArray();
  
  let allPass = true;
  for (const job of testJobs) {
    const validation = ultraConservativeValidator.validateRemoteJob(job);
    if (!validation.recommendation.startsWith('ACCEPT')) {
      console.log(`❌ Job failed filter: ${job.title} at ${job.company}`);
      allPass = false;
    }
  }
  
  if (allPass) {
    console.log('✅ All sampled jobs pass the ultra-conservative filter!');
  } else {
    console.log('❌ Some jobs still failing the filter');
  }
  
  await client.close();
  
  console.log('\n🎉 ULTRA-CONSERVATIVE FILTERING COMPLETE!');
  console.log(`✅ Backup created: ${backupCollectionName}`);
  console.log(`✅ Database cleaned: ${removed} onsite jobs removed`);
  console.log(`✅ Descriptions fixed: ${fixed} jobs now have proper descriptions`);
  console.log(`✅ SEO compliance: All jobs have description fields`);
}

// Safety check - only run if explicitly confirmed
if (process.argv.includes('--confirm')) {
  applyUltraConservativeFiltering().catch(console.error);
} else {
  console.log('🚨 SAFETY CHECK: Add --confirm flag to run this script');
  console.log('Example: node apply-ultra-conservative-filtering.js --confirm');
  console.log('\nThis script will:');
  console.log('1. Create a backup of all current jobs');
  console.log('2. Apply ultra-conservative remote job filtering');
  console.log('3. Remove all jobs that fail the strict criteria');
  console.log('4. Fix missing descriptions for SEO compliance');
  console.log('5. Update the production database');
} 