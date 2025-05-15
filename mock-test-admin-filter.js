/**
 * Mock test for admin/data entry job filtering logic
 * 
 * This script tests the job filtering, categorization, and scoring logic
 * without needing to connect to the actual JobSpy bridge or MongoDB.
 */

const adminEntryConfig = require('./config/admin-entry-config');
const fs = require('fs').promises;
const path = require('path');

// Sample mock jobs that mimic JobSpy results
const mockJobs = [
  {
    title: "Remote Data Entry Specialist",
    company: "ABC Company",
    location: "Remote",
    description: "We are looking for a data entry specialist who can work remotely. Responsibilities include entering data into our system, verifying information accuracy, and maintaining databases. Requirements: Typing speed of 50+ WPM, attention to detail, and experience with Microsoft Excel.",
    url: "https://example.com/job1",
    date: new Date().toISOString(),
    salary: "$15-$20 per hour",
    source: "indeed"
  },
  {
    title: "Virtual Administrative Assistant",
    company: "XYZ Corp",
    location: "Remote, USA",
    description: "Looking for a virtual assistant to handle administrative tasks including email management, scheduling, document preparation, and customer service. Must be organized and have excellent communication skills. This is a work-from-home position.",
    url: "https://example.com/job2",
    date: new Date().toISOString(),
    salary: "$18-$25 per hour",
    source: "linkedin"
  },
  {
    title: "Remote Customer Service Representative",
    company: "Service Co.",
    location: "Work from Home",
    description: "Join our customer service team working remotely. You'll be answering customer inquiries via phone and email, resolving issues, and maintaining customer satisfaction. Experience in customer service preferred. Training provided.",
    url: "https://example.com/job3",
    date: new Date().toISOString(),
    salary: "$16-$22 per hour",
    source: "indeed"
  },
  {
    title: "Senior Software Engineer - Remote",
    company: "Tech Solutions Inc.",
    location: "Remote",
    description: "We're seeking an experienced software engineer to join our development team. You'll be building features, fixing bugs, and collaborating with product managers. 5+ years of experience required. Remote position available.",
    url: "https://example.com/job4",
    date: new Date().toISOString(),
    salary: "$120,000 - $150,000 per year",
    source: "linkedin"
  },
  {
    title: "Remote Data Analyst",
    company: "DataCorp",
    location: "Remote",
    description: "Seeking a data analyst to work with our team remotely. You'll analyze large datasets, create visualizations, and provide insights to stakeholders. Experience with SQL and Excel required.",
    url: "https://example.com/job5",
    date: new Date().toISOString(),
    salary: "$60,000 - $80,000 per year",
    source: "indeed"
  },
  {
    title: "Work from home typist - Make $$$$ Fast!",
    company: "TypingPros",
    location: "Anywhere",
    description: "Make money fast typing from home! All you need is a computer and internet. No experience needed. $500 certification required to get started. Be your own boss!",
    url: "https://example.com/job6",
    date: new Date().toISOString(),
    source: "indeed"
  }
];

/**
 * Extract plain text from HTML
 */
