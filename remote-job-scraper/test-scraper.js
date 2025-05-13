const WeWorkRemotelyScraper = require('./src/scrapers/WeWorkRemotelyScraper');
const qualityFilter = require('./src/utils/qualityFilter');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./src/utils/logger');

/**
 * Test scraper with Cloudflare bypass
 */
async function testScraper() {
  try {
    logger.info('Starting scraper test with Cloudflare bypass');
    
    // Create test results directory
    const testDir = path.join(process.cwd(), 'test-results');
    try {
      await fs.mkdir(testDir, { recursive: true });
    } catch (err) {
      logger.debug(`Error creating test directory: ${err.message}`);
    }
    
    // Initialize the scraper
    const scraper = new WeWorkRemotelyScraper();
    
    // Limit to just one category to keep the test focused
    scraper.categories = ['customer-service'];
    
    // Important: When the browser opens, you may need to:
    // 1. Solve any CAPTCHA manually if Cloudflare protection appears
    // 2. Wait for the page to fully load after solving
    // 3. The script will automatically continue once protection is bypassed
    
    console.log("\n=================================================");
    console.log("IMPORTANT MANUAL INTERVENTION INSTRUCTIONS:");
    console.log("1. When browser opens, you may see Cloudflare protection");
    console.log("2. If prompted, complete any CAPTCHA or verification");
    console.log("3. The script will wait and continue automatically");
    console.log("   after you've solved the challenge");
    console.log("=================================================\n");
    
    // Run the scraper with extended timeout
    logger.info('Running the scraper with Cloudflare bypass...');
    console.log("Starting browser - be ready to solve any CAPTCHA if needed");
    
    // Set longer timeout for entire process to allow manual CAPTCHA solving
    const scrapePromise = scraper.scrape();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Scraper timeout after 5 minutes')), 300000)
    );
    
    // Race the promises to handle timeouts
    const jobs = await Promise.race([scrapePromise, timeoutPromise]);
    
    logger.info(`Scraper returned ${jobs.length} jobs`);
    
    if (jobs.length > 0) {
      // Save raw jobs
      const rawJobsPath = path.join(testDir, 'raw-jobs.json');
      await fs.writeFile(rawJobsPath, JSON.stringify(jobs, null, 2));
      logger.info(`Raw jobs saved to ${rawJobsPath}`);
      
      // Apply quality filter
      logger.info('Applying quality filter...');
      const filteredJobs = qualityFilter.filterJobs(jobs);
      
      // Save filtered jobs
      const filteredJobsPath = path.join(testDir, 'filtered-jobs.json');
      await fs.writeFile(filteredJobsPath, JSON.stringify(filteredJobs, null, 2));
      logger.info(`Filtered jobs saved to ${filteredJobsPath}`);
      
      // Print rejection stats
      logger.info('Rejection stats:');
      logger.info(JSON.stringify(qualityFilter.getRejectionStats(), null, 2));
      
      // Print filtered job titles
      logger.info('Filtered job titles:');
      filteredJobs.forEach(job => {
        logger.info(`- ${job.title} (Score: ${job.qualityMetrics.totalScore.toFixed(2)})`);
      });
      
      // Success!
      console.log("\n=================================================");
      console.log(`SUCCESS! Found ${jobs.length} jobs, ${filteredJobs.length} passed quality filter`);
      console.log("Review results in the test-results directory");
      console.log("=================================================\n");
    } else {
      logger.warn('No jobs found to filter. This might indicate Cloudflare protection was not bypassed successfully.');
      console.log("\n=================================================");
      console.log("FAILURE! No jobs were scraped.");
      console.log("This likely means Cloudflare protection wasn't bypassed successfully.");
      console.log("=================================================\n");
    }
    
    logger.info('Test completed');
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    logger.error(error.stack);
    console.log("\n=================================================");
    console.log(`ERROR: ${error.message}`);
    console.log("Test failed - check logs for details");
    console.log("=================================================\n");
  }
}

// Run the test
testScraper().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 