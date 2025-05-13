const logger = require('./utils/logger');
const scrapeController = require('./controllers/scrapeController');
const database = require('./utils/database');
const path = require('path');
const fs = require('fs');

/**
 * Main entry point for the scraper
 */
async function main() {
  try {
    logger.info('Remote job scraper starting');
    
    // Try to connect to MongoDB
    try {
      await database.connect();
      logger.info('Successfully connected to database');
    } catch (error) {
      logger.warn(`MongoDB connection failed: ${error.message}`);
      logger.warn('Continuing with in-memory storage mode');
      // Continue with in-memory storage (handled by database.js)
    }
    
    // Run the scrape process
    const results = await scrapeController.runScrape();
    
    // Save results to file for reference
    saveResultsToFile(results);
    
    // Print summary at the end
    const { scrape, database: dbStats } = results;
    logger.info('Remote job scraper completed successfully');
    logger.info(`Summary: Scraped ${scrape.totalScraped} jobs, filtered out ${scrape.filteredOut}, saved ${scrape.saved}`);
    logger.info(`Database now contains ${dbStats.totalJobs} total jobs, including ${dbStats.featuredJobs} featured jobs`);
    
    // Clean exit
    process.exit(0);
  } catch (error) {
    logger.error(`Fatal error in scraper: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  } finally {
    // Clean up by closing database
    try {
      await database.disconnect();
    } catch (err) {
      logger.error(`Error during database disconnect: ${err.message}`);
    }
  }
}

/**
 * Save scrape results to a JSON file
 * @param {Object} results - Scrape results
 */
function saveResultsToFile(results) {
  try {
    // Create results directory if it doesn't exist
    const resultsDir = path.join(process.cwd(), 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
    const filename = path.join(resultsDir, `scrape-results-${timestamp}.json`);
    
    // Write results to file
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    
    logger.info(`Scrape results saved to ${filename}`);
  } catch (error) {
    logger.error(`Error saving results to file: ${error.message}`);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error in main process:', error);
    process.exit(1);
  });
}

module.exports = { main }; 