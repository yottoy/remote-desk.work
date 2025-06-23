const { MongoClient } = require('mongodb');
require('dotenv').config();
const enhancedValidator = require('./src/utils/enhancedRemoteJobValidator');

async function checkRemovedJobs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  
  console.log('🔍 Analyzing Removed Onsite Jobs\n');
  console.log('='.repeat(80));
  
  // Get the most recent backup (removed jobs)
  const backupCollection = db.collection('jobs_backup_2025-05-31');
  const removedJobsCount = await backupCollection.countDocuments();
  console.log(`Total jobs removed: ${removedJobsCount}`);
  
  // Get sample of removed jobs
  const removedJobs = await backupCollection.find({}).limit(20).toArray();
  
  console.log('\n🗑️  SAMPLE OF REMOVED ONSITE JOBS:');
  console.log('='.repeat(80));
  
  const patterns = {
    'ONSITE ONLY': 0,
    'Location Required': 0,
    'Must Live In': 0,
    'Office Based': 0,
    'Memphis-like Pattern': 0,
    'Typically Onsite Role': 0
  };
  
  removedJobs.forEach((job, index) => {
    console.log(`\n${index + 1}. ${job.title || 'Unknown'} at ${job.company || 'Unknown'}`);
    console.log(`   Location: ${job.location || 'Unknown'}`);
    
    // Run validation to see why it was removed
    const validation = enhancedValidator.validateRemoteJob(job);
    console.log(`   Recommendation: ${validation.recommendation}`);
    console.log(`   Confidence: ${Math.round(validation.confidence * 100)}%`);
    console.log(`   Score: Remote(${validation.remoteScore}) - Onsite(${validation.onsiteScore}) = ${validation.totalScore}`);
    console.log(`   Top reasons: ${validation.reasons.slice(0, 2).join(', ')}`);
    
    // Check for specific patterns
    const text = `${job.title || ''} ${job.description || ''} ${job.location || ''}`.toLowerCase();
    
    if (text.includes('onsite only') || text.includes('on-site only')) {
      patterns['ONSITE ONLY']++;
      console.log(`   ⭐ Contains "ONSITE ONLY" pattern`);
    }
    
    if (text.includes('candidates that live in') || text.includes('candidates who live in')) {
      patterns['Memphis-like Pattern']++;
      console.log(`   ⭐ Contains Memphis-like pattern`);
    }
    
    if (text.includes('must live in')) {
      patterns['Must Live In']++;
      console.log(`   ⭐ Contains "Must Live In" pattern`);
    }
    
    if (validation.reasons.some(r => r.includes('Typically on-site job title'))) {
      patterns['Typically Onsite Role']++;
      console.log(`   ⭐ Typically onsite role type`);
    }
    
    // Show description excerpt if it contains key patterns
    if (job.description) {
      const desc = job.description.toLowerCase();
      if (desc.includes('onsite only') || desc.includes('candidates that live in') || 
          desc.includes('must live in') || desc.includes('remote work is not available')) {
        console.log(`   Description excerpt: ${job.description.substring(0, 150)}...`);
      }
    }
  });
  
  console.log('\n📊 PATTERN ANALYSIS:');
  console.log('='.repeat(80));
  Object.entries(patterns).forEach(([pattern, count]) => {
    if (count > 0) {
      console.log(`${pattern}: ${count} jobs in sample`);
    }
  });
  
  // Look for specific Memphis-like patterns in full dataset
  console.log('\n🎯 SEARCHING ALL REMOVED JOBS FOR SPECIFIC PATTERNS:');
  console.log('='.repeat(80));
  
  const allRemovedJobs = await backupCollection.find({}).toArray();
  
  const memphisPatternJobs = allRemovedJobs.filter(job => {
    const text = `${job.title || ''} ${job.description || ''} ${job.location || ''}`.toLowerCase();
    return text.includes('candidates that live in') || 
           text.includes('candidates who live in') ||
           (text.includes('must live in') && text.includes('required'));
  });
  
  const onsiteOnlyJobs = allRemovedJobs.filter(job => {
    const text = `${job.title || ''} ${job.description || ''} ${job.location || ''}`.toLowerCase();
    return text.includes('onsite only') || text.includes('on-site only');
  });
  
  const noRemoteJobs = allRemovedJobs.filter(job => {
    const text = `${job.title || ''} ${job.description || ''} ${job.location || ''}`.toLowerCase();
    return text.includes('remote work is not available') || 
           text.includes('no remote work') ||
           text.includes('work from home not available');
  });
  
  console.log(`Memphis-like patterns ("candidates that live in"): ${memphisPatternJobs.length}`);
  console.log(`"ONSITE ONLY" patterns: ${onsiteOnlyJobs.length}`);
  console.log(`"No remote work" patterns: ${noRemoteJobs.length}`);
  
  // Show examples of Memphis-like patterns
  if (memphisPatternJobs.length > 0) {
    console.log('\n🎯 Examples of Memphis-like patterns found and removed:');
    memphisPatternJobs.slice(0, 3).forEach((job, i) => {
      console.log(`\n${i + 1}. ${job.title} at ${job.company}`);
      console.log(`   Location: ${job.location}`);
      if (job.description) {
        const desc = job.description.toLowerCase();
        if (desc.includes('candidates that live in') || desc.includes('candidates who live in')) {
          const index = Math.max(desc.indexOf('candidates that live in'), desc.indexOf('candidates who live in'));
          const excerpt = job.description.substring(Math.max(0, index - 50), index + 100);
          console.log(`   Key excerpt: ...${excerpt}...`);
        }
      }
    });
  }
  
  await client.close();
  console.log('\n✅ Analysis complete!');
}

checkRemovedJobs().catch(console.error); 