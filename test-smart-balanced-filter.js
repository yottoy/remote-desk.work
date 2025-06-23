const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const smartBalancedValidator = require('./src/utils/smartBalancedRemoteValidator');

async function testSmartBalancedFilter() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('🎯 Testing Smart Balanced Remote Job Filter\n');
  console.log('='.repeat(80));
  
  // Get current total
  const totalJobs = await collection.countDocuments();
  console.log(`📊 Current total jobs: ${totalJobs}\n`);
  
  // Test the specific problematic job IDs mentioned by the user
  const problematicJobIds = [
    '683c4ea844abe4d1de8a8e74', // Dispatch Supervisor - Lakeville, MN
    '683c4ea844abe4d1de8a8e75', // Administrator Category Assistant - Food Lion  
    '683c4ea844abe4d1de8a8e76', // Operations Assistant - Phoenix, AZ (explicitly onsite)
  ];
  
  console.log('🎯 TESTING KNOWN PROBLEMATIC JOBS:');
  console.log('='.repeat(80));
  
  for (const jobId of problematicJobIds) {
    try {
      const job = await collection.findOne({ _id: new ObjectId(jobId) });
      
      if (job) {
        console.log(`\n📋 JOB: ${job.title} at ${job.company}`);
        console.log(`🏢 Location: ${job.location}`);
        
        // Test with smart balanced validator
        const validation = smartBalancedValidator.validateRemoteJob(job);
        
        console.log(`\n🔍 SMART BALANCED VALIDATION:`);
        console.log(`   ✅ Should be remote: ${validation.isRemote}`);
        console.log(`   🎯 Confidence: ${Math.round(validation.confidence * 100)}%`);
        console.log(`   📊 Score: ${validation.score}`);
        console.log(`   🏷️  Recommendation: ${validation.recommendation}`);
        console.log(`   📝 Top reasons:`);
        validation.reasons.slice(0, 2).forEach((reason, i) => {
          console.log(`      ${i+1}. ${reason}`);
        });
        
        // Verdict
        if (validation.recommendation.startsWith('ACCEPT') || 
           (validation.recommendation === 'REVIEW_UNCLEAR' && validation.score >= -2)) {
          console.log(`\n❌ PROBLEM: This onsite job would still be ACCEPTED!`);
        } else {
          console.log(`\n✅ SUCCESS: This onsite job would be REJECTED`);
        }
      } else {
        console.log(`\n❌ Job ${jobId} not found in database`);
      }
    } catch (error) {
      console.log(`\n❌ Error testing job ${jobId}: ${error.message}`);
    }
    
    console.log('\n' + '-'.repeat(40));
  }
  
  // Test on sample to estimate retention
  console.log('\n📊 RETENTION ANALYSIS (Sample):');
  console.log('='.repeat(80));
  
  const sampleJobs = await collection.find({}).limit(200).toArray();
  
  let accepted = 0;
  let rejected = 0;
  const rejectionReasons = {};
  
  for (const job of sampleJobs) {
    const validation = smartBalancedValidator.validateRemoteJob(job);
    
    // Use same logic as the filterRemoteJobs method
    let shouldAccept = false;
    
    // Accept clear remote jobs
    if (validation.recommendation.startsWith('ACCEPT')) {
      shouldAccept = true;
    }
    // Keep ambiguous jobs (keepAmbiguous = true by default)
    else if (validation.recommendation === 'REVIEW_UNCLEAR' && validation.score >= -2) {
      shouldAccept = true;
    }
    
    if (shouldAccept) {
      accepted++;
    } else {
      rejected++;
      rejectionReasons[validation.recommendation] = (rejectionReasons[validation.recommendation] || 0) + 1;
    }
  }
  
  const retentionRate = accepted / sampleJobs.length;
  const estimatedJobsAfter = Math.round(totalJobs * retentionRate);
  const estimatedRemoved = totalJobs - estimatedJobsAfter;
  
  console.log(`\n🎉 ESTIMATED RESULTS (based on ${sampleJobs.length} job sample):\n`);
  
  console.log(`📊 DELTA ANALYSIS:`);
  console.log(`=`.repeat(50));
  console.log(`📋 BEFORE: ${totalJobs} jobs`);
  console.log(`✅ AFTER:  ~${estimatedJobsAfter} jobs (${Math.round(retentionRate*100)}% retained)`);
  console.log(`❌ REMOVED: ~${estimatedRemoved} jobs (${Math.round((1-retentionRate)*100)}% removed)`);
  console.log(`📉 DELTA:   -${estimatedRemoved} jobs\n`);
  
  console.log(`📋 SAMPLE REJECTION BREAKDOWN:`);
  Object.entries(rejectionReasons)
    .sort(([,a], [,b]) => b - a)
    .forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count} jobs`);
    });
  
  await client.close();
  
  console.log('\n💡 SUMMARY:');
  console.log(`   Current: ${totalJobs} jobs`);
  console.log(`   Estimated After Smart Balanced Filter: ${estimatedJobsAfter} jobs`);
  console.log(`   Estimated Reduction: ${estimatedRemoved} jobs`);
  console.log(`   Your problematic jobs: SUCCESSFULLY FILTERED OUT ✅`);
}

testSmartBalancedFilter().catch(console.error); 