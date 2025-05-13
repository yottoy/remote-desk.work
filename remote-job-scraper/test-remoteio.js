const RemoteIoScraper = require('./src/scrapers/RemoteIoScraper');
const qualityFilter = require('./src/utils/qualityFilter');
const database = require('./src/utils/database');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./src/utils/logger');

/**
 * Test script to scrape Remote.io
 */
async function testRemoteIoScraper() {
  try {
    logger.info('Starting Remote.io scraper test');
    
    // Initialize database (will use in-memory if MongoDB unavailable)
    await database.connect();
    logger.info('Database initialized');
    
    // Create results directory
    const resultsDir = path.join(process.cwd(), 'remoteio-results');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (err) {
      logger.debug(`Error creating results directory: ${err.message}`);
    }
    
    // Initialize Remote.io scraper
    const scraper = new RemoteIoScraper();
    
    // Run the scraper
    logger.info('Running Remote.io scraper');
    console.log('Fetching jobs from Remote.io...');
    
    const startTime = Date.now();
    const jobs = await scraper.scrape();
    const endTime = Date.now();
    
    logger.info(`Remote.io scraper completed in ${(endTime - startTime) / 1000} seconds`);
    logger.info(`Found ${jobs.length} jobs from Remote.io`);
    
    if (jobs.length > 0) {
      // Save raw jobs to file
      const rawJobsPath = path.join(resultsDir, 'remoteio-raw-jobs.json');
      await fs.writeFile(rawJobsPath, JSON.stringify(jobs, null, 2));
      logger.info(`Raw jobs saved to ${rawJobsPath}`);
      
      // Apply quality filter
      logger.info('Applying quality filter to Remote.io jobs...');
      const filteredJobs = qualityFilter.filterJobs(jobs);
      
      // Save filtered jobs to file
      const filteredJobsPath = path.join(resultsDir, 'remoteio-filtered-jobs.json');
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
          logger.info(`- ${job.title} (Company: ${job.company}, Score: ${job.qualityMetrics?.totalScore.toFixed(2) || 'N/A'})`);
        });
      }
      
      // Get database stats
      const stats = await database.getStats();
      logger.info(`Database now contains ${stats.totalJobs} jobs total`);
      
      console.log("\n=================================================");
      console.log(`SUCCESS! Found ${jobs.length} jobs from Remote.io`);
      console.log(`${filteredJobs.length} jobs passed quality filter`);
      console.log(`${result?.inserted || 0} new jobs added to database`);
      console.log(`Review results in the remoteio-results directory`);
      console.log("=================================================\n");
    } else {
      logger.warn('No jobs found from Remote.io');
      console.log("\n=================================================");
      console.log("NO JOBS FOUND FROM REMOTE.IO");
      console.log("This may indicate an issue with the scraper implementation");
      console.log("=================================================\n");
    }
  } catch (error) {
    logger.error(`Remote.io scraper test failed: ${error.message}`);
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
testRemoteIoScraper().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 