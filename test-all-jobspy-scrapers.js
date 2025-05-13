/**
 * Test All JobSpy Scrapers
 * 
 * This script runs all JobSpy scrapers to test their functionality
 */

require('dotenv').config();
const bridgeManager = require('./src/utils/bridgeManager');
const JobSpyIndeedScraper = require('./src/scrapers/JobSpyIndeedScraper');
const JobSpyLinkedInScraper = require('./src/scrapers/JobSpyLinkedInScraper');
const JobSpyGlassdoorScraper = require('./src/scrapers/JobSpyGlassdoorScraper');
const JobSpyGoogleScraper = require('./src/scrapers/JobSpyGoogleScraper');
const JobSpyZipRecruiterScraper = require('./src/scrapers/JobSpyZipRecruiterScraper');
const JobSpyBaytScraper = require('./src/scrapers/JobSpyBaytScraper');
const JobSpyNaukriScraper = require('./src/scrapers/JobSpyNaukriScraper');
const fs = require('fs').promises;
const path = require('path');

// Force enable all JobSpy scrapers for testing
process.env.ENABLE_JOBSPY_INDEED = 'true';
process.env.ENABLE_JOBSPY_LINKEDIN = 'true';
process.env.ENABLE_JOBSPY_GLASSDOOR = 'true';
process.env.ENABLE_JOBSPY_GOOGLE = 'true';
process.env.ENABLE_JOBSPY_ZIPRECRUITER = 'true';
process.env.ENABLE_JOBSPY_BAYT = 'true';
process.env.ENABLE_JOBSPY_NAUKRI = 'true';

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  debug: (msg) => console.debug(`[DEBUG] ${msg}`)
};

// Create all scraper instances
const scrapers = [
  new JobSpyIndeedScraper(),
  new JobSpyLinkedInScraper(),
  new JobSpyGlassdoorScraper(),
  new JobSpyGoogleScraper(),
  new JobSpyZipRecruiterScraper(),
  new JobSpyBaytScraper(),
  new JobSpyNaukriScraper()
];

// Set limited search for testing
scrapers.forEach(scraper => {
  scraper.queries = ['remote data entry'];
  scraper.resultsWanted = 5;
});

/**
 * Test a single scraper
 * @param {Object} scraper - Scraper instance to test
 */
async function testScraper(scraper) {
  logger.info(`Testing ${scraper.name} scraper...`);
  
  try {
    // Run the scraper
    const jobs = await scraper.scrape();
    
    logger.info(`Found ${jobs.length} jobs from ${scraper.name}`);
    
    if (jobs.length === 0) {
      logger.warn(`No jobs found from ${scraper.name}`);
      return { 
        name: scraper.name, 
        success: false, 
        jobCount: 0, 
        error: 'No jobs found' 
      };
    }
    
    // Save job sample to file for inspection
    const outputDir = path.join(process.cwd(), 'test-results');
    await fs.mkdir(outputDir, { recursive: true });
    
    const samplePath = path.join(outputDir, `${scraper.name.toLowerCase()}-sample.json`);
    await fs.writeFile(samplePath, JSON.stringify(jobs[0], null, 2));
    logger.info(`Saved sample job from ${scraper.name} to ${samplePath}`);
    
    return { 
      name: scraper.name, 
      success: true, 
      jobCount: jobs.length 
    };
  } catch (error) {
    logger.error(`Error testing ${scraper.name} scraper: ${error.message}`);
    return { 
      name: scraper.name, 
      success: false, 
      jobCount: 0,
      error: error.message 
    };
  }
}

/**
 * Run all scraper tests
 */
async function runTests() {
  try {
    logger.info('Starting JobSpy scrapers test');
    
    // 1. Start bridge
    logger.info('Starting JobSpy bridge...');
    const bridgeStarted = await bridgeManager.start();
    
    if (!bridgeStarted) {
      throw new Error('Failed to start JobSpy bridge');
    }
    
    bridgeManager.startMonitoring(15000);
    logger.info('JobSpy bridge started and monitoring enabled');
    
    // 2. Test each scraper
    const results = [];
    
    for (const scraper of scrapers) {
      const result = await testScraper(scraper);
      results.push(result);
    }
    
    // 3. Save results to file
    await saveResultsToFile(results);
    
    // 4. Output summary
    logger.info('JobSpy scrapers test completed');
    
    const successCount = results.filter(r => r.success).length;
    logger.info(`Summary: ${successCount}/${results.length} scrapers successful`);
    
    for (const result of results) {
      if (result.success) {
        logger.info(`✅ ${result.name}: ${result.jobCount} jobs found`);
      } else {
        logger.error(`❌ ${result.name}: ${result.error}`);
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    return false;
  } finally {
    // Clean up
    logger.info('Stopping bridge...');
    await bridgeManager.stop();
    
    logger.info('Test cleanup completed');
  }
}

/**
 * Save results to file
 * @param {Array} results - Test results
 */
async function saveResultsToFile(results) {
  try {
    // Create results directory if it doesn't exist
    const resultsDir = path.join(process.cwd(), 'test-results');
    await fs.mkdir(resultsDir, { recursive: true });
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
    const filename = path.join(resultsDir, `scraper-test-${timestamp}.json`);
    
    // Write results to file
    await fs.writeFile(filename, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: results
    }, null, 2));
    
    logger.info(`Test results saved to ${filename}`);
  } catch (error) {
    logger.error(`Error saving results to file: ${error.message}`);
  }
}

// Run the tests
runTests()
  .then(success => {
    if (success) {
      logger.info('All tests completed');
      process.exit(0);
    } else {
      logger.error('Test run failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  }); 