/**
 * Test for admin/data entry job filtering logic
 * 
 * This script tests our filtering and categorization logic using mock data,
 * simulating what would happen with data from JobSpy scraping.
 */

const adminEntryConfig = require('./config/admin-entry-config');
const fs = require('fs').promises;
const path = require('path');

// Sample mock jobs that mimic what JobSpy returns
const mockJobs = [
  {
    title: "Remote Data Entry Specialist",
    company: "ABC Company",
    location: "Remote",
    description: `
      We are looking for a Data Entry Specialist to join our remote team. 
      
      Responsibilities:
      - Enter data from various sources into company database
      - Verify data accuracy and completeness
      - Resolve data discrepancies
      - Maintain databases by updating and adding new information
      - Process data according to established procedures
      
      Requirements:
      - Typing speed of at least 50 WPM
      - High attention to detail
      - Experience with Microsoft Excel
      - Ability to meet deadlines
      - Strong organizational skills
      
      Benefits:
      - Fully remote position
      - Flexible working hours
      - Paid time off
      - Health insurance
      - 401(k) plan
    `,
    url: "https://example.com/job1",
    date: new Date().toISOString(),
    salary: "$15-$20 per hour",
    source: "indeed"
  },
  {
    title: "Virtual Administrative Assistant",
    company: "XYZ Corp",
    location: "Remote, USA",
    description: `
      XYZ Corp is seeking a Virtual Administrative Assistant to support our executive team.
      
      Responsibilities:
      - Manage calendars and schedule meetings
      - Handle email correspondence
      - Prepare reports and presentations
      - Organize virtual team events
      - Provide general administrative support
      
      Requirements:
      - 1+ years of administrative experience
      - Proficiency in Microsoft Office suite
      - Excellent communication skills
      - Strong organizational abilities
      - Ability to work independently
      
      This is a work-from-home position with flexible hours. Must be located in the USA.
    `,
    url: "https://example.com/job2",
    date: new Date().toISOString(),
    salary: "$18-$25 per hour",
    source: "linkedin"
  },
  {
    title: "Remote Customer Service Representative",
    company: "Service Co.",
    location: "Work from Home",
    description: `
      Join our customer service team working remotely. This role involves interacting with customers via phone, email, and chat to address inquiries and resolve issues.
      
      Key Responsibilities:
      - Answer customer questions and provide information about products/services
      - Handle complaints and resolve issues
      - Process orders, returns, and refunds
      - Update customer records
      - Escalate complex issues to the appropriate departments
      
      Requirements:
      - Customer service experience preferred
      - Excellent communication skills
      - Problem-solving abilities
      - Basic computer knowledge
      - Reliable internet connection
      
      Training provided. Equipment allowance available.
    `,
    url: "https://example.com/job3",
    date: new Date().toISOString(),
    salary: "$16-$22 per hour",
    source: "indeed"
  },
  {
    title: "Senior Software Engineer - Remote",
    company: "Tech Solutions Inc.",
    location: "Remote",
    description: `
      Tech Solutions Inc. is looking for an experienced Software Engineer to join our development team.
      
      Responsibilities:
      - Design and develop high-quality software solutions
      - Collaborate with cross-functional teams
      - Write clean, maintainable code
      - Participate in code reviews
      - Mentor junior developers
      
      Requirements:
      - 5+ years of experience in software development
      - Strong knowledge of JavaScript, TypeScript, and React
      - Experience with Node.js and SQL/NoSQL databases
      - Bachelor's degree in Computer Science or related field
      - Excellent problem-solving skills
    `,
    url: "https://example.com/job4",
    date: new Date().toISOString(),
    salary: "$120,000 - $150,000 per year",
    source: "linkedin"
  },
  {
    title: "Remote Data Analyst",
    company: "DataCorp",
    location: "Remote",
    description: `
      DataCorp is seeking a Data Analyst to work with our team remotely. The ideal candidate will be responsible for analyzing data, creating reports, and providing insights to stakeholders.
      
      Key Responsibilities:
      - Analyze large datasets using SQL and Excel
      - Create visualizations and dashboards
      - Generate regular reports for business units
      - Identify trends and patterns in data
      - Make recommendations based on data insights
      
      Requirements:
      - Experience with SQL and Excel
      - Knowledge of data visualization tools
      - Analytical thinking and problem-solving skills
      - Attention to detail
      - Bachelor's degree in a relevant field (preferred)
    `,
    url: "https://example.com/job5",
    date: new Date().toISOString(),
    salary: "$60,000 - $80,000 per year",
    source: "indeed"
  },
  {
    title: "Work from home typist - Make $$$$ Fast!",
    company: "TypingPros",
    location: "Anywhere",
    description: `
      Make money fast typing from home! All you need is a computer and internet connection.
      
      - No experience needed
      - Be your own boss
      - Work whenever you want
      - Earn up to $1000 per week
      
      $500 certification required to get started. Sign up today and start earning tomorrow!
    `,
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
  
  // Check if description is too short - temporarily reduce for testing
  const minWords = 20; // reduced from config value for testing
  if (job.descriptionText.split(/\s+/).length < minWords) {
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
  console.log('=== Admin/Data Entry Job Filter Test ===');
  
  const results = {
    totalJobs: mockJobs.length,
    adminJobsFound: 0,
    dataEntryJobsFound: 0,
    customerServiceJobsFound: 0,
    filteredOut: 0,
    passedJobs: []
  };
  
  console.log(`Testing ${results.totalJobs} mock job listings\n`);
  
  // Process each mock job
  for (const job of mockJobs) {
    // Step 1: Clean the job data
    const cleanedJob = cleanJobData(job);
    
    console.log(`Processing: "${cleanedJob.title}" at ${cleanedJob.company}`);
    
    // Step 2: Categorize the job
    const categoryInfo = categorizeJob(cleanedJob, adminEntryConfig);
    
    if (!categoryInfo.isRelevant) {
      results.filteredOut++;
      console.log(`  FILTERED OUT: ${categoryInfo.reason}`);
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
    
    console.log(`  PASSED: Category=${categoryInfo.category}, Quality=${cleanedJob.qualityScore}`);
    
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
  
  return results;
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
    
    const logFile = path.join(logDir, 'job-filter-results.json');
    await fs.writeFile(logFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to ${logFile}`);
  } catch (error) {
    console.error(`Failed to save results: ${error.message}`);
  }
}

/**
 * Print test summary
 */
function printSummary(results) {
  console.log('\n=== Test Results Summary ===');
  console.log(`Total jobs tested: ${results.totalJobs}`);
  console.log(`Filtered out: ${results.filteredOut}`);
  console.log(`Passed jobs: ${results.passedJobs.length}`);
  console.log(`  - Admin jobs: ${results.adminJobsFound}`);
  console.log(`  - Data entry jobs: ${results.dataEntryJobsFound}`);
  console.log(`  - Customer service jobs: ${results.customerServiceJobsFound}`);
  
  // Print details of passed jobs
  if (results.passedJobs.length > 0) {
    console.log('\nPassed Jobs Detail:');
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