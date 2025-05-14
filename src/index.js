require('dotenv').config();
const logger = require('./utils/logger');
const scrapeController = require('./controllers/scrapeController');
const database = require('./utils/database');
const bridgeManager = require('./utils/bridgeManager');
const path = require('path');
const fs = require('fs');

// Check for GitHub Actions environment
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

// If running in GitHub Actions, configure bridge URL to use 0.0.0.0
if (isGitHubActions) {
  process.env.JOBSPY_BRIDGE_URL = 'http://0.0.0.0:8000';
  process.env.JOBSPY_BRIDGE_HOST = '0.0.0.0';
  console.log('Running in GitHub Actions, configured bridge URL to use all interfaces');
}

/**
 * Initialize the JobSpy bridge if needed
 */
async function initializeJobSpyBridge() {
  // Only initialize if JobSpy is enabled in config
  if (process.env.ENABLE_JOBSPY_INDEED === 'true') {
    logger.info('JobSpy Indeed scraper is enabled, initializing bridge...');
    
    const bridgeStarted = await bridgeManager.start();
    
    if (bridgeStarted) {
      logger.info('JobSpy bridge started successfully');
      // Start monitoring the bridge to auto-restart if it fails
      bridgeManager.startMonitoring(60000); // Check every 60 seconds
    } else {
      logger.error('Failed to start JobSpy bridge');
    }
  } else {
    logger.info('JobSpy Indeed scraper is disabled in config');
  }
}

/**
 * Main entry point for the scraper
 */
async function main() {
  try {
    logger.info('Remote job scraper starting');
    
    // Initialize JobSpy bridge if enabled
    await initializeJobSpyBridge();
    
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
    
    // Clean exit (don't exit if we're being used as a module)
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    logger.error(`Fatal error in scraper: ${error.message}`);
    logger.error(error.stack);
    
    // Clean exit (don't exit if we're being used as a module)
    if (require.main === module) {
      process.exit(1);
    }
  } finally {
    // Clean up by closing database and stopping bridge
    try {
      await database.disconnect();
      
      // Only stop the bridge if we're exiting the application
      if (require.main === module && process.env.ENABLE_JOBSPY_INDEED === 'true') {
        bridgeManager.stop();
      }
    } catch (err) {
      logger.error(`Error during cleanup: ${err.message}`);
    }
  }
}

/**
 * Handle application shutdown
 */
function handleShutdown() {
  logger.info('Application shutdown initiated');
  
  // Stop the bridge manager
  if (process.env.ENABLE_JOBSPY_INDEED === 'true') {
    bridgeManager.stop();
  }
  
  // Disconnect from database
  database.disconnect()
    .then(() => {
      logger.info('Clean shutdown completed');
      process.exit(0);
    })
    .catch(err => {
      logger.error(`Error during shutdown: ${err.message}`);
      process.exit(1);
    });
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

// Set up graceful shutdown handlers
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error in main process:', error);
    process.exit(1);
  });
}

module.exports = { main, initializeJobSpyBridge }; 