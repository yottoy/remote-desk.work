// Import required modules
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Configuration
const API_HOST = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000'; // Always use explicit IPv4
const DELAY_BETWEEN_REQUESTS = process.env.DELAY_BETWEEN_REQUESTS ? parseInt(process.env.DELAY_BETWEEN_REQUESTS) : 3000; // ms
const RETRY_DELAY = process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY) : 30000; // ms
const MAX_RETRIES = process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3;
const BRIDGE_CHECK_RETRIES = 5;
const BRIDGE_CHECK_DELAY = 3000; // ms
const RESULTS_FILE = path.join(__dirname, 'scrape-results.json');
const PROXIES_FILE = path.join(__dirname, 'proxies.txt');
const KEYWORDS_FILE = path.join(__dirname, 'admin-data-entry-keywords.json');
const USE_PROXIES = process.env.USE_PROXIES === 'true' || false;

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

// Configure logger
const logger = {
  debug: (...args) => console.debug(`DEBUG: ${args.join(' ')}`),
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

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
  // Add additional headers
  headers: {
    'Accept': 'application/json',
    'Connection': 'keep-alive'
  }
});

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

// Check if the bridge is running
async function checkBridgeStatus(retryCount = 0) {
  try {
    // Always use explicit IPv4 address
    const url = `${API_HOST}/health`;
    logger.debug(`Checking bridge status at ${url}`);
    
    // First try direct curl request for debugging
    if (retryCount === 0) {
      try {
        const { execSync } = require('child_process');
        logger.debug(`Testing direct connection with curl`);
        execSync(`curl -s -v ${url} || echo "Curl failed"`, { encoding: 'utf8', timeout: 5000 });
      } catch (e) {
        logger.debug(`Curl check failed: ${e.message}`);
      }
    }
    
    // Get hostname from URL for DNS resolution test
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check DNS resolution
    await checkDnsResolution(hostname);
    
    logger.debug(`Checking connection to ${hostname}:${urlObj.port}`);
    
    // Try both methods to check bridge status
    let success = false;
    
    // Method 1: Standard axios request
    try {
      const response = await axiosClient.get(url, { 
        timeout: 5000,
        validateStatus: () => true // Accept any status code as response
      });
      
      logger.debug(`Bridge health check HTTP status: ${response.status}`);
      
      if (response.status === 200) {
        logger.info(`Bridge is running at ${url}`);
        return true;
      } else {
        logger.warn(`Bridge returned non-200 status: ${response.status}`);
      }
    } catch (err) {
      logger.warn(`Axios check failed: ${err.message}`);
    }
    
    // Method 2: Try with net.connect
    try {
      const net = require('net');
      const parts = hostname.split(':');
      const host = parts[0];
      const port = parseInt(urlObj.port || 8000);
      
      return new Promise((resolve) => {
        const socket = net.connect({
          host: host,
          port: port,
          family: 4, // Force IPv4
          timeout: 2000
        });
        
        socket.on('connect', () => {
          logger.debug(`Socket connection to ${host}:${port} successful`);
          socket.end();
          resolve(true);
        });
        
        socket.on('error', (err) => {
          logger.debug(`Socket connection failed: ${err.message}`);
          resolve(false);
        });
        
        socket.on('timeout', () => {
          logger.debug(`Socket connection timed out`);
          socket.destroy();
          resolve(false);
        });
      });
    } catch (err) {
      logger.warn(`Socket check failed: ${err.message}`);
    }
    
    // If we get here, both methods failed
    logger.error(`Bridge check failed at ${url}`);
    
    if (retryCount < BRIDGE_CHECK_RETRIES) {
      logger.info(`Retrying bridge health check in ${BRIDGE_CHECK_DELAY/1000} seconds (attempt ${retryCount + 1}/${BRIDGE_CHECK_RETRIES})...`);
      await delay(BRIDGE_CHECK_DELAY);
      return checkBridgeStatus(retryCount + 1);
    }
    
    return false;
  } catch (error) {
    logger.error(`Bridge health check error: ${error.message}`);
    
    if (retryCount < BRIDGE_CHECK_RETRIES) {
      logger.info(`Retrying bridge health check in ${BRIDGE_CHECK_DELAY/1000} seconds (attempt ${retryCount + 1}/${BRIDGE_CHECK_RETRIES})...`);
      await delay(BRIDGE_CHECK_DELAY);
      return checkBridgeStatus(retryCount + 1);
    }
    
    return false;
  }
}

