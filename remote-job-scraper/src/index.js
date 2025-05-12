const logger = require('./utils/logger');
const scrapeController = require('./controllers/scrapeController');
const path = require('path');
const fs = require('fs');

/**
 * Main entry point for the scraper
 */
async function main() {
  try {
    logger.info('Remote job scraper starting');
    
    // Run the scrape process
    const results = await scrapeController.runScrape();
    
    // Save results to file for reference
    saveResultsToFile(results);
    
    logger.info('Remote job scraper completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Fatal error in scraper: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
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