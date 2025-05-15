const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

// Simple logger
const logger = {
  info: (message) => console.log(`INFO: ${message}`),
  error: (message) => console.error(`ERROR: ${message}`),
  warn: (message) => console.warn(`WARNING: ${message}`),
  debug: (message) => console.debug(`DEBUG: ${message}`)
};

// Configuration
const API_HOST = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';
const DELAY_BETWEEN_REQUESTS = process.env.DELAY_BETWEEN_REQUESTS ? parseInt(process.env.DELAY_BETWEEN_REQUESTS) : 3000; // ms
const RETRY_DELAY = process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY) : 30000; // ms
const MAX_RETRIES = process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3;
const BRIDGE_CHECK_RETRIES = 5;
const BRIDGE_CHECK_DELAY = 3000; // ms
const RESULTS_FILE = path.join(__dirname, 'scrape-results.json');
const PROXIES_FILE = path.join(__dirname, 'proxies.txt');
const KEYWORDS_FILE = path.join(__dirname, 'admin-data-entry-keywords.json');
const USE_PROXIES = process.env.USE_PROXIES === 'true' || false;

// Default search parameters (will be overridden by keywords file if available)
let SEARCH_TERMS = [
  'remote data entry',
  'remote administrative assistant',
  'virtual assistant remote'
];

// Default sources to search
let SOURCES = [
  'indeed',
  'linkedin',
  'naukri'
];

// Default locations
let LOCATIONS = [
  '',  // No location for fully remote
  'USA'
];

// Configure axios to use IPv4
const originalCreate = axios.create;
axios.create = function(config) {
  config = config || {};
  // Force IPv4
  config.family = 4;
  return originalCreate.call(this, config);
};

// Create a properly configured axios instance
const axiosClient = axios.create({
  family: 4, // Force IPv4
  timeout: 120000 // 2 minute timeout
});

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

// Load keywords configuration from file
async function loadKeywordConfig() {
  try {
    if (!fs.existsSync(KEYWORDS_FILE)) {
      logger.warn(`Keywords file not found at ${KEYWORDS_FILE}. Using defaults.`);
      return false;
    }
    
    const data = await readFileAsync(KEYWORDS_FILE, 'utf8');
    const config = JSON.parse(data);
    
    // Generate search terms from job types and keywords
    if (config.search_combinations && config.search_combinations.length > 0) {
      // Use pre-defined search combinations
      logger.info(`Using ${config.search_combinations.length} predefined search combinations from config`);
      return config;
    } else if (config.job_types && config.keywords) {
      // Generate combinations from job types and keywords
      const combinedTerms = [];
      
      for (const jobType of config.job_types) {
        for (const keyword of config.keywords) {
          combinedTerms.push(`${keyword} ${jobType}`);
        }
      }
      
      SEARCH_TERMS = combinedTerms;
      logger.info(`Generated ${SEARCH_TERMS.length} search terms from keywords combination`);
    }
    
    // Update locations if provided
    if (config.locations && config.locations.length > 0) {
      LOCATIONS = config.locations;
      logger.info(`Using ${LOCATIONS.length} locations from config`);
    }
    
    return config;
  } catch (error) {
    logger.error(`Failed to load keywords config: ${error.message}`);
    return false;
  }
}

// Load proxies from file if they exist
async function loadProxies() {
  try {
    if (!USE_PROXIES) return null;
    
    if (!fs.existsSync(PROXIES_FILE)) {
      logger.warn(`Proxies file not found at ${PROXIES_FILE}. Proceeding without proxies.`);
      return null;
    }
    
    const data = await readFileAsync(PROXIES_FILE, 'utf8');
    const proxies = data
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    if (proxies.length === 0) {
      logger.warn('No valid proxies found in proxies file.');
      return null;
    }
    
    logger.info(`Loaded ${proxies.length} proxies`);
    return proxies;
  } catch (error) {
    logger.error(`Failed to load proxies: ${error.message}`);
    return null;
  }
}

