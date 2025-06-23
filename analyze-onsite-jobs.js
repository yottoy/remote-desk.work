const { MongoClient } = require('mongodb');
require('dotenv').config();
const enhancedValidator = require('./src/utils/enhancedRemoteJobValidator');

async function analyzeOnsiteJobs() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('🔍 Analyzing Onsite Job Detection...\n');
  console.log('='.repeat(80));
  
  const totalJobs = await collection.countDocuments();
  console.log(`Total jobs in database: ${totalJobs}`);
  
  // Get a sample of jobs to analyze
  const sampleSize = 200;
  const jobs = await collection.find({}).limit(sampleSize).toArray();
  
  console.log(`\nAnalyzing ${jobs.length} sample jobs...\n`);
  
  const onsiteJobs = [];
  const remoteJobs = [];
  const unclearJobs = [];
  
  const patterns = {
    'ONSITE ONLY': 0,
    'Location Required': 0,
    'Must Live In': 0,
    'Office Based': 0,
    'In-Person Only': 0,
    'No Remote Work': 0,
    'Typically Onsite Role': 0,
    'Company Type': 0
  };
  
  for (const job of jobs) {
    const validation = enhancedValidator.validateRemoteJob(job);
    
    if (validation.recommendation === 'REJECT_HIGH_CONFIDENCE_ONSITE' || 
        validation.recommendation === 'REJECT_MEDIUM_CONFIDENCE_ONSITE') {
      onsiteJobs.push({
        title: job.title,
        company: job.company,
        location: job.location,
        description: (job.description || '').substring(0, 200),
        reasons: validation.reasons,
        confidence: validation.confidence,
        recommendation: validation.recommendation
      });
      
      // Count pattern types
      validation.reasons.forEach(reason => {
        if (reason.includes('onsite only') || reason.includes('on-site only')) {
          patterns['ONSITE ONLY']++;
        }
        if (reason.includes('must live in') || reason.includes('candidates that live in')) {
          patterns['Must Live In']++;
        }
        if (reason.includes('Location requirement pattern')) {
          patterns['Location Required']++;
        }
        if (reason.includes('office based') || reason.includes('office attendance')) {
          patterns['Office Based']++;
        }
        if (reason.includes('in-person only')) {
          patterns['In-Person Only']++;
        }
        if (reason.includes('remote work is not available') || reason.includes('no remote work')) {
          patterns['No Remote Work']++;
        }
        if (reason.includes('Typically on-site job title')) {
          patterns['Typically Onsite Role']++;
        }
        if (reason.includes('Typically on-site company type')) {
          patterns['Company Type']++;
        }
      });
      
    } else if (validation.isRemote) {
      remoteJobs.push({
        title: job.title,
        company: job.company,
        location: job.location,
        recommendation: validation.recommendation
      });
    } else {
      unclearJobs.push({
        title: job.title,
        company: job.company,
        location: job.location,
        recommendation: validation.recommendation
      });
    }
  }
  
  console.log('📊 ANALYSIS RESULTS');
  console.log('='.repeat(80));
  console.log(`Sample size: ${jobs.length}`);
  console.log(`Onsite jobs detected: ${onsiteJobs.length} (${Math.round(onsiteJobs.length/jobs.length*100)}%)`);
  console.log(`Remote jobs detected: ${remoteJobs.length} (${Math.round(remoteJobs.length/jobs.length*100)}%)`);
  console.log(`Unclear jobs: ${unclearJobs.length} (${Math.round(unclearJobs.length/jobs.length*100)}%)`);
  
  console.log('\n🔍 PATTERN ANALYSIS');
  console.log('='.repeat(80));
  Object.entries(patterns).forEach(([pattern, count]) => {
    if (count > 0) {
      console.log(`${pattern}: ${count} jobs`);
    }
  });
  
  console.log('\n🗑️  SAMPLE ONSITE JOBS TO BE REMOVED:');
  console.log('='.repeat(80));
  onsiteJobs.slice(0, 10).forEach((job, index) => {
    console.log(`\n${index + 1}. ${job.title} at ${job.company}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   Recommendation: ${job.recommendation}`);
    console.log(`   Confidence: ${Math.round(job.confidence * 100)}%`);
    console.log(`   Main reasons: ${job.reasons.slice(0, 2).join(', ')}`);
    if (job.description) {
      console.log(`   Description: ${job.description}...`);
    }
  });
  
  console.log('\n✅ SAMPLE REMOTE JOBS TO KEEP:');
  console.log('='.repeat(80));
  remoteJobs.slice(0, 5).forEach((job, index) => {
    console.log(`${index + 1}. ${job.title} at ${job.company} (${job.location})`);
  });
  
  // Look for specific Memphis-like patterns
  console.log('\n🎯 SPECIFIC PATTERN MATCHES:');
  console.log('='.repeat(80));
  
  const memphisLikeJobs = jobs.filter(job => {
    const text = `${job.title || ''} ${job.description || ''} ${job.location || ''}`.toLowerCase();
    return text.includes('candidates that live in') || 
           text.includes('must live in') && text.includes('required') ||
           text.includes('onsite only') ||
           text.includes('on-site only');
  });
  
  console.log(`Found ${memphisLikeJobs.length} jobs with Memphis-like patterns:`);
  memphisLikeJobs.forEach((job, index) => {
    const validation = enhancedValidator.validateRemoteJob(job);
    console.log(`\n${index + 1}. ${job.title} at ${job.company}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   Will be removed: ${validation.recommendation.includes('REJECT') ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Reasons: ${validation.reasons.slice(0, 2).join(', ')}`);
  });
  
  await client.close();
  console.log('\n✨ Analysis complete!');
}

analyzeOnsiteJobs().catch(console.error); 