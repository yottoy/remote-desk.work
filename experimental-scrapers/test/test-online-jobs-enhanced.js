const OnlineJobsPhScraper = require('../src/scrapers/OnlineJobsPhScraper');
const logger = require('../src/utils/logger');

async function testOnlineJobsPhScraperEnhanced() {
  logger.info('Starting Enhanced OnlineJobs.ph scraper test with pagination');
  
  const scraper = new OnlineJobsPhScraper({
    headless: true, // Set to false for debugging
    timeout: 60000,
    maxPages: 5 // Start with 5 pages (150 jobs) for testing
  });

  try {
    const startTime = Date.now();
    const jobs = await scraper.scrape();
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    logger.info(`Test completed in ${duration} seconds. Found ${jobs.length} jobs`);
    
    if (jobs.length > 0) {
      // Show statistics
      const remoteJobs = jobs.filter(job => job.isRemote);
      const withSalary = jobs.filter(job => job.salary && job.salary.length > 0);
      const withUrl = jobs.filter(job => job.url && job.url.length > 0);
      
      logger.info(`\n=== Statistics ===`);
      logger.info(`Total jobs: ${jobs.length}`);
      logger.info(`Remote jobs: ${remoteJobs.length} (${Math.round(remoteJobs.length / jobs.length * 100)}%)`);
      logger.info(`Jobs with salary: ${withSalary.length} (${Math.round(withSalary.length / jobs.length * 100)}%)`);
      logger.info(`Jobs with URL: ${withUrl.length} (${Math.round(withUrl.length / jobs.length * 100)}%)`);
      
      logger.info('\n=== Sample jobs ===');
      jobs.slice(0, 5).forEach((job, index) => {
        logger.info(`\n--- Job ${index + 1} ---`);
        logger.info(`Title: ${job.title}`);
        logger.info(`Company: ${job.company}`);
        logger.info(`Location: ${job.location}`);
        logger.info(`URL: ${job.url || 'No URL'}`);
        logger.info(`Salary: ${job.salary || 'Not specified'}`);
        logger.info(`Posted: ${job.postedDate}`);
        logger.info(`Is Remote: ${job.isRemote}`);
        logger.info(`Description: ${job.description.substring(0, 150)}...`);
      });
      
      // Show some remote jobs specifically
      const remoteJobsSample = jobs.filter(job => job.isRemote).slice(0, 3);
      if (remoteJobsSample.length > 0) {
        logger.info('\n=== Sample Remote Jobs ===');
        remoteJobsSample.forEach((job, index) => {
          logger.info(`\n--- Remote Job ${index + 1} ---`);
          logger.info(`Title: ${job.title}`);
          logger.info(`Company: ${job.company}`);
          logger.info(`Location: ${job.location}`);
          logger.info(`Salary: ${job.salary || 'Not specified'}`);
        });
      }
    }
    
    // Save results to file
    const fs = require('fs');
    const path = require('path');
    
    const resultsDir = path.join(__dirname, '../results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `onlinejobs-enhanced-test-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(jobs, null, 2));
    logger.info(`\nResults saved to: ${filepath}`);
    
    return jobs;
    
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testOnlineJobsPhScraperEnhanced()
    .then((jobs) => {
      logger.info(`Enhanced test completed successfully with ${jobs.length} jobs`);
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Enhanced test failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = testOnlineJobsPhScraperEnhanced; 