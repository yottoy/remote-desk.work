const WorkewScraper = require('./src/scrapers/WorkewScraper');
const qualityFilter = require('./src/utils/qualityFilter');
const database = require('./src/utils/database');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./src/utils/logger');

/**
 * Test script to scrape Workew.com
 */
async function testWorkewScraper() {
  try {
    logger.info('Starting Workew.com scraper test');
    
    // Initialize database (will use in-memory if MongoDB unavailable)
    await database.connect();
    logger.info('Database initialized');
    
    // Create results directory
    const resultsDir = path.join(process.cwd(), 'workew-results');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (err) {
      logger.debug(`Error creating results directory: ${err.message}`);
    }
    
    // Initialize the scraper
    const scraper = new WorkewScraper();
    
    // Run the scraper
    const jobs = await scraper.scrape();
    logger.info(`Scraped ${jobs.length} jobs from Workew.com`);
    
    // Apply quality filter
    const filteredJobs = qualityFilter.filterJobs(jobs);
    logger.info(`After quality filtering: ${filteredJobs.length} jobs remain`);
    
    // Save results to file
    const rawResultsPath = path.join(resultsDir, 'workew-raw-results.json');
    const filteredResultsPath = path.join(resultsDir, 'workew-filtered-results.json');
    
    await fs.writeFile(rawResultsPath, JSON.stringify(jobs, null, 2));
    await fs.writeFile(filteredResultsPath, JSON.stringify(filteredJobs, null, 2));
    
    logger.info(`Raw results saved to ${rawResultsPath}`);
    logger.info(`Filtered results saved to ${filteredResultsPath}`);
    
    // Disconnect from database
    await database.disconnect();
    logger.info('Database disconnected');
    
    return filteredJobs;
  } catch (error) {
    logger.error(`Error in Workew test: ${error.message}`);
    if (database.isConnected()) {
      await database.disconnect();
    }
    throw error;
  }
}

// Run the test function
testWorkewScraper()
  .then(jobs => {
    logger.info(`Successfully completed Workew scraper test with ${jobs.length} filtered jobs`);
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Failed to complete Workew scraper test: ${error.message}`);
    process.exit(1);
  }); 