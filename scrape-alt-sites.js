// Import required modules
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Configuration
const API_HOST = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000'; // Always use explicit IPv4
const DELAY_BETWEEN_REQUESTS = process.env.DELAY_BETWEEN_REQUESTS ? parseInt(process.env.DELAY_BETWEEN_REQUESTS) : 5000; // ms - increased delay
const RETRY_DELAY = process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY) : 30000; // ms
const MAX_RETRIES = process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3;
const RESULTS_FILE = path.join(__dirname, 'alt-sites-results.json');

// Configure logger
const logger = {
  debug: (...args) => console.debug(`DEBUG: ${args.join(' ')}`),
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Configure axios to use IPv4
const axiosClient = axios.create({
  family: 4, // Force IPv4
  timeout: 180000, // 3 minute timeout - increased timeout
  headers: {
    'Accept': 'application/json',
    'Connection': 'keep-alive'
  }
});

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to add random delay jitter
const randomDelay = baseMs => {
  const jitter = Math.random() * baseMs; // Add up to 100% jitter
  return baseMs + jitter;
};

// DNS resolution check
async function checkDnsResolution(hostname) {
  try {
    const { stdout } = await exec(`getent hosts ${hostname}`);
    logger.debug(`DNS resolution for ${hostname}: ${stdout.trim()}`);
    return stdout.trim();
  } catch (error) {
    logger.warn(`Failed to resolve ${hostname}: ${error.message}`);
    return null;
  }
}

// Check bridge health
async function checkBridgeHealth() {
  try {
    const url = `${API_HOST}/health`;
    logger.debug(`Checking bridge status at ${url}`);
    
    // Check DNS resolution
    await checkDnsResolution('127.0.0.1');
    
    // Make health check request
    const response = await axiosClient.get(url, { timeout: 5000 });
    logger.debug(`Bridge health check response: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    logger.error(`Bridge health check error: ${error.message}`);
    return false;
  }
}

// Scrape jobs function
async function scrapeJobs(site, searchTerm, location = 'any', resultsWanted = 20) {
  try {
    // First verify bridge is healthy
    const isHealthy = await checkBridgeHealth();
    if (!isHealthy) {
      logger.error('Bridge is not responding to health checks, cannot proceed');
      return [];
    }
    
    logger.info(`Scraping ${site} for "${searchTerm}" in location "${location}"...`);
    
    const url = `${API_HOST}/scrape-jobs`;
    logger.debug(`Sending request to ${url}`);
    
    const requestBody = {
      site_names: [site],
      search_terms: [searchTerm],
      location: location,
      results_wanted: resultsWanted,
      hours_old: 72,
      is_remote: true,
      distance: 50,
      description_format: 'markdown'
    };
    
    // Special config for certain sites
    if (site === 'naukri') {
      requestBody.country_indeed = 'IND';
    } else if (site === 'bayt') {
      requestBody.country_indeed = 'UAE';
    }
    
    const response = await axiosClient.post(url, requestBody);
    
    if (response.data && response.data.jobs && Array.isArray(response.data.jobs)) {
      logger.info(`Found ${response.data.jobs.length} jobs from ${site} for "${searchTerm}" in location "${location}"`);
      return response.data.jobs;
    } else {
      logger.warn(`No jobs found or invalid response from ${site} for "${searchTerm}"`);
      return [];
    }
  } catch (error) {
    logger.error(`Error scraping ${site} for "${searchTerm}": ${error.message}`);
    if (error.response) {
      logger.error(`Response status: ${error.response.status}`);
      logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    return [];
  }
}

// Main function
async function main() {
  console.log(`Starting Alternative Job Sites Scraper at ${new Date().toUTCString()}`);
  logger.info('Starting alternative job sites scraping operation');
  logger.info(`Using bridge at: ${API_HOST}`);
  logger.info(`Node.js version: ${process.version}`);
  logger.info(`OS: ${process.platform} ${process.arch}`);
  
  // Define search combinations to try
  const searchCombinations = [
    { site: 'zip_recruiter', term: 'remote data entry', location: 'any' },
    { site: 'zip_recruiter', term: 'remote administrative assistant', location: 'any' },
    { site: 'glassdoor', term: 'remote data entry', location: 'any' },
    { site: 'glassdoor', term: 'remote administrative assistant', location: 'any' },
    { site: 'naukri', term: 'remote data entry', location: 'any' },
    { site: 'bayt', term: 'remote administrative assistant', location: 'any' }
  ];
  
  logger.info(`Using ${searchCombinations.length} search combinations`);
  
  // Store all found jobs
  const allJobs = [];
  const stats = {};
  
  // Initialize statistics
  for (const combo of searchCombinations) {
    if (!stats[combo.site]) {
      stats[combo.site] = { jobs: 0, errors: 0 };
    }
  }
  
  // Process each search combination
  for (const { site, term, location } of searchCombinations) {
    try {
      const jobs = await scrapeJobs(site, term, location);
      allJobs.push(...jobs);
      
      if (stats[site]) {
        stats[site].jobs += jobs.length;
      }
      
      // Add delay before next request with jitter for randomization
      const waitTime = randomDelay(DELAY_BETWEEN_REQUESTS);
      logger.info(`Waiting ${waitTime.toFixed(3)} seconds before next request...`);
      await delay(waitTime);
    } catch (error) {
      logger.error(`Error processing combination (${site}, ${term}, ${location}): ${error.message}`);
      if (stats[site]) {
        stats[site].errors += 1;
      }
    }
  }
  
  // Save results to file
  try {
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(allJobs, null, 2));
    logger.info(`Results saved to ${RESULTS_FILE}`);
  } catch (error) {
    logger.error(`Failed to save results: ${error.message}`);
  }
  
  // Summary
  logger.info(`Scraping complete! Total jobs found: ${allJobs.length}`);
  for (const [site, data] of Object.entries(stats)) {
    logger.info(`Source: ${site} - Jobs found: ${data.jobs}, Errors: ${data.errors}`);
  }
  
  console.log(`Alternative Job Sites Scraper completed at ${new Date().toUTCString()}`);
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error in main: ${error.message}`);
  process.exit(1);
}); 