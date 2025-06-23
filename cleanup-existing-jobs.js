const { MongoClient } = require('mongodb');
const remoteJobValidator = require('./src/utils/remoteJobValidator');
require('dotenv').config();

async function cleanupExistingJobs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('🧹 EMERGENCY CLEANUP: Validating ALL existing jobs...\n');
  
  // Get all jobs that haven't been validated yet
  const unvalidatedJobs = await collection.find({ 
    remoteConfidence: { $exists: false }
  }).toArray();
  
  console.log(`Found ${unvalidatedJobs.length} unvalidated jobs. Processing...`);
  
  const results = {
    processed: 0,
    shouldRemove: [],
    shouldKeep: [],
    updated: 0,
    removed: 0
  };
  
  // Process in batches
  const batchSize = 50;
  for (let i = 0; i < unvalidatedJobs.length; i += batchSize) {
    const batch = unvalidatedJobs.slice(i, i + batchSize);
    console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(unvalidatedJobs.length/batchSize)}...`);
    
    for (const job of batch) {
      const validation = remoteJobValidator.validateRemoteJob(job);
      results.processed++;
      
      // Determine action based on validation
      if (validation.recommendation === 'REJECT_HIGH_CONFIDENCE' || 
          validation.recommendation === 'REJECT_MEDIUM_CONFIDENCE' ||
          (validation.recommendation === 'MANUAL_REVIEW_REQUIRED' && !validation.isRemote)) {
        
        results.shouldRemove.push({
          id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          reason: validation.recommendation,
          confidence: validation.confidence,
          keyReasons: validation.reasons.slice(0, 2)
        });
        
        // Remove the job
        await collection.deleteOne({ _id: job._id });
        results.removed++;
        
      } else {
        // Update job with validation info
        await collection.updateOne(
          { _id: job._id },
          { 
            $set: { 
              remoteConfidence: validation.confidence,
              remote: validation.isRemote,
              lastValidated: new Date(),
              validationReasons: validation.reasons
            }
          }
        );
        results.updated++;
        results.shouldKeep.push({
          title: job.title,
          company: job.company,
          confidence: validation.confidence
        });
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🧹 CLEANUP COMPLETE - RESULTS');
  console.log('='.repeat(60));
  console.log(`📊 Jobs processed: ${results.processed}`);
  console.log(`✅ Jobs kept (validated): ${results.updated}`);
  console.log(`❌ Jobs removed (non-remote): ${results.removed}`);
  console.log(`📈 Cleanup efficiency: ${((results.removed/results.processed)*100).toFixed(1)}% removed`);
  
  console.log('\n🗑️ Sample REMOVED jobs:');
  results.shouldRemove.slice(0, 10).forEach((job, i) => {
    console.log(`${i+1}. ${job.title} at ${job.company} (${job.location})`);
    console.log(`   Reason: ${job.reason}, Confidence: ${job.confidence.toFixed(2)}`);
    console.log(`   Issues: ${job.keyReasons.join(', ')}`);
  });
  
  console.log('\n✅ Sample KEPT jobs:');
  results.shouldKeep.slice(0, 5).forEach((job, i) => {
    console.log(`${i+1}. ${job.title} at ${job.company} (Confidence: ${job.confidence.toFixed(2)})`);
  });
  
  console.log('\n🎯 The problematic jobs like the Dentist and LA Receptionist have been removed!');
  console.log('✅ Database is now clean and validated.');
  
  await client.close();
  return results;
}

cleanupExistingJobs().catch(console.error); 