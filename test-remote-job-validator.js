const remoteJobValidator = require('./src/utils/remoteJobValidator');

// Test jobs including the problematic one from the website
const testJobs = [
  {
    title: "Receptionist/Legal Assistant",
    company: "Gomez Law, APC",
    location: "Norwalk, CA, US",
    description: `**Job Title:** Receptionist II
**Location:** Los Angeles, CA
**Job Type:** Full-Time
**Classification:** Non-Exempt
**Company:** Gomez Law, APC
**Reports To:** Office Manager

**Position Summary:**
Gomez Law, APC is seeking a highly organized and professional **Receptionist II** to join our team in Los Angeles. As the first point of contact for clients and visitors, this role is essential in establishing a welcoming and efficient front office experience.

**Working Conditions:**
**Schedule:** Monday – Friday, 8:30 AM – 5:00 PM.
**Location:** 3250 Wilshire Blvd, Los Angeles, CA 90010.
**Environment:** Professional legal office setting.`
  },
  {
    title: "Remote Data Entry Specialist",
    company: "TechCorp Solutions",
    location: "Remote",
    description: `We are looking for a detail-oriented Data Entry Specialist to work from home. This is a fully remote position with flexible hours. No office visits required.`
  },
  {
    title: "Virtual Administrative Assistant",
    company: "Digital Services Inc",
    location: "Work from Home",
    description: `Join our team as a Virtual Administrative Assistant. This is a 100% remote position. You can work from anywhere in the United States.`
  },
  {
    title: "Customer Service Representative",
    company: "Local Bank",
    location: "New York, NY",
    description: `We are seeking a Customer Service Representative for our Manhattan branch. Must be able to commute to our office at 123 Main Street, New York, NY 10001. In-person training required.`
  },
  {
    title: "Data Entry Clerk - Remote Opportunity",
    company: "Remote First Company",
    location: "Remote",
    description: `Fully remote data entry position. Work from home with flexible schedule. No office location required. Telecommute opportunity.`
  },
  {
    title: "Administrative Assistant",
    company: "Hybrid Corp",
    location: "Chicago, IL",
    description: `Administrative Assistant position with hybrid work options. Must be located within 30 miles of Chicago office for occasional in-person meetings.`
  }
];

console.log('Testing Remote Job Validator\n');
console.log('='.repeat(50));

testJobs.forEach((job, index) => {
  console.log(`\nTest Job ${index + 1}: ${job.title}`);
  console.log(`Company: ${job.company}`);
  console.log(`Location: ${job.location}`);
  
  const validation = remoteJobValidator.validateRemoteJob(job);
  
  console.log(`\nValidation Results:`);
  console.log(`- Is Remote: ${validation.isRemote}`);
  console.log(`- Confidence: ${validation.confidence.toFixed(2)}`);
  console.log(`- Remote Score: ${validation.remoteScore}`);
  console.log(`- Onsite Score: ${validation.onsiteScore}`);
  console.log(`- Total Score: ${validation.totalScore}`);
  console.log(`- Recommendation: ${validation.recommendation}`);
  
  if (validation.reasons.length > 0) {
    console.log(`- Reasons:`);
    validation.reasons.forEach(reason => {
      console.log(`  * ${reason}`);
    });
  }
  
  console.log('-'.repeat(40));
});

// Test the filtering function
console.log('\n\nTesting Filter Function:');
console.log('='.repeat(50));

const filteredJobs = remoteJobValidator.filterRemoteJobs(testJobs, 0.6, false);

console.log(`\nOriginal jobs: ${testJobs.length}`);
console.log(`Filtered jobs: ${filteredJobs.length}`);

console.log('\nAccepted Jobs:');
filteredJobs.forEach((job, index) => {
  console.log(`${index + 1}. ${job.title} at ${job.company} (Confidence: ${job.remoteValidation.confidence.toFixed(2)})`);
});

const rejectedJobs = testJobs.filter(job => 
  !filteredJobs.some(filtered => filtered.title === job.title)
);

console.log('\nRejected Jobs:');
rejectedJobs.forEach((job, index) => {
  const validation = remoteJobValidator.validateRemoteJob(job);
  console.log(`${index + 1}. ${job.title} at ${job.company} (${validation.recommendation})`);
}); 