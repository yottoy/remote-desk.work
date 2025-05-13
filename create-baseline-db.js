/**
 * Create Baseline Database Script
 * 
 * This script runs the JobSpy scraper with enhanced quality filtering
 * to create a baseline database of high-quality remote jobs.
 */

require('dotenv').config();
const bridgeManager = require('./src/utils/bridgeManager');
const scrapeController = require('./src/controllers/scrapeController');
const database = require('./src/utils/database');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config/config');

// Force enable JobSpy for testing
process.env.ENABLE_JOBSPY_INDEED = 'true';
// Force enable in config as well
config.sources.jobspy_indeed.enabled = true;

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  debug: (msg) => console.debug(`[DEBUG] ${msg}`)
};

/**
 * Run the full scrape process
 */
async function createBaselineDb() {
  try {
    logger.info('Starting baseline database creation');
    
    // 1. Connect to database
    await database.connect();
    
    if (database.useInMemory) {
      logger.warn('Using in-memory storage because MongoDB connection failed');
    } else {
      logger.info('Connected to MongoDB database');
    }
    
    // 2. Start bridge
    logger.info('Starting JobSpy bridge...');
    const bridgeStarted = await bridgeManager.start();
    
    if (!bridgeStarted) {
      throw new Error('Failed to start JobSpy bridge');
    }
    
    bridgeManager.startMonitoring(15000);
    logger.info('JobSpy bridge started and monitoring enabled');
    
    // 3. Run scrape controller
    logger.info('Running scrape controller...');
    const results = await scrapeController.runScrape();
    
    // 4. Save results to file
    await saveResultsToFile(results);
    
    // 5. Output summary
    logger.info('Baseline database creation completed');
    logger.info(`Summary: Scraped ${results.scrape.totalScraped} jobs, filtered out ${results.scrape.filteredOut}, saved ${results.scrape.saved}`);
    logger.info(`Database now contains ${results.database.totalJobs} total jobs, including ${results.database.featuredJobs} featured jobs`);
    
    return true;
  } catch (error) {
    logger.error(`Baseline DB creation failed: ${error.message}`);
    return false;
  } finally {
    // Clean up
    logger.info('Stopping bridge...');
    bridgeManager.stop();
    
    logger.info('Disconnecting from database...');
    await database.disconnect();
    
    logger.info('Script cleanup completed');
  }
}

/**
 * Save results to file
 * @param {Object} results - Scrape results
 */
async function saveResultsToFile(results) {
  try {
    // Create results directory if it doesn't exist
    const resultsDir = path.join(process.cwd(), 'baseline-results');
    await fs.mkdir(resultsDir, { recursive: true });
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
    const filename = path.join(resultsDir, `baseline-db-${timestamp}.json`);
    
    // Write results to file
    await fs.writeFile(filename, JSON.stringify(results, null, 2));
    
    logger.info(`Baseline results saved to ${filename}`);
  } catch (error) {
    logger.error(`Error saving results to file: ${error.message}`);
  }
}

// Run the script
createBaselineDb()
  .then(success => {
    if (success) {
      logger.info('Baseline database created successfully');
      process.exit(0);
    } else {
      logger.error('Failed to create baseline database');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  }); 