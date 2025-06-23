const OnlineJobsPhScraper = require('../src/scrapers/OnlineJobsPhScraper');
const logger = require('../src/utils/logger');

async function testOnlineJobsPhScraper() {
  logger.info('Starting OnlineJobs.ph scraper test');
  
  const scraper = new OnlineJobsPhScraper({
    headless: false, // Set to true for production
    timeout: 60000
  });

  try {
    const jobs = await scraper.scrape();
    
    logger.info(`Test completed. Found ${jobs.length} jobs`);
    
    if (jobs.length > 0) {
      logger.info('Sample jobs:');
      jobs.slice(0, 3).forEach((job, index) => {
        logger.info(`\n--- Job ${index + 1} ---`);
        logger.info(`Title: ${job.title}`);
        logger.info(`Company: ${job.company}`);
        logger.info(`Location: ${job.location}`);
        logger.info(`URL: ${job.url}`);
        logger.info(`Salary: ${job.salary || 'Not specified'}`);
        logger.info(`Posted: ${job.postedDate}`);
        logger.info(`Is Remote: ${job.isRemote}`);
        logger.info(`Description: ${job.description.substring(0, 200)}...`);
      });
    }
    
    // Save results to file
    const fs = require('fs');
    const path = require('path');
    
    const resultsDir = path.join(__dirname, '../results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `onlinejobs-test-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(jobs, null, 2));
    logger.info(`Results saved to: ${filepath}`);
    
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    logger.error(error.stack);
  }
}

// Run the test
if (require.main === module) {
  testOnlineJobsPhScraper()
    .then(() => {
      logger.info('Test completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Test failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = testOnlineJobsPhScraper; 