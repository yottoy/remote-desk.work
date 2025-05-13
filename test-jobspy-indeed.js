const JobSpyIndeedScraper = require('./src/scrapers/JobSpyIndeedScraper');
const fs = require('fs').promises;
const path = require('path');

// Set environment variables directly in the script since we can't edit .env
process.env.ENABLE_JOBSPY_INDEED = 'true';
process.env.JOBSPY_BRIDGE_URL = 'http://localhost:8000';

// Simple logger since we might not have access to the actual logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};

/**
 * Test the JobSpy Indeed scraper
 */
async function testJobSpyIndeed() {
  logger.info('Testing JobSpy Indeed scraper');
  
  // Configure with a limited query and results for testing
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
  
  try {
    // Check if bridge is running
    const bridgeStatus = await scraper.checkBridgeStatus();
    
    if (!bridgeStatus) {
      logger.error('JobSpy bridge is not running. Please start it first:');
      logger.info('Run: cd python-bridge && python3 indeed_bridge.py');
      process.exit(1);
    }
    
    logger.info('JobSpy bridge is running');
    
    // Run the scraper
    const jobs = await scraper.scrape();
    
    logger.info(`Found ${jobs.length} jobs`);
    
    if (jobs.length > 0) {
      logger.info('Sample job:');
      logger.info(`Title: ${jobs[0].title}`);
      logger.info(`Company: ${jobs[0].company}`);
      logger.info(`Location: ${jobs[0].location}`);
      logger.info(`URL: ${jobs[0].url}`);
      
      // Save results to file
      const outputDir = path.join(process.cwd(), 'test-results');
      await fs.mkdir(outputDir, { recursive: true });
      
      const outputPath = path.join(outputDir, 'jobspy-indeed-test.json');
      await fs.writeFile(outputPath, JSON.stringify(jobs, null, 2));
      
      logger.info(`Results saved to ${outputPath}`);
    } else {
      logger.warn('No jobs found');
    }
  } catch (error) {
    logger.error(`Error testing JobSpy Indeed scraper: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
testJobSpyIndeed().catch(console.error); 