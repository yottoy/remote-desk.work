const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const ultraConservativeValidator = require('./src/utils/ultraConservativeRemoteValidator');

async function testUltraConservativeFilter() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('🧪 Testing Ultra-Conservative Remote Job Filter\n');
  console.log('='.repeat(80));
  
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
        console.log(`🆔 ID: ${jobId}`);
        
        // Test with ultra-conservative validator
        const validation = ultraConservativeValidator.validateRemoteJob(job);
        
        console.log(`\n🔍 ULTRA-CONSERVATIVE VALIDATION:`);
        console.log(`   ✅ Should be remote: ${validation.isRemote}`);
        console.log(`   🎯 Confidence: ${Math.round(validation.confidence * 100)}%`);
        console.log(`   📊 Score: ${validation.score}`);
        console.log(`   🏷️  Recommendation: ${validation.recommendation}`);
        console.log(`   📝 Top reasons:`);
        validation.reasons.slice(0, 3).forEach((reason, i) => {
          console.log(`      ${i+1}. ${reason}`);
        });
        
        // Show description preview if available
        if (job.description && job.description.length > 100) {
          console.log(`\n📄 Description excerpt: ${job.description.substring(0, 200)}...`);
        } else if (job.descriptionText && job.descriptionText.length > 100) {
          console.log(`\n📄 Description excerpt: ${job.descriptionText.substring(0, 200)}...`);
        }
        
        // Verdict
        if (validation.recommendation.startsWith('ACCEPT')) {
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
    
    console.log('\n' + '-'.repeat(80));
  }
  
  // Test on a broader sample - look specifically for jobs with "remote" indicators
  console.log('\n🔬 TESTING ON JOBS WITH REMOTE INDICATORS:');
  console.log('='.repeat(80));
  
  const remoteJobs = await collection.find({
    $or: [
      { title: /remote/i },
      { description: /remote/i },
      { location: /remote/i }
    ]
  }).limit(25).toArray();
  
  console.log(`Found ${remoteJobs.length} jobs with remote indicators\n`);
  
  let totalJobs = 0;
  let acceptedJobs = 0;
  let rejectedJobs = 0;
  let rejectionReasons = {};
  
  const acceptedList = [];
  const rejectedList = [];
  
  for (const job of remoteJobs) {
    totalJobs++;
    const validation = ultraConservativeValidator.validateRemoteJob(job);
    
    console.log(`\n🔍 Testing: "${job.title}" at ${job.company}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   Result: ${validation.recommendation} (Score: ${validation.score})`);
    console.log(`   Main reason: ${validation.reasons[0] || 'Unknown'}`);
    
    if (validation.recommendation.startsWith('ACCEPT')) {
      acceptedJobs++;
      acceptedList.push({
        title: job.title,
        company: job.company,
        location: job.location,
        confidence: validation.confidence,
        score: validation.score
      });
    } else {
      rejectedJobs++;
      rejectedList.push({
        title: job.title,
        company: job.company,
        location: job.location,
        reason: validation.recommendation,
        mainReason: validation.reasons[0]
      });
      
      rejectionReasons[validation.recommendation] = (rejectionReasons[validation.recommendation] || 0) + 1;
    }
  }
  
  console.log(`\n📊 REMOTE JOBS SAMPLE RESULTS:`);
  console.log(`Total jobs tested: ${totalJobs}`);
  console.log(`Jobs accepted: ${acceptedJobs} (${Math.round(acceptedJobs/totalJobs*100)}%)`);
  console.log(`Jobs rejected: ${rejectedJobs} (${Math.round(rejectedJobs/totalJobs*100)}%)`);
  
  console.log(`\n📋 REJECTION BREAKDOWN:`);
  Object.entries(rejectionReasons)
    .sort(([,a], [,b]) => b - a)
    .forEach(([reason, count]) => {
      console.log(`  ${reason}: ${count} jobs`);
    });
  
  console.log(`\n✅ ACCEPTED REMOTE JOBS:`);
  acceptedList.slice(0, 5).forEach((job, i) => {
    console.log(`  ${i+1}. "${job.title}" at ${job.company} (Score: ${job.score}, Confidence: ${Math.round(job.confidence*100)}%)`);
    console.log(`      Location: ${job.location}`);
  });
  
  console.log(`\n❌ REJECTED REMOTE JOBS:`);
  rejectedList.slice(0, 5).forEach((job, i) => {
    console.log(`  ${i+1}. "${job.title}" at ${job.company} - ${job.reason}`);
    console.log(`      Location: ${job.location}`);
    console.log(`      Reason: ${job.mainReason}`);
  });
  
  await client.close();
  
  console.log('\n🎉 Testing complete!');
}

testUltraConservativeFilter().catch(console.error); 