const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Simple logger
const logger = {
  info: (message) => console.log(`INFO: ${message}`),
  error: (message) => console.error(`ERROR: ${message}`),
  warn: (message) => console.warn(`WARNING: ${message}`),
  debug: (message) => console.debug(`DEBUG: ${message}`)
};

// Configuration
const API_HOST = process.env.JOBSPY_BRIDGE_URL || 'http://localhost:8000';
const DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds delay between requests to avoid rate limiting
const RETRY_DELAY = 30000; // 30 seconds before retrying a failed source
const MAX_RETRIES = 3; // Maximum number of retries per source
const RESULTS_FILE = path.join(__dirname, 'scrape-results.json');

// Search terms to use - add more relevant terms to get more jobs
const SEARCH_TERMS = [
  'remote data entry',
  'remote administrative assistant',
  'virtual assistant remote',
  'remote customer service',
  'work from home data entry',
  'remote transcription',
  'remote administrative support',
  'remote office assistant',
  'remote data processing',
  'remote clerk',
  'data entry work from home',
  'remote admin assistant',
  'remote receptionist',
  'remote secretary',
  'remote bookkeeping',
  'work from home customer service',
  'remote executive assistant',
  'work from home sales',
  'remote tech support',
  'remote project management',
  'virtual customer service',
  'remote marketing assistant',
  'content writer remote',
  'remote social media manager'
];

// Define multiple locations to search in
const LOCATIONS = [
  '',  // No location for fully remote
  'USA',
  'UK',
  'Canada',
  'Australia'
];

// Sources to scrape - focusing on working ones based on logs
const SOURCES = [
  'indeed',
  'linkedin',
  'naukri'
  // 'glassdoor',  // Disabled due to 403 errors
  // 'zip_recruiter',  // Disabled due to 429 errors
  // 'bayt'  // Disabled due to 403 errors
];

// Global results tracking
const results = {
  totalJobs: 0,
  sourceStats: {},
  errors: [],
  startTime: new Date(),
  endTime: null
};

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to scrape a single source with a single search term
async function scrapeJobs(source, searchTerm, location, retryCount = 0) {
  // Add source to stats if not exists
  if (!results.sourceStats[source]) {
    results.sourceStats[source] = { jobsFound: 0, searchTerms: {}, errors: 0 };
  }
  
  // Add search term to stats if not exists
  if (!results.sourceStats[source].searchTerms[searchTerm]) {
    results.sourceStats[source].searchTerms[searchTerm] = 0;
  }
  
  try {
    logger.info(`Scraping ${source} for "${searchTerm}" in location "${location || 'any'}"...`);
    
    const response = await axios.post(`${API_HOST}/scrape-jobs`, {
      site_names: [source],
      search_terms: [searchTerm],
      location: location,
      results_wanted: 50,  // Request more results
      hours_old: 168,  // 7 days instead of 3
      is_remote: true,
      country_indeed: "USA",
      distance: 100
    }, {
      timeout: 60000 // 60 second timeout
    });
    
    // Check for actual jobs array in response
    if (!response.data || !response.data.jobs || !Array.isArray(response.data.jobs)) {
      throw new Error('Invalid response structure from bridge');
    }
    
    const jobCount = response.data?.count || 0;
    logger.info(`Found ${jobCount} jobs from ${source} for "${searchTerm}" in location "${location || 'any'}"`);
    
    // Update stats
    results.totalJobs += jobCount;
    results.sourceStats[source].jobsFound += jobCount;
    results.sourceStats[source].searchTerms[searchTerm] += jobCount;
    
    return jobCount;
  } catch (error) {
    const errorMessage = error.response ? 
      `${error.message} - Status: ${error.response.status}` : 
      error.message;
    
    logger.error(`Failed to scrape ${source} for "${searchTerm}": ${errorMessage}`);
    
    // Track error
    results.sourceStats[source].errors++;
    results.errors.push({
      source,
      searchTerm,
      location,
      error: errorMessage,
      time: new Date().toISOString()
    });
    
    // Implement retry logic with exponential backoff
    if (retryCount < MAX_RETRIES) {
      const retryDelayMs = RETRY_DELAY * Math.pow(2, retryCount);
      logger.warn(`Retrying in ${retryDelayMs/1000} seconds (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(retryDelayMs);
      return scrapeJobs(source, searchTerm, location, retryCount + 1);
    }
    
    return 0;
  }
}

// Save results to a JSON file
function saveResults() {
  results.endTime = new Date();
  results.duration = (results.endTime - results.startTime) / 1000; // in seconds
  
  try {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
    logger.info(`Results saved to ${RESULTS_FILE}`);
  } catch (error) {
    logger.error(`Failed to save results: ${error.message}`);
  }
}

// Check if the bridge is running
async function checkBridgeStatus() {
  try {
    const response = await axios.get(API_HOST, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    logger.error(`Bridge is not running: ${error.message}`);
    return false;
  }
}

// Main function to run all scrapers
async function scrapeAllJobs() {
  logger.info('Starting mass job scraping operation');
  
  // Check if bridge is running
  const bridgeRunning = await checkBridgeStatus();
  if (!bridgeRunning) {
    logger.error('JobSpy bridge is not running. Please start it with "npm run bridge" first.');
    process.exit(1);
  }
  
  // Go through each source
  for (const source of SOURCES) {
    logger.info(`Starting scraping with source: ${source}`);
    
    // Go through each search term and location combination
    for (const searchTerm of SEARCH_TERMS) {
      for (const location of LOCATIONS) {
        await scrapeJobs(source, searchTerm, location);
        
        // Delay between requests to avoid rate limiting
        logger.info(`Waiting ${DELAY_BETWEEN_REQUESTS/1000} seconds before next request...`);
        await delay(DELAY_BETWEEN_REQUESTS);
      }
    }
  }
  
  // Save final results
  saveResults();
  
  logger.info(`Scraping complete! Total jobs found: ${results.totalJobs}`);
  
  // Print summary stats
  for (const source in results.sourceStats) {
    logger.info(`Source: ${source} - Jobs found: ${results.sourceStats[source].jobsFound}, Errors: ${results.sourceStats[source].errors}`);
  }
}

// Run the main function
scrapeAllJobs().catch(error => {
  logger.error(`Failed to run job scraping: ${error.message}`);
  results.errors.push({
    global: true,
    error: error.message,
    time: new Date().toISOString()
  });
  saveResults();
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled rejection at ${promise}, reason: ${reason}`);
  results.errors.push({
    global: true,
    error: `Unhandled rejection: ${reason}`,
    time: new Date().toISOString()
  });
}); 