// Function to scrape a single source with a single search term
async function scrapeJobs(source, searchTerm, location, proxies, config, retryCount = 0) {
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
    
    // Create request payload
    const payload = {
      site_names: [source],
      search_terms: [searchTerm],
      location: location,
      results_wanted: 50,  // Request more results
      hours_old: 168,  // 7 days
      is_remote: true,
      country_indeed: location || "USA",
      distance: config?.distance || 100
    };
    
    // Add exclude keywords if available in config
    if (config?.exclude_keywords && config.exclude_keywords.length > 0) {
      payload.exclude_keywords = config.exclude_keywords;
    }
    
    // Add proxies if available
    if (proxies && proxies.length > 0) {
      // Select a random subset of proxies (up to 5)
      const proxyCount = Math.min(5, proxies.length);
      const selectedProxies = [];
      
      for (let i = 0; i < proxyCount; i++) {
        const randomIndex = Math.floor(Math.random() * proxies.length);
        selectedProxies.push(proxies[randomIndex]);
      }
      
      payload.proxies = selectedProxies;
    }
    
    logger.debug(`Sending request to ${API_HOST}/scrape-jobs`);
    
    // Ensure bridge is still running
    const bridgeRunning = await checkBridgeStatus();
    if (!bridgeRunning) {
      throw new Error('Bridge is not running before making request');
    }
    
    // Use the configured axios client
    const response = await axiosClient.post(`${API_HOST}/scrape-jobs`, payload);
    
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
    
    // Check if it's a connection error - if so, verify bridge is running
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      const bridgeRunning = await checkBridgeStatus();
      if (!bridgeRunning) {
        throw new Error('Bridge connection lost during scraping');
      }
    }
    
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
      return scrapeJobs(source, searchTerm, location, proxies, config, retryCount + 1);
    }
    
    return 0;
  }
}

// Save results to a JSON file
async function saveResults() {
  results.endTime = new Date();
  results.duration = (results.endTime - results.startTime) / 1000; // in seconds
  
  try {
    await writeFileAsync(RESULTS_FILE, JSON.stringify(results, null, 2));
    logger.info(`Results saved to ${RESULTS_FILE}`);
  } catch (error) {
    logger.error(`Failed to save results: ${error.message}`);
  }
}

