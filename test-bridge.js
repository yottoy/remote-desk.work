/**
 * Simple script to test if the JobSpy bridge is running and functioning
 * Run this with: node test-bridge.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Configure logging to a file and console
const logFile = path.join('logs', 'test-bridge.log');
const logsDir = path.dirname(logFile);

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log(`Created directory: ${logsDir}`);
}

// Logger function
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
  }
};

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

// Test function with timeout and retry
async function testBridgeWithRetry(url, maxRetries = 3, timeout = 5000) {
  logger.info(`Testing bridge at ${url} with ${maxRetries} retries...`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempt ${attempt}/${maxRetries}...`);
      
      // Test health endpoint with timeout
      const healthResponse = await axios.get(`${url}/health`, { timeout });
      logger.info(`Health check response (${healthResponse.status}): ${JSON.stringify(healthResponse.data)}`);
      
      if (healthResponse.data.status === 'fallback') {
        logger.error(`Bridge is running in fallback mode: ${healthResponse.data.error}`);
        return false;
      }
      
      // Try a simple job scrape request with minimal parameters
      const testPayload = {
        site_name: 'indeed',
        search_term: 'test job',
        location: 'Remote',
        results_wanted: 1
      };
      
      logger.info(`Testing scrape-jobs with payload: ${JSON.stringify(testPayload)}`);
      
      // Give more time for the actual scrape
      const scrapeResponse = await axios.post(`${url}/scrape-jobs`, testPayload, { 
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      logger.info(`Scrape test result: ${scrapeResponse.status} (${Array.isArray(scrapeResponse.data) ? scrapeResponse.data.length + ' jobs' : 'unknown response'})`);
      
      // If we got here, the bridge is working!
      logger.info('Bridge is functional! 🎉');
      return true;
    } catch (err) {
      const errorMessage = err.response ? 
        `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}` : 
        err.message;
      
      logger.error(`Attempt ${attempt} failed: ${errorMessage}`);
      
      // Check network connectivity
      try {
        logger.info('Testing general network connectivity...');
        await axios.get('https://www.google.com', { timeout: 5000 });
        logger.info('Network connectivity is working');
      } catch (netErr) {
        logger.error(`Network connectivity issue: ${netErr.message}`);
      }
      
      if (attempt < maxRetries) {
        const delay = 1000 * attempt; // Increase delay with each retry
        logger.info(`Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error(`All ${maxRetries} attempts to contact bridge failed`);
  return false;
}

// Print debugging information about the environment
function printEnvironmentInfo() {
  logger.info('=== ENVIRONMENT INFO ===');
  logger.info(`Node version: ${process.version}`);
  logger.info(`Current directory: ${process.cwd()}`);
  logger.info(`Platform: ${process.platform}`);
  
  try {
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      const envLines = envContent.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.trim());
      logger.info(`.env file exists with ${envLines.length} entries`);
    } else {
      logger.info('.env file does not exist');
    }
    
    // Check if bridge process is visible
    const isPosix = process.platform !== 'win32';
    if (isPosix) {
      const { execSync } = require('child_process');
      try {
        const psOutput = execSync('ps aux | grep jobspy_bridge.py', { encoding: 'utf8' });
        logger.info(`JobSpy bridge processes:\n${psOutput}`);
        
        const netstatOutput = execSync('netstat -tuln | grep 8000 || echo "No processes on port 8000"', { encoding: 'utf8' });
        logger.info(`Processes on port 8000:\n${netstatOutput}`);
      } catch (err) {
        logger.error(`Error checking processes: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`Error getting environment info: ${err.message}`);
  }
}

// Main test function
async function main() {
  logger.info('=== STARTING BRIDGE TEST ===');
  printEnvironmentInfo();
  
  const bridgeUrl = await getBridgeUrl();
  logger.info(`Using bridge URL: ${bridgeUrl}`);
  
  const success = await testBridgeWithRetry(bridgeUrl);
  
  if (success) {
    logger.info('Bridge test completed successfully! ✅');
    process.exit(0);
  } else {
    logger.error('Bridge test failed ❌');
    process.exit(1);
  }
}

// Run the test
main().catch(err => {
  logger.error(`Unhandled error: ${err.message}`);
  process.exit(1);
}); 