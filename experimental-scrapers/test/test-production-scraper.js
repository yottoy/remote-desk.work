const ProductionOnlineJobsScraper = require('../src/scrapers/ProductionOnlineJobsScraper');
const logger = require('../src/utils/logger');

async function testProductionScraper() {
  logger.info('Starting Production OnlineJobs.ph scraper test');
  
  const scraper = new ProductionOnlineJobsScraper({
    headless: true,
    timeout: 60000,
    maxPages: 10, // Test with 10 pages (300 jobs)
    batchSize: 3, // Smaller batches for testing
    delayBetweenBatches: 15000 // 15 seconds between batches for testing
  });

  try {
    const startTime = Date.now();
    const jobs = await scraper.scrape();
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    logger.info(`Production test completed in ${duration} seconds. Found ${jobs.length} jobs`);
    
    if (jobs.length > 0) {
      // Get detailed statistics
      const stats = scraper.getStats(jobs);
      
      logger.info(`\n=== Production Statistics ===`);
      logger.info(`Total jobs: ${stats.total}`);
      logger.info(`Remote jobs: ${stats.remote} (${Math.round(stats.remote / stats.total * 100)}%)`);
      logger.info(`Jobs with salary: ${stats.withSalary} (${Math.round(stats.withSalary / stats.total * 100)}%)`);
      logger.info(`Jobs with URL: ${stats.withUrl} (${Math.round(stats.withUrl / stats.total * 100)}%)`);
      logger.info(`Recent jobs (24h): ${stats.recentJobs}`);
      
      logger.info(`\n=== Job Categories ===`);
      Object.entries(stats.categories)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          logger.info(`${category}: ${count} jobs`);
        });
      
      logger.info('\n=== Sample High-Quality Jobs ===');
      const sampleJobs = jobs
        .filter(job => job.isRemote && job.salary)
        .slice(0, 5);
        
      sampleJobs.forEach((job, index) => {
        logger.info(`\n--- Quality Job ${index + 1} ---`);
        logger.info(`Title: ${job.title}`);
        logger.info(`Company: ${job.company}`);
        logger.info(`Category: ${scraper.categorizeJob(job)}`);
        logger.info(`Location: ${job.location}`);
        logger.info(`Salary: ${job.salary}`);
        logger.info(`URL: ${job.url || 'No URL'}`);
        logger.info(`Posted: ${job.postedDate}`);
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
    const filename = `production-onlinejobs-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);
    
    // Save with metadata
    const output = {
      metadata: {
        scrapedAt: new Date().toISOString(),
        totalJobs: jobs.length,
        stats: scraper.getStats(jobs),
        scraper: 'ProductionOnlineJobsScraper',
        version: '1.0'
      },
      jobs: jobs
    };
    
    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
    logger.info(`\nProduction results saved to: ${filepath}`);
    
    return jobs;
    
  } catch (error) {
    logger.error(`Production test failed: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testProductionScraper()
    .then((jobs) => {
      logger.info(`Production test completed successfully with ${jobs.length} jobs`);
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Production test failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = testProductionScraper; 