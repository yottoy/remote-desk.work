const WeWorkRemotelyScraper = require('./src/scrapers/WeWorkRemotelyScraper');
const qualityFilter = require('./src/utils/qualityFilter');
const database = require('./src/utils/database');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./src/utils/logger');

/**
 * Test script to scrape just WeWorkRemotely
 */
async function testSingleSiteScrape() {
  try {
    logger.info('Starting single-site scraper test (WeWorkRemotely only)');
    
    // Initialize in-memory database
    await database.connect();
    logger.info('Database initialized (using in-memory if MongoDB unavailable)');
    
    // Create results directory
    const resultsDir = path.join(process.cwd(), 'single-site-results');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (err) {
      logger.debug(`Error creating results directory: ${err.message}`);
    }
    
    // Initialize WeWorkRemotely scraper
    const scraper = new WeWorkRemotelyScraper();
    
    // Focus on categories that are likely to have data entry and admin jobs
    scraper.categories = ['customer-service', 'administrative'];
    
    // Important manual intervention instructions
    console.log("\n=================================================");
    console.log("IMPORTANT MANUAL INTERVENTION INSTRUCTIONS:");
    console.log("1. When browser opens, you may see Cloudflare protection");
    console.log("2. If prompted, please solve the CAPTCHA manually");
    console.log("3. The script will continue automatically after that");
    console.log("=================================================\n");
    
    // Run the scraper
    logger.info('Running WeWorkRemotely scraper - be ready to solve CAPTCHA if needed');
    const jobs = await scraper.scrape();
    
    logger.info(`Scraper returned ${jobs.length} jobs from WeWorkRemotely`);
    
    if (jobs.length > 0) {
      // Save raw jobs to file
      const rawJobsPath = path.join(resultsDir, 'wwr-raw-jobs.json');
      await fs.writeFile(rawJobsPath, JSON.stringify(jobs, null, 2));
      logger.info(`Raw jobs saved to ${rawJobsPath}`);
      
      // Apply quality filter
      logger.info('Applying quality filter...');
      const filteredJobs = qualityFilter.filterJobs(jobs);
      
      // Save filtered jobs to file
      const filteredJobsPath = path.join(resultsDir, 'wwr-filtered-jobs.json');
      await fs.writeFile(filteredJobsPath, JSON.stringify(filteredJobs, null, 2));
      logger.info(`Filtered jobs saved to ${filteredJobsPath}`);
      
      // Save to database
      if (filteredJobs.length > 0) {
        logger.info(`Saving ${filteredJobs.length} jobs to database...`);
        const result = await database.bulkSaveJobs(filteredJobs);
        logger.info(`Database save results: ${result.inserted} inserted, ${result.updated} updated`);
        
        // Log job titles that passed the filter
        logger.info('Jobs that passed quality filter:');
        filteredJobs.forEach(job => {
          logger.info(`- ${job.title} at ${job.company} (Score: ${job.qualityMetrics.totalScore.toFixed(2)})`);
        });
      }
      
      // Get database stats
      const stats = await database.getStats();
      logger.info(`Database now contains ${stats.totalJobs} jobs`);
      
      console.log("\n=================================================");
      console.log(`SUCCESS! Found ${jobs.length} jobs from WeWorkRemotely`);
      console.log(`${filteredJobs.length} jobs passed quality filter`);
      console.log(`Review results in the single-site-results directory`);
      console.log("=================================================\n");
    } else {
      logger.warn('No jobs found from WeWorkRemotely');
      console.log("\n=================================================");
      console.log("NO JOBS FOUND");
      console.log("This may indicate Cloudflare protection was not bypassed");
      console.log("=================================================\n");
    }
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    logger.error(error.stack);
    console.log("\n=================================================");
    console.log(`ERROR: ${error.message}`);
    console.log("=================================================\n");
  } finally {
    // Close database connection
    await database.disconnect();
  }
}

// Run the test
testSingleSiteScrape().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 