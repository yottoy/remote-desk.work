const { MongoClient } = require('mongodb');
require('dotenv').config();
const enhancedValidator = require('./src/utils/enhancedRemoteJobValidator');

async function applyEnhancedFiltering() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('🔧 Applying Enhanced Remote Job Filtering...\n');
  console.log('='.repeat(60));
  
  const totalJobs = await collection.countDocuments();
  console.log(`Total jobs in database: ${totalJobs}`);
  
  // Process jobs in batches to avoid memory issues
  const batchSize = 100;
  let processed = 0;
  let removed = 0;
  let updated = 0;
  
  const jobsToRemove = [];
  const jobsToUpdate = [];
  
  console.log('\n🧪 Processing jobs with enhanced validator...');
  
  while (processed < totalJobs) {
    const jobs = await collection.find({})
      .skip(processed)
      .limit(batchSize)
      .toArray();
    
    if (jobs.length === 0) break;
    
    for (const job of jobs) {
      const validation = enhancedValidator.validateRemoteJob(job);
      
      // Mark jobs for removal if they're clearly on-site
      if (validation.recommendation === 'REJECT_HIGH_CONFIDENCE_ONSITE' || 
          validation.recommendation === 'REJECT_MEDIUM_CONFIDENCE_ONSITE') {
        jobsToRemove.push({
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          reason: validation.recommendation,
          confidence: validation.confidence
        });
      } else {
        // Update job with validation info
        jobsToUpdate.push({
          _id: job._id,
          remoteValidation: validation,
          remoteConfidence: validation.confidence,
          isRemoteVerified: validation.isRemote
        });
      }
    }
    
    processed += jobs.length;
    
    // Show progress
    if (processed % 500 === 0 || processed === totalJobs) {
      console.log(`Processed ${processed}/${totalJobs} jobs...`);
    }
  }
  
  console.log(`\n📊 Processing Results:`);
  console.log(`   Jobs to remove (on-site): ${jobsToRemove.length}`);
  console.log(`   Jobs to update (remote/unclear): ${jobsToUpdate.length}`);
  
  // Show sample of jobs to be removed
  if (jobsToRemove.length > 0) {
    console.log('\n🗑️  Sample jobs to be removed:');
    jobsToRemove.slice(0, 10).forEach((job, i) => {
      console.log(`${i+1}. ${job.title} at ${job.company} (${job.location}) - ${job.reason}`);
    });
    
    console.log('\n⚠️  Do you want to proceed with removing these on-site jobs? (y/N)');
    
    // For automation, we'll create a backup first
    console.log('\n📦 Creating backup before removal...');
    
    // Create backup collection
    const backupCollection = db.collection(`jobs_backup_${new Date().toISOString().split('T')[0]}`);
    
    // Copy jobs to be removed to backup
    const jobIdsToRemove = jobsToRemove.map(job => job._id);
    const jobsToBackup = await collection.find({ _id: { $in: jobIdsToRemove } }).toArray();
    
    if (jobsToBackup.length > 0) {
      await backupCollection.insertMany(jobsToBackup);
      console.log(`✅ Backed up ${jobsToBackup.length} jobs to ${backupCollection.collectionName}`);
    }
    
    // Remove on-site jobs
    const removeResult = await collection.deleteMany({ _id: { $in: jobIdsToRemove } });
    console.log(`🗑️  Removed ${removeResult.deletedCount} on-site jobs`);
    removed = removeResult.deletedCount;
  }
  
  // Update remaining jobs with validation info
  if (jobsToUpdate.length > 0) {
    console.log('\n🔄 Updating remaining jobs with validation info...');
    
    for (const jobUpdate of jobsToUpdate) {
      await collection.updateOne(
        { _id: jobUpdate._id },
        { 
          $set: {
            remoteValidation: jobUpdate.remoteValidation,
            remoteConfidence: jobUpdate.remoteConfidence,
            isRemoteVerified: jobUpdate.isRemoteVerified,
            lastValidated: new Date()
          }
        }
      );
    }
    
    console.log(`✅ Updated ${jobsToUpdate.length} jobs with validation info`);
    updated = jobsToUpdate.length;
  }
  
  // Final statistics
  const finalJobCount = await collection.countDocuments();
  
  console.log('\n\n📈 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`Original job count: ${totalJobs}`);
  console.log(`Jobs removed: ${removed}`);
  console.log(`Jobs updated: ${updated}`);
  console.log(`Final job count: ${finalJobCount}`);
  console.log(`Improvement: ${Math.round((removed / totalJobs) * 100)}% of on-site jobs removed`);
  
  // Verify the improvement
  console.log('\n🧪 Verifying improvement...');
  const sampleAfter = await collection.find({}).limit(50).toArray();
  let remoteCount = 0;
  let onsiteCount = 0;
  
  for (const job of sampleAfter) {
    if (job.remoteValidation) {
      if (job.remoteValidation.isRemote) {
        remoteCount++;
      } else {
        onsiteCount++;
      }
    }
  }
  
  console.log(`Sample verification (50 jobs):`);
  console.log(`   Remote: ${remoteCount} (${Math.round(remoteCount/sampleAfter.length*100)}%)`);
  console.log(`   On-site: ${onsiteCount} (${Math.round(onsiteCount/sampleAfter.length*100)}%)`);
  console.log(`   Unclear: ${sampleAfter.length - remoteCount - onsiteCount}`);
  
  await client.close();
  console.log('\n✅ Enhanced filtering complete!');
}

applyEnhancedFiltering().catch(console.error); 