/**
 * Comprehensive test for JobSpy integration
 * 
 * This script tests:
 * 1. Bridge manager initialization
 * 2. Bridge starting automatically
 * 3. Scraper with error handling
 * 4. Bridge monitoring
 */

require('dotenv').config();
const JobSpyIndeedScraper = require('./src/scrapers/JobSpyIndeedScraper');
const bridgeManager = require('./src/utils/bridgeManager');
const fs = require('fs').promises;
const path = require('path');

// Force enable JobSpy for testing
process.env.ENABLE_JOBSPY_INDEED = 'true';
process.env.JOBSPY_BRIDGE_URL = 'http://localhost:8000';

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  debug: (msg) => console.debug(`[DEBUG] ${msg}`)
};

/**
 * Test bridge manager
 */
async function testBridgeManager() {
  logger.info('=== Testing Bridge Manager ===');
  
  // Start bridge with monitoring
  logger.info('Starting bridge...');
  const started = await bridgeManager.start();
  
  if (!started) {
    logger.error('Failed to start bridge');
    return false;
  }
  
  logger.info('Bridge started successfully');
  bridgeManager.startMonitoring(10000); // Monitor every 10 seconds
  
  // Check status
  logger.info('Checking bridge status...');
  const status = await bridgeManager.checkStatus();
  
  if (!status) {
    logger.error('Bridge is not running');
    return false;
  }
  
  logger.info('Bridge is running correctly');
  return true;
}

/**
 * Test the JobSpy Indeed scraper
 */
async function testJobSpyScraper() {
  logger.info('=== Testing JobSpy Indeed Scraper ===');
  
  // Configure with limited query for testing
  const testConfig = {
    enabled: true,
    queries: ['remote data entry'],
    location: 'Remote',
    country: 'USA',
    resultsWanted: 5,
    hoursOld: 72,
    isRemote: true
  };
  
  // Initialize the scraper
  const scraper = new JobSpyIndeedScraper();
  
  // Override config for testing
  scraper.jobspyConfig = testConfig;
  scraper.queries = testConfig.queries;
  scraper.location = testConfig.location;
  scraper.country = testConfig.country;
  scraper.resultsWanted = testConfig.resultsWanted;
  scraper.hoursOld = testConfig.hoursOld;
  scraper.isRemote = testConfig.isRemote;
  
  // Run the scraper
  logger.info('Running scraper...');
  const jobs = await scraper.scrape();
  
  logger.info(`Found ${jobs.length} jobs`);
  
  if (jobs.length > 0) {
    logger.info('Scraper working correctly');
    
    // Save a sample job
    logger.info('Sample job:');
    logger.info(`Title: ${jobs[0].title}`);
    logger.info(`Company: ${jobs[0].company}`);
    logger.info(`Location: ${jobs[0].location}`);
    
    // Save results to file
    const outputDir = path.join(process.cwd(), 'test-results');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, 'jobspy-integration-test.json');
    await fs.writeFile(outputPath, JSON.stringify(jobs, null, 2));
    
    logger.info(`Results saved to ${outputPath}`);
    return true;
  } else {
    logger.warn('No jobs found - this could be normal or indicate an issue');
    return false;
  }
}

/**
 * Run the integration test
 */
async function runIntegrationTest() {
  logger.info('Starting JobSpy integration test');
  
  try {
    // Step 1: Test bridge manager
    const bridgeOk = await testBridgeManager();
    if (!bridgeOk) {
      throw new Error('Bridge manager test failed');
    }
    
    // Step 2: Test JobSpy scraper
    const scraperOk = await testJobSpyScraper();
    if (!scraperOk) {
      logger.warn('Scraper returned no jobs - this may or may not indicate an issue');
    }
    
    // Allow time for monitoring to run
    logger.info('Waiting 15 seconds to observe bridge monitoring...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    logger.info('Integration test completed successfully');
  } catch (error) {
    logger.error(`Integration test failed: ${error.message}`);
  } finally {
    // Clean up
    logger.info('Stopping bridge...');
    bridgeManager.stop();
    logger.info('Test completed');
  }
}

// Run the test
runIntegrationTest().catch(console.error); 