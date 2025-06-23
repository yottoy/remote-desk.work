const enhancedValidator = require('./src/utils/enhancedRemoteJobValidator');

// Test cases for onsite job detection
const testJobs = [
  {
    id: 1,
    title: "Software Engineer",
    company: "TechCorp",
    location: "Memphis, TN",
    description: "This role is ONSITE ONLY *Candidates that live in Memphis,TN are required."
  },
  {
    id: 2, 
    title: "Product Manager",
    company: "StartupInc",
    location: "Austin, TX",
    description: "Must live in Austin, TX area. Office attendance required daily."
  },
  {
    id: 3,
    title: "Remote Developer", 
    company: "RemoteCorp",
    location: "Remote",
    description: "100% remote position. Work from anywhere in the US."
  },
  {
    id: 4,
    title: "Data Analyst",
    company: "Local Business", 
    location: "Phoenix, AZ",
    description: "HYBRID-REMOTE ROLE: MUST LIVE IN AZ. HYBRID OPTION OPEN AFTER 90 DAY PROBATION/TRAINING PERIOD."
  },
  {
    id: 5,
    title: "Marketing Specialist",
    company: "Agency",
    location: "New York, NY", 
    description: "On-site only position. No remote work available. Must be based in NYC."
  },
  {
    id: 6,
    title: "Remote Customer Support",
    company: "SupportCo",
    location: "Work from Home",
    description: "Fully remote customer support role. Telecommute from anywhere."
  },
  {
    id: 7,
    title: "Dental Assistant", 
    company: "Smile Clinic",
    location: "Memphis, TN",
    description: "In-person role at our clinic. Candidates who live in Memphis, TN are required."
  },
  {
    id: 8,
    title: "Software Developer",
    company: "TechStart",
    location: "San Francisco, CA",
    description: "Remote work is not available. Must work onsite in our SF office."
  }
];

console.log('🧪 Testing Enhanced Onsite Job Detection\n');
console.log('='.repeat(80));

testJobs.forEach(job => {
  console.log(`\n📋 Job ${job.id}: ${job.title} at ${job.company}`);
  console.log(`📍 Location: ${job.location}`);
  console.log(`📝 Description: ${job.description.substring(0, 100)}...`);
  
  const validation = enhancedValidator.validateRemoteJob(job);
  
  console.log(`\n🔍 Validation Results:`);
  console.log(`   Remote: ${validation.isRemote ? '✅' : '❌'}`);
  console.log(`   Confidence: ${(validation.confidence * 100).toFixed(1)}%`);
  console.log(`   Recommendation: ${validation.recommendation}`);
  console.log(`   Remote Score: ${validation.remoteScore}`);
  console.log(`   Onsite Score: ${validation.onsiteScore}`);
  console.log(`   Total Score: ${validation.totalScore}`);
  
  if (validation.reasons.length > 0) {
    console.log(`   Reasons: ${validation.reasons.slice(0, 3).join(', ')}`);
  }
  
  // Expected results
  const expectedOnsite = [1, 2, 4, 5, 7, 8]; // Jobs that should be rejected as onsite
  const shouldBeOnsite = expectedOnsite.includes(job.id);
  const isCorrect = shouldBeOnsite ? 
    (validation.recommendation.includes('REJECT') || !validation.isRemote) :
    (validation.isRemote);
    
  console.log(`   Expected: ${shouldBeOnsite ? 'ONSITE' : 'REMOTE'}`);
  console.log(`   Result: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
  
  console.log('-'.repeat(80));
});

console.log('\n📊 Summary:');
const onsiteJobs = testJobs.filter(job => {
  const validation = enhancedValidator.validateRemoteJob(job);
  return validation.recommendation.includes('REJECT') || !validation.isRemote;
});

const remoteJobs = testJobs.filter(job => {
  const validation = enhancedValidator.validateRemoteJob(job);
  return validation.isRemote && !validation.recommendation.includes('REJECT');
});

console.log(`   Jobs identified as onsite: ${onsiteJobs.length}`);
console.log(`   Jobs identified as remote: ${remoteJobs.length}`);

console.log('\n🗑️  Jobs that would be filtered out (onsite):');
onsiteJobs.forEach(job => {
  console.log(`   - ${job.title} at ${job.company} (${job.location})`);
});

console.log('\n✅ Jobs that would remain (remote):');
remoteJobs.forEach(job => {
  console.log(`   - ${job.title} at ${job.company} (${job.location})`);
});

console.log('\n✨ Test complete!'); 