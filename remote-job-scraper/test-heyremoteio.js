const HeyRemoteIoScraper = require('./src/scrapers/HeyRemoteIoScraper');
const qualityFilter = require('./src/utils/qualityFilter');
const database = require('./src/utils/database');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./src/utils/logger');

/**
 * Test script to scrape HeyRemote.io
 */
async function testHeyRemoteIoScraper() {
  try {
    logger.info('Starting HeyRemote.io scraper test');
    
    // Initialize database (will use in-memory if MongoDB unavailable)
    await database.connect();
    logger.info('Database initialized');
    
    // Create results directory
    const resultsDir = path.join(process.cwd(), 'heyremoteio-results');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (err) {
      logger.debug(`Error creating results directory: ${err.message}`);
    }
    
    // Start time for performance measurement
    const startTime = Date.now();
    
    // Initialize scraper
    logger.info('Running HeyRemote.io scraper');
    const scraper = new HeyRemoteIoScraper();
    const jobs = await scraper.scrape();
    
    // Calculate time elapsed
    const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(3);
    logger.info(`HeyRemote.io scraper completed in ${timeElapsed} seconds`);
    
    // Check if any jobs were found
    if (jobs.length === 0) {
      logger.warn('No jobs found from HeyRemote.io');
      console.log('\n=================================================');
      console.log('NO JOBS FOUND FROM HEYREMOTE.IO');
      console.log('This may indicate an issue with the scraper implementation');
      console.log('=================================================\n');
      await database.disconnect();
      return;
    }
    
    // Apply quality filter
    logger.info(`Found ${jobs.length} jobs from HeyRemote.io`);
    const filteredJobs = qualityFilter.filterJobs(jobs);
    logger.info(`${filteredJobs.length} jobs passed quality filter`);
    
    // Get top 10 jobs for display
    const topJobs = filteredJobs.slice(0, 10);
    
    // Save all jobs to file
    const allJobsFilePath = path.join(resultsDir, 'all-jobs.json');
    await fs.writeFile(allJobsFilePath, JSON.stringify(jobs, null, 2));
    logger.info(`All jobs saved to ${allJobsFilePath}`);
    
    // Save filtered jobs to file
    const filteredJobsFilePath = path.join(resultsDir, 'filtered-jobs.json');
    await fs.writeFile(filteredJobsFilePath, JSON.stringify(filteredJobs, null, 2));
    logger.info(`Filtered jobs saved to ${filteredJobsFilePath}`);
    
    // Save top jobs to database
    for (const job of filteredJobs) {
      try {
        await database.saveJob(job);
      } catch (err) {
        logger.error(`Error saving job to database: ${err.message}`);
      }
    }
    
    // Display top 10 jobs
    console.log('\n=================================================');
    console.log(`TOP ${topJobs.length} JOBS FROM HEYREMOTE.IO:`);
    console.log('=================================================\n');
    
    topJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} at ${job.company}`);
      console.log(`   URL: ${job.url}`);
      console.log(`   Category: ${job.category}`);
      console.log(`   Posted: ${job.postedDate.toLocaleDateString()}`);
      console.log(`   Location: ${job.location}`);
      console.log(`   Description: ${job.descriptionText.substring(0, 100)}...`);
      console.log('');
    });
    
    // Close database connection
    logger.info('Closing MongoDB connection...');
    await database.disconnect();
    logger.info('MongoDB connection closed');
    
  } catch (error) {
    logger.error(`Error in HeyRemote.io scraper test: ${error.message}`);
    console.error(error);
    try {
      await database.disconnect();
    } catch (err) {
      logger.error(`Error disconnecting from database: ${err.message}`);
    }
    process.exit(1);
  }
}

// Run the test
testHeyRemoteIoScraper(); 