// Check if the bridge is running
async function checkBridgeStatus(retryCount = 0) {
  try {
    const url = `${API_HOST}/health`;
    logger.debug(`Checking bridge status at ${url}`);
    
    // Get hostname from URL for DNS resolution test
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // First try to understand why DNS resolution might be failing
    try {
      const { execSync } = require('child_process');
      const dnsResult = execSync(`getent hosts ${hostname}`, { encoding: 'utf8' });
      logger.debug(`DNS resolution for ${hostname}: ${dnsResult.trim()}`);
    } catch (e) {
      logger.debug(`Could not resolve DNS for ${hostname}: ${e.message}`);
    }
    
    // Use the configured axios client
    const response = await axiosClient.get(url);
    logger.debug(`Bridge health check response: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    logger.error(`Bridge is not running: ${error.message}`);
    
    if (retryCount < BRIDGE_CHECK_RETRIES) {
      logger.info(`Retrying bridge health check in ${BRIDGE_CHECK_DELAY/1000} seconds (attempt ${retryCount + 1}/${BRIDGE_CHECK_RETRIES})...`);
      await delay(BRIDGE_CHECK_DELAY);
      return checkBridgeStatus(retryCount + 1);
    }
    
    return false;
  }
}

// Main function to run all scrapers
async function scrapeAllJobs() {
  logger.info('Starting mass job scraping operation');
  logger.info(`Using bridge at: ${API_HOST}`);
  
  // Print node version for debugging
  logger.info(`Node.js version: ${process.version}`);
  // Print OS info
  logger.info(`OS: ${process.platform} ${process.arch}`);
  
  // Test DNS resolution for localhost
  try {
    const { execSync } = require('child_process');
    logger.info("Testing localhost resolution:");
    logger.info(execSync('getent hosts localhost', { encoding: 'utf8' }));
  } catch (e) {
    logger.warn(`Failed to test localhost resolution: ${e.message}`);
  }
  
  // Verify that we can connect to the bridge
  logger.info("Checking bridge connection...");
  let bridgeRunning = false;
  
  // Try IPv4 explicitly first
  try {
    const { execSync } = require('child_process');
    logger.info("Testing direct connection to 127.0.0.1:8000");
    const curlResult = execSync('curl -s -v http://127.0.0.1:8000/health', { encoding: 'utf8' });
    logger.info(`Direct curl result: ${curlResult.substring(0, 100)}`);
    bridgeRunning = true;
  } catch (e) {
    logger.warn(`Direct connection test failed: ${e.message}`);
    // Continue to the regular check
  }
  
  if (!bridgeRunning) {
    bridgeRunning = await checkBridgeStatus();
  }
  
  if (!bridgeRunning) {
    logger.error('JobSpy bridge is not running. Please start it first.');
    process.exit(1);
  }
  
  logger.info('Bridge connection confirmed!')
  
  // Load keywords configuration
  const config = await loadKeywordConfig();
  
  // Load proxies if enabled
  const proxies = await loadProxies();
  
  // Run minimal search for testing purposes
  if (process.env.MINIMAL_TEST === 'true') {
    logger.info('Running in minimal test mode with a single query');
    await scrapeJobs('indeed', 'remote data entry', '', proxies, config);
    await saveResults();
    logger.info('Minimal test completed');
    return;
  }
  
  // If we have search combinations in config, use those instead
  if (config && config.search_combinations && config.search_combinations.length > 0) {
    logger.info(`Using ${config.search_combinations.length} predefined search combinations`);
    
    let processedCombos = 0;
    for (const combo of config.search_combinations) {
      const { term, site, location = '' } = combo;
      await scrapeJobs(site, term, location, proxies, config);
      
      // Delay between requests
      const delayTime = DELAY_BETWEEN_REQUESTS + Math.floor(Math.random() * 2000); // Add jitter
      logger.info(`Waiting ${delayTime/1000} seconds before next request...`);
      await delay(delayTime);
      
      // Break early for testing if LIMIT_SEARCH_RESULTS is set
      processedCombos++;
      if (process.env.LIMIT_SEARCH_RESULTS && processedCombos >= parseInt(process.env.LIMIT_SEARCH_RESULTS)) {
        logger.info(`Reached limit of ${process.env.LIMIT_SEARCH_RESULTS} search combinations, stopping`);
        break;
      }
    }
  } else {
    // Otherwise run through the standard combinations
    // Go through each source
    for (const source of SOURCES) {
      logger.info(`Starting scraping with source: ${source}`);
      
      // Go through each search term and location combination
      for (const searchTerm of SEARCH_TERMS) {
        for (const location of LOCATIONS) {
          await scrapeJobs(source, searchTerm, location, proxies, config);
          
          // Delay between requests to avoid rate limiting
          const delayTime = DELAY_BETWEEN_REQUESTS + Math.floor(Math.random() * 2000); // Add jitter
          logger.info(`Waiting ${delayTime/1000} seconds before next request...`);
          await delay(delayTime);
          
          // Break early for testing if LIMIT_SEARCH_RESULTS is set
          if (process.env.LIMIT_SEARCH_RESULTS && results.totalJobs >= parseInt(process.env.LIMIT_SEARCH_RESULTS)) {
            logger.info(`Reached limit of ${process.env.LIMIT_SEARCH_RESULTS} results, stopping`);
            break;
          }
        }
        
        if (process.env.LIMIT_SEARCH_RESULTS && results.totalJobs >= parseInt(process.env.LIMIT_SEARCH_RESULTS)) {
          break;
        }
      }
      
      if (process.env.LIMIT_SEARCH_RESULTS && results.totalJobs >= parseInt(process.env.LIMIT_SEARCH_RESULTS)) {
        break;
      }
    }
  }
  
  // Save final results
  await saveResults();
  
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