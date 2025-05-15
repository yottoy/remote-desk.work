// Import required modules
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Configure logger
const logger = {
  debug: (...args) => console.debug(`DEBUG: ${args.join(' ')}`),
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Helper function to read keywords configuration 
function loadKeywords() {
  try {
    const keywordsPath = path.join(__dirname, 'admin-data-entry-keywords.json');
    const rawData = fs.readFileSync(keywordsPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    logger.error(`Error loading keywords: ${error.message}`);
    return null;
  }
}

// Read admin-entry-config
function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config', 'admin-entry-config.js');
    return require(configPath);
  } catch (error) {
    logger.error(`Error loading admin-entry-config: ${error.message}`);
    return null;
  }
}

// Test JobSpy bridge connectivity
async function testBridgeConnectivity() {
  logger.info('Testing JobSpy bridge connectivity...');
  
  try {
    const bridgeUrl = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';
    const response = await axios.get(`${bridgeUrl}/health`);
    
    if (response.status === 200) {
      logger.info('Bridge is running and responsive');
      return true;
    } else {
      logger.warn(`Bridge responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`Bridge connectivity error: ${error.message}`);
    return false;
  }
}

// Test keyword relevance with a small sample
async function testKeywordRelevance() {
  logger.info('Testing keyword relevance...');
  
  // Load the configuration
  const keywords = loadKeywords();
  const config = loadConfig();
  
  if (!keywords || !config) {
    logger.error('Could not load keywords or config');
    return false;
  }
  
  // Load sample jobs from combined-results.json if it exists
  let sampleJobs = [];
  try {
    const samplesPath = path.join(__dirname, 'combined-results.json');
    if (fs.existsSync(samplesPath)) {
      const rawData = fs.readFileSync(samplesPath, 'utf8');
      sampleJobs = JSON.parse(rawData);
      logger.info(`Loaded ${sampleJobs.length} sample jobs for analysis`);
    } else {
      logger.warn('No sample jobs found for keyword testing');
      return false;
    }
  } catch (error) {
    logger.error(`Error loading sample jobs: ${error.message}`);
    return false;
  }
  
  // Test keywords against sample jobs
  const results = {
    total: sampleJobs.length,
    matchedByJobType: 0,
    matchedByKeyword: 0,
    matchedByRequiredKeywords: 0,
    matchedByPattern: 0,
    excludedByKeywords: 0,
    tooShortDescription: 0
  };
  
  for (const job of sampleJobs) {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const combinedText = `${title} ${description}`;
    
    // Check job types
    let matchedJobType = false;
    for (const jobType of keywords.job_types) {
      if (title.includes(jobType.toLowerCase())) {
        results.matchedByJobType++;
        matchedJobType = true;
        break;
      }
    }
    
    // Check keywords
    let matchedKeyword = false;
    for (const keyword of keywords.keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        results.matchedByKeyword++;
        matchedKeyword = true;
        break;
      }
    }
    
    // Check required keywords
    let matchedRequired = false;
    for (const required of keywords.required_keywords) {
      if (combinedText.includes(required.toLowerCase())) {
        results.matchedByRequiredKeywords++;
        matchedRequired = true;
        break;
      }
    }
    
    // Check patterns from config
    let matchedPattern = false;
    if (config.patterns) {
      for (const pattern of [
        ...config.patterns.adminPatterns || [],
        ...config.patterns.dataEntryPatterns || [],
        ...config.patterns.customerServicePatterns || []
      ]) {
        if (pattern.test(combinedText)) {
          results.matchedByPattern++;
          matchedPattern = true;
          break;
        }
      }
    }
    
    // Check excluded keywords
    for (const exclude of keywords.exclude_keywords) {
      if (title.includes(exclude.toLowerCase())) {
        results.excludedByKeywords++;
        break;
      }
    }
    
    // Check description length
    if (description && description.split(/\s+/).length < 50) {
      results.tooShortDescription++;
    }
  }
  
  // Print results
  logger.info('Keyword relevance test results:');
  logger.info(`Total jobs analyzed: ${results.total}`);
  logger.info(`Matched by job type: ${results.matchedByJobType} (${(results.matchedByJobType/results.total*100).toFixed(1)}%)`);
  logger.info(`Matched by keyword: ${results.matchedByKeyword} (${(results.matchedByKeyword/results.total*100).toFixed(1)}%)`);
  logger.info(`Matched by required keywords: ${results.matchedByRequiredKeywords} (${(results.matchedByRequiredKeywords/results.total*100).toFixed(1)}%)`);
  logger.info(`Matched by regex pattern: ${results.matchedByPattern} (${(results.matchedByPattern/results.total*100).toFixed(1)}%)`);
  logger.info(`Excluded by keywords: ${results.excludedByKeywords} (${(results.excludedByKeywords/results.total*100).toFixed(1)}%)`);
  logger.info(`Too short description: ${results.tooShortDescription} (${(results.tooShortDescription/results.total*100).toFixed(1)}%)`);
  
  return true;
}

// Test scraping schedule logic
function testScrapingSchedule() {
  logger.info('Testing scraping schedule configuration...');
  
  try {
    const schedulePath = path.join(__dirname, 'scraper-schedule.json');
    const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    
    // Check for scheduling conflicts
    const allSchedules = [
      ...schedule.schedule.weekday || [],
      ...schedule.schedule.weekend || []
    ];
    
    // Check timing distribution
    const times = allSchedules.map(s => s.time);
    const uniqueTimes = [...new Set(times)];
    
    logger.info(`Schedule has ${allSchedules.length} scraping sessions across ${uniqueTimes.length} unique times`);
    
    // Check rate limits against schedule
    let potentialRateLimitIssues = false;
    for (const session of allSchedules) {
      for (const site of session.sites) {
        if (schedule.limits.max_requests_per_hour[site]) {
          const requestsNeeded = session.search_terms.length;
          if (requestsNeeded > schedule.limits.max_requests_per_hour[site]) {
            logger.warn(`Session "${session.name}" may exceed rate limits for ${site}. Requests needed: ${requestsNeeded}, Limit: ${schedule.limits.max_requests_per_hour[site]}`);
            potentialRateLimitIssues = true;
          }
        }
      }
    }
    
    if (!potentialRateLimitIssues) {
      logger.info('No immediate rate limit issues detected in schedule');
    }
    
    return true;
  } catch (error) {
    logger.error(`Error testing scraping schedule: ${error.message}`);
    return false;
  }
}

// Test deduplication logic
async function testDeduplication() {
  logger.info('Testing deduplication logic...');
  
  try {
    // Load sample jobs if available
    const combinedPath = path.join(__dirname, 'combined-results.json');
    if (!fs.existsSync(combinedPath)) {
      logger.warn('No combined results found for deduplication testing');
      return false;
    }
    
    const jobs = JSON.parse(fs.readFileSync(combinedPath, 'utf8'));
    logger.info(`Loaded ${jobs.length} jobs for deduplication testing`);
    
    // Basic statistics
    const uniqueUrls = new Set(jobs.map(job => job.job_url || job.url).filter(Boolean)).size;
    const uniqueTitleCompanies = new Set(jobs.map(job => 
      `${(job.title || '').toLowerCase().trim()}|${(job.company || '').toLowerCase().trim()}`
    )).size;
    
    logger.info(`Unique URLs: ${uniqueUrls}`);
    logger.info(`Unique title+company combinations: ${uniqueTitleCompanies}`);
    logger.info(`Potential duplicates in current logic: ${jobs.length - Math.min(uniqueUrls, uniqueTitleCompanies)}`);
    
    // Identify sources with most duplicates
    const sourceCount = {};
    for (const job of jobs) {
      const source = job.source || job.site_source || 'unknown';
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    }
    
    logger.info('Jobs by source:');
    for (const [source, count] of Object.entries(sourceCount)) {
      logger.info(`  ${source}: ${count} jobs`);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error testing deduplication: ${error.message}`);
    return false;
  }
}

// Main function
async function runDiagnostics() {
  console.log('Starting JobSpy Diagnostics...');
  
  // Test environment and dependencies
  logger.info('Testing environment...');
  logger.info(`Current working directory: ${process.cwd()}`);
  logger.info(`Node version: ${process.version}`);
  
  // Test bridge connectivity
  const bridgeRunning = await testBridgeConnectivity();
  if (!bridgeRunning) {
    logger.warn('JobSpy bridge is not running - this will affect scraping tests');
  }
  
  // Test keyword relevance
  await testKeywordRelevance();
  
  // Test scraping schedule
  testScrapingSchedule();
  
  // Test deduplication logic
  await testDeduplication();
  
  console.log('JobSpy Diagnostics completed');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error(`Unhandled error in diagnostics: ${error.message}`);
  process.exit(1);
}); 