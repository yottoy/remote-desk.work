const WeWorkRemotelyRssScraper = require('./src/scrapers/WeWorkRemotelyRssScraper');
const qualityFilter = require('./src/utils/qualityFilter');
const database = require('./src/utils/database');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./src/utils/logger');

/**
 * Test script to scrape WeWorkRemotely using RSS feed
 * This approach bypasses Cloudflare completely
 */
async function testRssScraper() {
  try {
    logger.info('Starting RSS feed scraper test');
    
    // Initialize database (will use in-memory if MongoDB unavailable)
    await database.connect();
    logger.info('Database initialized');
    
    // Create results directory
    const resultsDir = path.join(process.cwd(), 'rss-results');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (err) {
      logger.debug(`Error creating results directory: ${err.message}`);
    }
    
    // Initialize RSS scraper
    const rssScraper = new WeWorkRemotelyRssScraper();
    
    // Run the RSS scraper
    logger.info('Running WeWorkRemotely RSS scraper');
    console.log('Fetching jobs from WeWorkRemotely RSS feed...');
    
    const startTime = Date.now();
    const jobs = await rssScraper.scrape();
    const endTime = Date.now();
    
    logger.info(`RSS scraper completed in ${(endTime - startTime) / 1000} seconds`);
    logger.info(`Found ${jobs.length} jobs from RSS feed`);
    
    if (jobs.length > 0) {
      // Save raw jobs to file
      const rawJobsPath = path.join(resultsDir, 'rss-raw-jobs.json');
      await fs.writeFile(rawJobsPath, JSON.stringify(jobs, null, 2));
      logger.info(`Raw jobs saved to ${rawJobsPath}`);
      
      // Apply quality filter
      logger.info('Applying quality filter to RSS jobs...');
      const filteredJobs = qualityFilter.filterJobs(jobs);
      
      // Save filtered jobs to file
      const filteredJobsPath = path.join(resultsDir, 'rss-filtered-jobs.json');
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
          logger.info(`- ${job.title} (Company: ${job.company}, Score: ${job.qualityMetrics.totalScore.toFixed(2)})`);
        });
      }
      
      // Get database stats
      const stats = await database.getStats();
      logger.info(`Database now contains ${stats.totalJobs} jobs total`);
      
      console.log("\n=================================================");
      console.log(`SUCCESS! Found ${jobs.length} jobs from RSS feed`);
      console.log(`${filteredJobs.length} jobs passed quality filter`);
      console.log(`${result.inserted} new jobs added to database`);
      console.log(`Review results in the rss-results directory`);
      console.log("=================================================\n");
    } else {
      logger.warn('No jobs found from RSS feed');
      console.log("\n=================================================");
      console.log("NO JOBS FOUND FROM RSS FEED");
      console.log("This may indicate an issue with the RSS feed URL or format");
      console.log("=================================================\n");
    }
  } catch (error) {
    logger.error(`RSS scraper test failed: ${error.message}`);
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
testRssScraper().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 