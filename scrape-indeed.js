// Enhanced Indeed scraper using the JobSpyIndeedScraper module
console.log('=== STARTING ENHANCED INDEED SCRAPER ===');
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
const logFile = path.join('logs', 'indeed-scraper.log');
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
const RESULTS_FILE = 'indeed-results.json';
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

// Format search terms according to Indeed best practices
function formatIndeedSearchTerm(keywords) {
  try {
    // Exact phrases for job titles
    const titleTerms = keywords.admin.slice(0, 3).map(term => `"${term}"`).join(' OR ');
    
    // Required skills/keywords
    const skillTerms = keywords.admin.slice(3).join(' OR ');
    
    // Remote work terms
    const remoteTerms = keywords.remote.slice(0, 3).join(' OR ');
    
    // Terms to exclude
    const excludeTerms = keywords.exclude.map(term => `-${term}`).join(' ');
    
    // Final formatted search term
    return `(${titleTerms}) (${skillTerms}) (${remoteTerms}) ${excludeTerms}`;
  } catch (err) {
    logger.error(`Error formatting search term: ${err.message}`);
    return "administrative data entry remote";
  }
}

// Check if bridge is running
async function checkBridge() {
  try {
    const response = await axios.get(`${BRIDGE_URL}/health`);
    if (response.status === 200) {
      logger.info('Bridge is running');
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

// Main function to scrape Indeed jobs
async function scrapeIndeedJobs() {
  logger.info('Starting Indeed scraper');
  
  // Format search term using best practices
  const searchTerm = formatIndeedSearchTerm(keywords);
  logger.info(`Using search term: ${searchTerm}`);
  
  // Because Indeed has mutually exclusive parameters, we need to decide which ones to use
  // Priority: job_type & is_remote > hours_old > easy_apply
  const params = {
    site_name: 'indeed',
    search_term: searchTerm,
    location: 'Remote',
    country_indeed: 'USA',
    results_wanted: 30,
    job_type: 'fulltime',
    is_remote: true
    // Explicitly NOT using hours_old or easy_apply due to Indeed limitations
  };
  
  logger.info(`Scrape parameters: ${JSON.stringify(params)}`);
  
  try {
    // Check if bridge is running
    const bridgeRunning = await checkBridge();
    if (!bridgeRunning) {
      throw new Error('JobSpy bridge is not running');
    }
    
    // Make the API call with retries
    const response = await retryOperation(async () => {
      return await axios.post(`${BRIDGE_URL}/scrape-jobs`, params, {
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
      source: 'indeed',
      scrape_date: new Date().toISOString(),
      parameters: params,
      stats: stats,
      jobs: jobs
    };
    
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(resultsWithMetadata, null, 2));
    logger.info(`Saved ${jobs.length} jobs to ${RESULTS_FILE}`);
    
    return jobs;
  } catch (err) {
    logger.error(`Error scraping Indeed jobs: ${err.message}`);
    
    // Create an empty results file with error information
    const errorResult = {
      source: 'indeed',
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
    const jobs = await scrapeIndeedJobs();
    logger.info('Indeed scraper completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error(`Indeed scraper failed: ${err.message}`);
    
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
    } catch (diagErr) {
      logger.error(`Error collecting diagnostics: ${diagErr.message}`);
    }
    
    // Exit with error code
    process.exit(1);
  }
})(); 