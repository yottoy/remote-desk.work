// Import required modules
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Debug mode for easier troubleshooting
const DEBUG_MODE = true;

// Configuration
const API_HOST = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';
const DELAY_BETWEEN_REQUESTS = process.env.DELAY_BETWEEN_REQUESTS ? parseInt(process.env.DELAY_BETWEEN_REQUESTS) : 5000; // ms
const RETRY_DELAY = process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY) : 30000; // ms
const MAX_RETRIES = process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3;
const RESULTS_FILE = path.join(__dirname, 'indeed-results.json');
const PROXIES_FILE = path.join(__dirname, 'proxies.txt');
const KEYWORDS_FILE = path.join(__dirname, 'admin-data-entry-keywords.json');
const USE_PROXIES = process.env.USE_PROXIES === 'true' || false;

// Configure logger with more verbose debugging
const logger = {
  debug: (...args) => console.debug(`DEBUG: ${args.join(' ')}`),
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Load keywords configuration
let keywordsConfig = {};
try {
  keywordsConfig = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf8'));
  logger.info(`Loaded keywords configuration with ${keywordsConfig.search_combinations?.length || 0} search combinations`);
} catch (error) {
  logger.error(`Failed to load keywords file: ${error.message}`);
  keywordsConfig = { 
    search_combinations: [],
    exclude_keywords: [],
    required_keywords: []
  };
}

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to add random delay jitter
const randomDelay = baseMs => {
  const jitter = Math.random() * baseMs * 0.5; // Add up to 50% jitter
  return baseMs + jitter;
};

// Configure axios to use IPv4
const originalCreate = axios.create;
axios.create = function(config) {
  config = config || {};
  // Force IPv4
  config.family = 4;  
  // Set explicit timeout
  config.timeout = config.timeout || 120000;
  return originalCreate.call(this, config);
};

// Create a properly configured axios instance
const axiosClient = axios.create({
  family: 4, // Force IPv4
  timeout: 120000, // 2 minute timeout
  headers: {
    'Accept': 'application/json',
    'Connection': 'keep-alive'
  }
});

// Check bridge health
async function checkBridgeHealth() {
  try {
    const url = `${API_HOST}/health`;
    logger.debug(`Checking bridge status at ${url}`);
    
    const response = await axiosClient.get(url, { 
      timeout: 5000,
      validateStatus: () => true // Accept any status code as response
    });
    
    logger.debug(`Bridge health check response: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    logger.error(`Bridge health check error: ${error.message}`);
    return false;
  }
}

// Scrape Indeed jobs function - specific to Indeed's requirements
async function scrapeIndeedJobs(searchTerm, location = 'any', resultsWanted = 30, retryCount = 0) {
  try {
    // First verify bridge is healthy
    const isHealthy = await checkBridgeHealth();
    if (!isHealthy) {
      logger.error('Bridge is not responding to health checks, cannot proceed');
      await delay(5000); // Wait and try again
      if (retryCount < 2) {
        return scrapeIndeedJobs(searchTerm, location, resultsWanted, retryCount + 1);
      }
      return [];
    }
    
    logger.info(`Scraping Indeed for "${searchTerm}" in location "${location}"...`);
    
    const url = `${API_HOST}/scrape-jobs`;
    logger.debug(`Sending request to ${url}`);
    
    // Load proxies if enabled (IMPORTANT for Indeed which often blocks IPs)
    let proxies = [];
    if (USE_PROXIES) {
      try {
        if (fs.existsSync(PROXIES_FILE)) {
          const proxyText = fs.readFileSync(PROXIES_FILE, 'utf8');
          proxies = proxyText.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
          if (proxies.length > 0) {
            logger.info(`Loaded ${proxies.length} proxies from ${PROXIES_FILE}`);
          } else {
            logger.warn('No valid proxies found - Indeed scraping may be blocked');
          }
        }
      } catch (error) {
        logger.warn(`Failed to load proxies: ${error.message}`);
      }
    } else {
      logger.warn('Proxies disabled - Indeed scraping may be unreliable due to IP blocking');
    }
    
    // Create Indeed-specific request
    const requestBody = {
      site_names: ['indeed'],
      search_terms: [searchTerm],
      location: location,
      results_wanted: resultsWanted,
      hours_old: 72,
      is_remote: true,
      country_indeed: 'USA', // Explicitly set USA for Indeed
      distance: keywordsConfig.distance || 50,
      description_format: 'markdown',
      exclude_keywords: keywordsConfig.exclude_keywords || []
    };
    
    // Add proxies if available
    if (USE_PROXIES && proxies.length > 0) {
      requestBody.proxies = proxies;
    }
    
    // Make request with extended timeout for Indeed which can be slow
    const response = await axiosClient.post(url, requestBody, {
      timeout: 180000 // 3 minutes for Indeed which can be slow
    });
    
    if (response.data && response.data.jobs && Array.isArray(response.data.jobs)) {
      logger.info(`Found ${response.data.jobs.length} jobs from Indeed for "${searchTerm}" in location "${location}"`);
      return response.data.jobs;
    } else {
      logger.warn(`No jobs found or invalid response from Indeed for "${searchTerm}"`);
      return [];
    }
  } catch (error) {
    logger.error(`Error scraping Indeed for "${searchTerm}": ${error.message}`);
    
    if (error.message.includes('timeout') || error.message.includes('429') || 
        error.message.includes('403') || error.message.includes('captcha')) {
      logger.warn('Indeed may be blocking our requests. Try using more proxies.');
    }
    
    if (retryCount < MAX_RETRIES) {
      const retryTime = RETRY_DELAY * (retryCount + 1); // Exponential backoff
      logger.info(`Retrying in ${retryTime/1000} seconds (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(retryTime);
      return scrapeIndeedJobs(searchTerm, location, resultsWanted, retryCount + 1);
    }
    
    return [];
  }
}

// Print detailed environment information
function debugEnvironment() {
  try {
    // Print current directory and file list
    logger.info(`Current directory: ${process.cwd()}`);
    logger.info(`Script file: ${__filename}`);
    
    // Print environment variables
    logger.info('Environment variables:');
    for (const [key, value] of Object.entries(process.env)) {
      if (key.includes('PATH') || key.includes('NODE') || key.includes('JOBSPY') || key.includes('PROXY')) {
        logger.info(`  ${key}=${value}`);
      }
    }
    
    // List files in current directory
    const files = fs.readdirSync(process.cwd());
    logger.info(`Files in current directory: ${files.join(', ')}`);
    
    // Check for critical dependencies
    try {
      require('axios');
      logger.info('axios module loaded successfully');
    } catch (err) {
      logger.error(`Failed to load axios: ${err.message}`);
    }
    
    // Node.js version
    logger.info(`Node.js version: ${process.version}`);
    logger.info(`Platform: ${process.platform} ${process.arch}`);
    
    // Check for critical files
    const criticalFiles = [
      'admin-data-entry-keywords.json',
      'proxies.txt',
      'jobspy_bridge.py'
    ];
    
    for (const file of criticalFiles) {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      logger.info(`File ${file} exists: ${exists}`);
    }
  } catch (error) {
    logger.error(`Error in debug environment: ${error.message}`);
  }
}

// Simple script to verify bridge connection
async function main() {
  console.log('=== INDEED SCRAPER DIAGNOSTIC MODE ===');
  console.log(`Starting diagnostic check at ${new Date().toUTCString()}`);
  
  if (DEBUG_MODE) {
    debugEnvironment();
  }
  
  try {
    // Configuration
    const API_HOST = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';
    logger.info(`API Host: ${API_HOST}`);
    
    // Try to make simple health check request
    try {
      logger.info('Attempting health check...');
      const response = await axios.get(`${API_HOST}/health`, { 
        timeout: 10000,
        validateStatus: () => true
      });
      
      logger.info(`Health check status: ${response.status}`);
      logger.info(`Health check response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      logger.error(`Health check failed: ${error.message}`);
      if (error.code) {
        logger.error(`Error code: ${error.code}`);
      }
      if (error.response) {
        logger.error(`Response status: ${error.response.status}`);
      }
    }
    
    // Check for keywords file
    try {
      const keywordsPath = path.join(process.cwd(), 'admin-data-entry-keywords.json');
      logger.info(`Keywords file path: ${keywordsPath}`);
      
      if (fs.existsSync(keywordsPath)) {
        const keywordsContent = fs.readFileSync(keywordsPath, 'utf8');
        try {
          const keywordsData = JSON.parse(keywordsContent);
          logger.info(`Keywords file parsed successfully, contains ${keywordsData.job_types?.length || 0} job types`);
        } catch (parseError) {
          logger.error(`Failed to parse keywords file: ${parseError.message}`);
        }
      } else {
        logger.error(`Keywords file not found at ${keywordsPath}`);
      }
    } catch (error) {
      logger.error(`Error checking keywords file: ${error.message}`);
    }
    
    logger.info('Basic diagnostics completed');
    console.log(`Diagnostic check completed at ${new Date().toUTCString()}`);
    
  } catch (error) {
    logger.error(`Fatal error in diagnostic: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error in main: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
}); 