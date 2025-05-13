const IndeedScraper = require('./src/scrapers/IndeedScraper');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./src/utils/logger');
const qualityFilter = require('./src/utils/qualityFilter');

/**
 * Test the Indeed scraper
 */
async function testIndeedScraper() {
  try {
    logger.info('Testing Indeed Scraper');
    
    // Initialize the scraper
    const scraper = new IndeedScraper();
    
    // Run the scrape
    const jobs = await scraper.scrape();
    logger.info(`Found ${jobs.length} jobs from Indeed`);
    
    // Apply quality filter
    const filteredJobs = qualityFilter.filterJobs(jobs);
    logger.info(`After quality filtering: ${filteredJobs.length} jobs remain`);
    
    // Create results directory
    const resultsDir = path.join(process.cwd(), 'indeed-results');
    await fs.mkdir(resultsDir, { recursive: true });
    
    // Save raw results
    const rawResultsPath = path.join(resultsDir, 'indeed-raw-results.json');
    await fs.writeFile(rawResultsPath, JSON.stringify(jobs, null, 2));
    logger.info(`Raw results saved to ${rawResultsPath}`);
    
    // Save filtered results
    const filteredResultsPath = path.join(resultsDir, 'indeed-filtered-results.json');
    await fs.writeFile(filteredResultsPath, JSON.stringify(filteredJobs, null, 2));
    logger.info(`Filtered results saved to ${filteredResultsPath}`);
    
    // Generate a summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalJobs: jobs.length,
      filteredJobs: filteredJobs.length,
      rejectionStats: qualityFilter.getRejectionStats()
    };
    
    const summaryPath = path.join(resultsDir, 'indeed-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    logger.info(`Summary saved to ${summaryPath}`);
    
    logger.info('Test completed successfully');
    return {
      jobs,
      filteredJobs,
      summary
    };
  } catch (error) {
    logger.error(`Error testing Indeed scraper: ${error.message}`);
    throw error;
  }
}

// Run the test
testIndeedScraper()
  .then(result => {
    logger.info(`Test completed with ${result.jobs.length} total jobs and ${result.filteredJobs.length} filtered jobs`);
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Test failed: ${error.message}`);
    process.exit(1);
  }); 