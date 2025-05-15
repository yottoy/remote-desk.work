// Import required modules
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Import our custom utils
const ProxyRotator = require('./src/utils/ProxyRotator');
const JobFilter = require('./src/utils/JobFilter');

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
const USE_PROXIES = process.env.USE_PROXIES === 'true' || true; // Default to using proxies

// Configure logger
const logger = {
  debug: (...args) => console.debug(`DEBUG: ${args.join(' ')}`),
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Initialize our utilities
const proxyRotator = new ProxyRotator({
  proxyFile: PROXIES_FILE,
  enabled: USE_PROXIES,
  strategy: 'per_query',
  logger: logger
});

const jobFilter = new JobFilter({
  keywordsFile: KEYWORDS_FILE,
  strictMode: true,
  minDescriptionWords: 50,
  logger: logger
});

// Load scraper schedule configuration
let scraperSchedule = {};
try {
  const schedulePath = path.join(__dirname, 'scraper-schedule.json');
  scraperSchedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
  logger.info(`Loaded scraper schedule configuration`);
} catch (error) {
  logger.error(`Failed to load scraper schedule file: ${error.message}`);
  scraperSchedule = { 
    limits: {
      max_requests_per_hour: {
        indeed: 8,
        linkedin: 6,
        weworkremotely: 10
      },
      delay_between_queries_ms: {
        indeed: 8000,
        linkedin: 10000,
        weworkremotely: 5000
      }
    }
  };
}

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

// Get site-specific delay based on configuration
function getSiteDelay(site) {
  // Use site-specific delay if available in config, otherwise use default
  if (scraperSchedule?.limits?.delay_between_queries_ms?.[site]) {
    return scraperSchedule.limits.delay_between_queries_ms[site];
  }
  return DELAY_BETWEEN_REQUESTS;
}

// Scrape jobs function
async function scrapeJobs(site, searchTerm, location = 'any', resultsWanted = 20, retryCount = 0) {
  try {
    logger.info(`Scraping ${site} for "${searchTerm}" in location "${location}"...`);
    
    const url = `${API_HOST}/scrape-jobs`;
    logger.debug(`Sending request to ${url}`);
    
    // Get a proxy for this request if enabled
    const proxy = proxyRotator.getProxy(site, `${site}-${searchTerm}`);
    if (proxy) {
      logger.info(`Using proxy: ${proxy} for ${site}`);
    }
    
    const payload = {
      site_name: site,
      search_term: searchTerm,
      location: location,
      results_wanted: resultsWanted,
      hours_old: 72, // Last 3 days
      is_remote: true
    };
    
    // Add proxy if available
    if (proxy) {
      payload.proxies = [proxy];
    }
    
    logger.debug(`Request payload: ${JSON.stringify(payload)}`);
    
    const response = await axiosClient.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      const jobs = response.data || [];
      logger.info(`Successfully scraped ${jobs.length} jobs from ${site} for "${searchTerm}"`);
      
      // Apply filtering to the jobs
      const filteredJobs = jobFilter.filterJobs(jobs);
      logger.info(`Filtered to ${filteredJobs.length} relevant jobs from ${site} for "${searchTerm}"`);
      
      return filteredJobs;
    } else {
      logger.warn(`Received non-200 status: ${response.status}`);
      
      if (proxy) {
        // Mark proxy as failing
        proxyRotator.markProxyFailure(proxy, site);
      }
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        const retryMs = RETRY_DELAY * Math.pow(2, retryCount);
        logger.info(`Retrying ${site} scrape in ${retryMs/1000} seconds (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await delay(retryMs);
        return scrapeJobs(site, searchTerm, location, resultsWanted, retryCount + 1);
      } else {
        logger.error(`Maximum retry attempts (${MAX_RETRIES}) reached for ${site} scrape.`);
        return [];
      }
    }
  } catch (error) {
    logger.error(`Error scraping ${site}: ${error.message}`);
    
    // Retry logic
    if (retryCount < MAX_RETRIES) {
      const retryMs = RETRY_DELAY * Math.pow(2, retryCount);
      logger.info(`Retrying ${site} scrape in ${retryMs/1000} seconds (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await delay(retryMs);
      return scrapeJobs(site, searchTerm, location, resultsWanted, retryCount + 1);
    } else {
      logger.error(`Maximum retry attempts (${MAX_RETRIES}) reached for ${site} scrape.`);
      return [];
    }
  }
}

// Main function
async function main() {
  console.log(`Starting JobSpy Admin/Data Entry Scraper at ${new Date().toUTCString()}`);
  
  try {
    // Check if bridge is running
    const bridgeRunning = await checkBridgeStatus();
    if (!bridgeRunning) {
      throw new Error('JobSpy bridge is not running. Make sure to start the bridge with "python3 jobspy_bridge.py"');
    }
    
    // Get search combinations from keywords file
    const searchCombinations = keywordsConfig.search_combinations || [];
    if (searchCombinations.length === 0) {
      logger.warn('No search combinations found in keywords file. Using default searches.');
      searchCombinations.push(
        { term: 'remote data entry', site: 'indeed', location: 'Remote' },
        { term: 'remote administrative assistant', site: 'linkedin', location: 'Remote' },
        { term: 'virtual assistant', site: 'weworkremotely', location: '' }
      );
    }
    
    // Arrays to store all jobs
    const allJobs = [];
    
    // Track which sites we're using
    const sitesUsed = new Set();
    
    // Execute searches sequentially to avoid overloading the bridge
    for (const search of searchCombinations) {
      const site = search.site || 'indeed';
      sitesUsed.add(site);
      
      // Get site-specific delay
      const siteDelay = getSiteDelay(site);
      logger.debug(`Using ${siteDelay}ms delay for ${site}`);
      
      // Execute the search
      const jobs = await scrapeJobs(
        site,
        search.term,
        search.location || 'Remote',
        search.results_wanted || 20
      );
      
      // Add metadata
      const jobsWithMeta = jobs.map(job => ({
        ...job,
        search_term: search.term,
        site_source: site,
        scraped_date: new Date().toISOString()
      }));
      
      // Add to our collection
      allJobs.push(...jobsWithMeta);
      
      // Delay between requests to avoid rate limiting
      await delay(randomDelay(siteDelay));
    }
    
    // Log search stats
    logger.info(`Completed ${searchCombinations.length} searches across ${sitesUsed.size} sites`);
    logger.info(`Total jobs found: ${allJobs.length}`);
    
    // Get filtering statistics
    const filterStats = jobFilter.getStats();
    logger.info(`Filtering stats: ${filterStats.accepted} accepted, ${filterStats.rejected} rejected (${Math.round(filterStats.passRate * 100)}% pass rate)`);
    
    // Log rejection reasons if available
    if (filterStats.rejectionReasons) {
      logger.info('Top rejection reasons:');
      Object.entries(filterStats.rejectionReasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([reason, count]) => {
          logger.info(`  ${reason}: ${count} jobs`);
        });
    }
    
    // Write results to file
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(allJobs, null, 2));
    logger.info(`Wrote ${allJobs.length} jobs to ${RESULTS_FILE}`);
    
    console.log(`JobSpy Scraper completed at ${new Date().toUTCString()}`);
  } catch (error) {
    logger.error(`Error in main: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 