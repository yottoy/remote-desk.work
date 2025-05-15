/**
 * JobSpy Integration Test
 * 
 * This script tests the integration between the job scraper and the JobSpy bridge.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const childProcess = require('child_process');
const util = require('util');
const exec = util.promisify(childProcess.exec);

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};

/**
 * Check if the JobSpy bridge is running
 */
async function checkBridgeStatus() {
  try {
    const response = await axios.get('http://127.0.0.1:8000/health', { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Run a test for the Indeed scraper
 */
async function testIndeedScraper() {
  logger.info('Testing Indeed scraper integration with JobSpy bridge');
  
  // Step 1: Check if bridge is running
  logger.info('Checking if JobSpy bridge is running...');
  const bridgeRunning = await checkBridgeStatus();
  
  if (!bridgeRunning) {
    logger.info('Bridge is not running, starting it...');
    try {
      // First try to start the bridge using the manager
      const { stdout, stderr } = await exec('node python-bridge/start-bridge.js');
      logger.info('Bridge starter output:');
      if (stdout) logger.info(stdout);
      if (stderr) logger.error(stderr);
      
      // Wait 5 seconds for bridge to start
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check again
      const bridgeStarted = await checkBridgeStatus();
      if (!bridgeStarted) {
        logger.error('Failed to start bridge');
        return false;
      }
      logger.info('Bridge started successfully');
    } catch (error) {
      logger.error(`Error starting bridge: ${error.message}`);
      return false;
    }
  } else {
    logger.info('Bridge is already running');
  }
  
  // Step 2: Run the Indeed scraper
  logger.info('Running Indeed scraper...');
  try {
    const { stdout, stderr } = await exec('node scrape-indeed.js', { timeout: 60000 });
    logger.info('Indeed scraper output:');
    if (stdout) logger.info(stdout);
    if (stderr) logger.error(stderr);
    
    // Step 3: Check if results were generated
    if (fs.existsSync('indeed-results.json')) {
      try {
        const results = JSON.parse(fs.readFileSync('indeed-results.json', 'utf8'));
        logger.info(`Found ${results.length} job results`);
        return results.length > 0;
      } catch (error) {
        logger.error(`Error parsing results: ${error.message}`);
        return false;
      }
    } else {
      logger.error('No results file was generated');
      return false;
    }
  } catch (error) {
    logger.error(`Error running Indeed scraper: ${error.message}`);
    return false;
  }
}

/**
 * Run the integration test
 */
async function runTest() {
  try {
    logger.info('Starting JobSpy integration test');
    const indeedTestResult = await testIndeedScraper();
    
    if (indeedTestResult) {
      logger.info('✅ Indeed scraper test passed!');
    } else {
      logger.error('❌ Indeed scraper test failed!');
    }
  } catch (error) {
    logger.error(`Error in test: ${error.message}`);
    logger.error(error.stack);
  }
}

// Run the test
runTest().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
}); 