// Scrape jobs function
async function scrapeJobs(site, searchTerm, location = 'any', resultsWanted = 20, retryCount = 0) {
  try {
    logger.info(`Scraping ${site} for "${searchTerm}" in location "${location}"...`);
    
    const url = `${API_HOST}/scrape-jobs`;
    logger.debug(`Sending request to ${url}`);
    
    // Load proxies if enabled
    let proxies = [];
    if (USE_PROXIES) {
      try {
        if (fs.existsSync(PROXIES_FILE)) {
          const proxyText = fs.readFileSync(PROXIES_FILE, 'utf8');
          proxies = proxyText.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));
          logger.info(`Loaded ${proxies.length} proxies from ${PROXIES_FILE}`);
        }
      } catch (error) {
        logger.warn(`Failed to load proxies: ${error.message}`);
      }
    }
    
    const requestBody = {
      site_names: [site],
      search_terms: [searchTerm],
      location: location,
      results_wanted: resultsWanted,
      hours_old: 72,
      is_remote: true,
      distance: keywordsConfig.distance || 50,
      description_format: 'markdown',
      exclude_keywords: keywordsConfig.exclude_keywords || []
    };
    
    // Add proxies if available
    if (USE_PROXIES && proxies.length > 0) {
      requestBody.proxies = proxies;
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
    
    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying in ${RETRY_DELAY/1000} seconds (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(RETRY_DELAY);
      return scrapeJobs(site, searchTerm, location, resultsWanted, retryCount + 1);
    }
    
    return [];
  }
}

// Main function
async function main() {
  console.log(`Starting JobSpy scraper at ${new Date().toUTCString()}`);
  logger.info('Starting mass job scraping operation');
  logger.info(`Using bridge at: ${API_HOST}`);
  logger.info(`Node.js version: ${process.version}`);
  logger.info(`OS: ${process.platform} ${process.arch}`);
  
  // Test localhost resolution
  logger.info('Testing localhost resolution:');
  try {
    const { stdout } = await exec('getent hosts localhost');
    logger.info(stdout.trim());
  } catch (error) {
    logger.warn(`Could not resolve localhost: ${error.message}`);
  }
  
  // Check bridge connection
  logger.info('Checking bridge connection...');
  const isConnected = await checkBridgeStatus();
  
  if (!isConnected) {
    logger.error('Failed to connect to JobSpy bridge. Make sure it is running.');
    process.exit(1);
  }
  
  logger.info('Bridge connection confirmed!');
  
  // Use search combinations from keywords file if available
  let searchCombinations = keywordsConfig.search_combinations || [];
  
  // Fall back to default combinations if no valid ones were loaded
  if (!searchCombinations.length) {
    searchCombinations = [
      { site: 'indeed', term: 'remote data entry', location: 'any' },
      { site: 'indeed', term: 'remote administrative assistant', location: 'any' },
      { site: 'indeed', term: 'virtual assistant', location: 'any' },
      { site: 'linkedin', term: 'remote data entry', location: 'any' },
      { site: 'linkedin', term: 'remote administrative assistant', location: 'any' },
      { site: 'linkedin', term: 'virtual assistant', location: 'any' }
    ];
    logger.warn('Using fallback search combinations as none were loaded from config file');
  }
  
  logger.info(`Using ${searchCombinations.length} search combinations from config`);
  
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
      
      // Apply additional filtering to ensure jobs match our requirements
      const filteredJobs = jobs.filter(job => {
        // Convert job fields to lowercase for case-insensitive matching
        const title = (job.title || '').toLowerCase();
        const description = (job.description || '').toLowerCase();
        
        // Check if job contains at least one required keyword
        const hasRequiredKeyword = !keywordsConfig.required_keywords?.length || 
          keywordsConfig.required_keywords.some(keyword => 
            title.includes(keyword.toLowerCase()) || 
            description.includes(keyword.toLowerCase())
          );
        
        // Verify remote status in description if we have required terms
        const isRemoteVerified = !keywordsConfig.description_required_terms?.length ||
          keywordsConfig.description_required_terms.some(term => 
            description.includes(term.toLowerCase())
          );
        
        return hasRequiredKeyword && isRemoteVerified;
      });
      
      logger.info(`After filtering: ${filteredJobs.length}/${jobs.length} jobs from ${site} matched criteria`);
      
      allJobs.push(...filteredJobs);
      
      if (stats[site]) {
        stats[site].jobs += filteredJobs.length;
      }
      
      // Add random delay before next request
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
  
  console.log(`JobSpy scraper completed at ${new Date().toUTCString()}`);
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error in main: ${error.message}`);
  process.exit(1);
}); 