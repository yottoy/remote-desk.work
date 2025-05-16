// WeWorkRemotely scraper - alternative to Indeed for testing
console.log('=== STARTING WEWORKREMOTELY SCRAPER ===');
console.log(`Current time: ${new Date().toUTCString()}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

// Ensure required directories exist
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
require('dotenv').config();

// Create directories if they don't exist
const dirs = ['logs', 'results'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Configure logging
const logFile = path.join('logs', 'weworkremotely-scraper.log');
const logger = {
  info: (...args) => {
    const msg = `INFO: ${args.join(' ')}`;
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
  },
  error: (...args) => {
    const msg = `ERROR: ${args.join(' ')}`;
    console.error(msg);
    fs.appendFileSync(logFile, msg + '\n');
  },
  warn: (...args) => {
    const msg = `WARNING: ${args.join(' ')}`;
    console.warn(msg);
    fs.appendFileSync(logFile, msg + '\n');
  }
};

// Configuration
const BRIDGE_URL = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';
const RESULTS_FILE = 'weworkremotely-results.json';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Load admin and data entry keywords
let keywords = {};
try {
  if (fs.existsSync('admin-data-entry-keywords.json')) {
    keywords = JSON.parse(fs.readFileSync('admin-data-entry-keywords.json', 'utf8'));
    logger.info(`Loaded ${Object.keys(keywords).length} keyword categories`);
  } else {
    // Create default keywords file if it doesn't exist
    keywords = {
      "admin": ["administrative", "admin", "assistant", "data entry", "virtual assistant", "receptionist", "secretary", "office", "clerical"],
      "remote": ["remote", "work from home", "wfh", "virtual", "telecommute", "hybrid"],
      "exclude": ["senior", "manager", "director", "head", "lead", "supervisor", "sales", "marketing", "engineer", "developer", "architect"]
    };
    fs.writeFileSync('admin-data-entry-keywords.json', JSON.stringify(keywords, null, 2));
    logger.info('Created default keywords file');
  }
} catch (err) {
  logger.error(`Error loading keywords: ${err.message}`);
  process.exit(1);
}

// Format search terms for WeWorkRemotely (simpler than Indeed)
function formatWWRSearchTerm(keywords) {
  try {
    // WeWorkRemotely has simpler search requirements
    // Just use admin keywords directly
    return keywords.admin.slice(0, 3).join(' ');
  } catch (err) {
    logger.error(`Error formatting search term: ${err.message}`);
    return "administrative assistant data entry";
  }
}

// Get the bridge URL from environment or check the port file
async function getBridgeUrl() {
  let bridgeUrl = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';
  
  // Check if there's a port file indicating a dynamic port was used
  try {
    if (fs.existsSync('jobspy_bridge_port.txt')) {
      const port = fs.readFileSync('jobspy_bridge_port.txt', 'utf8').trim();
      if (port) {
        logger.info(`Found alternative port file with port: ${port}`);
        bridgeUrl = `http://127.0.0.1:${port}`;
      }
    }
  } catch (err) {
    logger.error(`Error reading port file: ${err.message}`);
  }
  
  return bridgeUrl;
}

// Check if bridge is running
async function checkBridge(url) {
  try {
    const response = await axios.get(`${url}/health`);
    if (response.status === 200) {
      logger.info('Bridge is running');
      if (response.data.status === 'fallback') {
        logger.warn(`Bridge is running in fallback mode: ${response.data.error}`);
        return 'fallback';
      }
      return true;
    }
  } catch (err) {
    logger.error(`Bridge check failed: ${err.message}`);
    return false;
  }
}

// Retry function with exponential backoff
async function retryOperation(operation, maxRetries, initialDelay) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const delay = initialDelay * Math.pow(2, attempt - 1);
      logger.warn(`Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Main function to scrape WeWorkRemotely jobs
async function scrapeWWRJobs() {
  logger.info('Starting WeWorkRemotely scraper');
  
  // Format search term for WWR
  const searchTerm = formatWWRSearchTerm(keywords);
  logger.info(`Using search term: ${searchTerm}`);
  
  // WeWorkRemotely parameters are simpler than Indeed
  const params = {
    site_name: 'weworkremotely',
    search_term: searchTerm,
    results_wanted: 20
  };
  
  logger.info(`Scrape parameters: ${JSON.stringify(params)}`);
  
  try {
    // Get bridge URL (handles dynamic port allocation)
    const bridgeUrl = await getBridgeUrl();
    logger.info(`Using bridge URL: ${bridgeUrl}`);
    
    // Check if bridge is running
    const bridgeStatus = await checkBridge(bridgeUrl);
    if (bridgeStatus === false) {
      throw new Error('JobSpy bridge is not running');
    } else if (bridgeStatus === 'fallback') {
      logger.warn('JobSpy bridge is in fallback mode. Results may be empty.');
    }
    
    // Make the API call with retries
    const response = await retryOperation(async () => {
      return await axios.post(`${bridgeUrl}/scrape-jobs`, params, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000 // 60 seconds timeout
      });
    }, MAX_RETRIES, RETRY_DELAY);
    
    // Process results
    const jobs = response.data;
    logger.info(`Found ${jobs.length} jobs`);
    
    // Calculate stats about the results
    const stats = {
      total: jobs.length,
      withSalary: jobs.filter(job => job.salary?.min_amount || job.salary?.max_amount).length,
      remote: jobs.filter(job => job.is_remote).length
    };
    
    // Save results
    const resultsWithMetadata = {
      source: 'weworkremotely',
      scrape_date: new Date().toISOString(),
      parameters: params,
      stats: stats,
      jobs: jobs
    };
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(resultsWithMetadata, null, 2));
    logger.info(`Saved ${jobs.length} jobs to ${RESULTS_FILE}`);
    
    return jobs;
  } catch (err) {
    logger.error(`Error scraping WeWorkRemotely jobs: ${err.message}`);
    
    // Create an empty results file with error information
    const errorResult = {
      source: 'weworkremotely',
      scrape_date: new Date().toISOString(),
      error: err.message,
      jobs: []
    };
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(errorResult, null, 2));
    logger.info(`Created empty results file with error information`);
    
    throw err;
  }
}

// Run the scraper
(async () => {
  try {
    const jobs = await scrapeWWRJobs();
    logger.info('WeWorkRemotely scraper completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error(`WeWorkRemotely scraper failed: ${err.message}`);
    
    // Try to get some diagnostic information
    logger.info('Collecting diagnostics...');
    
    try {
      // Check Python and dependencies
      const pythonVersion = execSync('python --version', { encoding: 'utf8' });
      logger.info(`Python version: ${pythonVersion.trim()}`);
      
      // Check if bridge process is running
      const psOutput = execSync('ps aux | grep jobspy_bridge.py', { encoding: 'utf8' });
      logger.info(`Bridge process: ${psOutput.includes('python') ? 'Running' : 'Not running'}`);
      
      // Check network connections
      const netstatOutput = execSync('netstat -tuln | grep 8000 || echo "Port 8000 not found"', { encoding: 'utf8' });
      logger.info(`Port status: ${netstatOutput.trim()}`);
      
      // Check port file
      if (fs.existsSync('jobspy_bridge_port.txt')) {
        const portContent = fs.readFileSync('jobspy_bridge_port.txt', 'utf8').trim();
        logger.info(`Port file exists with content: ${portContent}`);
      } else {
        logger.info('No port file found');
      }
    } catch (diagErr) {
      logger.error(`Error collecting diagnostics: ${diagErr.message}`);
    }
    
    // Exit with error code
    process.exit(1);
  }
})(); 