function extractTextFromHtml(html) {
  if (!html) return '';
  
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean job data
 */
function cleanJobData(job) {
  const cleaned = { ...job };
  
  // Ensure title and company are strings
  cleaned.title = String(cleaned.title || '').trim();
  cleaned.company = String(cleaned.company || '').trim();
  
  // Default location to remote if missing
  cleaned.location = String(cleaned.location || 'Remote').trim();
  
  // Clean up description - extract plain text for filtering
  if (cleaned.description) {
    cleaned.descriptionText = extractTextFromHtml(cleaned.description);
  } else {
    cleaned.description = '';
    cleaned.descriptionText = '';
  }
  
  // Standardize date format if exists
  if (cleaned.date) {
    try {
      cleaned.postedDate = new Date(cleaned.date);
    } catch (e) {
      cleaned.postedDate = new Date();
    }
  } else {
    cleaned.postedDate = new Date();
  }
  
  // Add scrapedDate if not exists
  cleaned.scrapedDate = cleaned.scraped_date || new Date();
  
  return cleaned;
}

/**
 * Determine if a job is relevant to our categories
 */
function categorizeJob(job, config) {
  const title = job.title.toLowerCase();
  const description = job.descriptionText.toLowerCase();
  const combinedText = `${title} ${description}`;
  
  // Check if this is an excluded job title (senior positions, etc.)
  for (const term of config.filters.excludeTitleTerms) {
    if (title.includes(term.toLowerCase())) {
      return { isRelevant: false, reason: `Title contains excluded term: ${term}` };
    }
  }
  
  // Check if description is too short
  if (job.descriptionText.split(/\s+/).length < config.filters.minDescriptionLength) {
    return { isRelevant: false, reason: 'Description is too short' };
  }
  
  // Check for scam indicators
  for (const term of config.qualityScoring.negativeKeywords) {
    if (description.includes(term.toLowerCase())) {
      return { isRelevant: false, reason: `Description contains negative keyword: ${term}` };
    }
  }
  
  // Category pattern matching - check against each of our pattern groups
  let isAdmin = false;
  let isDataEntry = false;  
  let isCustomerService = false;
  let isRemote = false;
  
  // Check admin patterns
  for (const pattern of config.patterns.adminPatterns) {
    if (pattern.test(combinedText)) {
      isAdmin = true;
      break;
    }
  }
  
  // Check data entry patterns
  for (const pattern of config.patterns.dataEntryPatterns) {
    if (pattern.test(combinedText)) {
      isDataEntry = true;
      break;
    }
  }
  
  // Check customer service patterns
  for (const pattern of config.patterns.customerServicePatterns) {
    if (pattern.test(combinedText)) {
      isCustomerService = true;
      break;
    }
  }
  
  // Check remote patterns
  for (const pattern of config.patterns.remotePatterns) {
    if (pattern.test(combinedText)) {
      isRemote = true;
      break;
    }
  }
  
  // Job must be remote to be relevant
  if (!isRemote) {
    return { isRelevant: false, reason: 'Job is not remote' };
  }
  
  // Determine job category and relevance
  if (isAdmin) {
    return { isRelevant: true, category: 'admin' };
  } else if (isDataEntry) {
    return { isRelevant: true, category: 'data_entry' };
  } else if (isCustomerService) {
    return { isRelevant: true, category: 'customer_service' };
  }
  
  // Non-categorized but passed the initial filters
  return { isRelevant: false, reason: 'Job does not match any target category' };
}

/**
 * Calculate the quality score for a job listing (simplified)
 */
function calculateQualityScore(job, config, category) {
  let relevanceScore = 5;
  let qualityIndicatorScore = 5;
  const credibilityScore = 7;
  const recencyScore = 10; // All mock jobs are recent
  
  // Relevance score
  if (category === 'admin' || category === 'data_entry') {
    relevanceScore += 2;
  } else if (category === 'customer_service') {
    relevanceScore += 1;
  }
  
  // Quality indicators
  const wordCount = job.descriptionText.split(/\s+/).length;
  if (wordCount > 500) {
    qualityIndicatorScore += 1;
  } else if (wordCount > 300) {
    qualityIndicatorScore += 0.5;
  } else if (wordCount < 100) {
    qualityIndicatorScore -= 2;
  }
  
  // Calculate weighted score
  const weights = config.qualityScoring.weights;
  const weightedScore = 
    (relevanceScore * weights.relevanceScore) +
    (qualityIndicatorScore * weights.qualityIndicatorScore) +
    (credibilityScore * weights.credibilityScore) +
    (recencyScore * weights.recencyScore);
  
  // Round to 1 decimal place
  return Math.round(weightedScore * 10) / 10;
}

/**
 * Generate tags for job listing
 */
function generateTags(job) {
  const tags = [];
  const title = job.title.toLowerCase();
  const description = job.descriptionText.toLowerCase();
  
  // Add category based tags
  if (title.includes('data entry') || description.includes('data entry')) {
    tags.push('data entry');
  }
  
  if (title.includes('administrative') || description.includes('administrative')) {
    tags.push('administrative');
  }
  
  if (title.includes('assistant') || description.includes('assistant')) {
    tags.push('assistant');
  }
  
  if (title.includes('customer service') || description.includes('customer service')) {
    tags.push('customer service');
  }
  
  // Add location based tags
  if (job.location.toLowerCase().includes('usa') || 
      job.location.toLowerCase().includes('united states')) {
    tags.push('us-only');
  }
  
  return tags;
}

/**
 * Run the test
 */
async function runTest() {
  console.log('Running admin/data entry job filter test...');
  
  const results = {
    totalJobs: mockJobs.length,
    adminJobsFound: 0,
    dataEntryJobsFound: 0,
    customerServiceJobsFound: 0,
    filteredOut: 0,
    passedJobs: []
  };
  
  // Process each mock job
  for (const job of mockJobs) {
    // Step 1: Clean the job data
    const cleanedJob = cleanJobData(job);
    
    // Step 2: Categorize the job
    const categoryInfo = categorizeJob(cleanedJob, adminEntryConfig);
    
    if (!categoryInfo.isRelevant) {
      results.filteredOut++;
      console.log(`\nFiltered out: "${cleanedJob.title}" at ${cleanedJob.company}`);
      console.log(`Reason: ${categoryInfo.reason}`);
      continue;
    }
    
    // Step 3: Process relevant job
    cleanedJob.category = categoryInfo.category;
    switch (categoryInfo.category) {
      case 'admin':
        results.adminJobsFound++;
        break;
      case 'data_entry':
        results.dataEntryJobsFound++;
        break;
      case 'customer_service':
        results.customerServiceJobsFound++;
        break;
    }
    
    // Step 4: Calculate quality score
    cleanedJob.qualityScore = calculateQualityScore(cleanedJob, adminEntryConfig, categoryInfo.category);
    
    // Step 5: Generate tags
    cleanedJob.tags = generateTags(cleanedJob);
    
    // Add to passed jobs
    results.passedJobs.push({
      title: cleanedJob.title,
      company: cleanedJob.company,
      category: cleanedJob.category,
      qualityScore: cleanedJob.qualityScore,
      tags: cleanedJob.tags
    });
  }
  
  // Save and print results
  await saveResults(results);
  printSummary(results);
}

/**
 * Save test results
 */
async function saveResults(results) {
  try {
    const logDir = path.join(__dirname, 'logs');
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create logs directory: ${error.message}`);
    }
    
    const logFile = path.join(logDir, 'mock-admin-filter-results.json');
    await fs.writeFile(logFile, JSON.stringify(results, null, 2));
    console.log(`\nSaved test results to ${logFile}`);
  } catch (error) {
    console.error(`Failed to save results: ${error.message}`);
  }
}

/**
 * Print test summary
 */
function printSummary(results) {
  console.log('\n=== Admin/Data Entry Filter Test Results ===');
  console.log(`Total jobs tested: ${results.totalJobs}`);
  console.log(`Filtered out: ${results.filteredOut}`);
  console.log(`Passed jobs: ${results.passedJobs.length}`);
  console.log(`  - Admin jobs: ${results.adminJobsFound}`);
  console.log(`  - Data entry jobs: ${results.dataEntryJobsFound}`);
  console.log(`  - Customer service jobs: ${results.customerServiceJobsFound}`);
  
  // Print details of passed jobs
  if (results.passedJobs.length > 0) {
    console.log('\nPassed jobs:');
    results.passedJobs.forEach((job, index) => {
      console.log(`\n${index + 1}. ${job.title} at ${job.company}`);
      console.log(`   Category: ${job.category}`);
      console.log(`   Quality score: ${job.qualityScore}`);
      console.log(`   Tags: ${job.tags.join(', ')}`);
    });
  }
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
}); 