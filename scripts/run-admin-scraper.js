/**
 * Worker script for admin/data entry job scraper
 * 
 * This script runs the AdminDataEntryScraper in a standalone process
 * It can be executed directly or launched by the scheduler
 */

const AdminDataEntryScraper = require('../src/scrapers/AdminDataEntryScraper');
const database = require('../src/utils/database');
const bridgeManager = require('../src/utils/bridgeManager');
const logger = require('../src/utils/logger');
const fs = require('fs').promises;
const path = require('path');

// Check for GitHub Actions environment
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

// Configure bridge URL for GitHub Actions
if (isGitHubActions) {
  process.env.JOBSPY_BRIDGE_URL = 'http://0.0.0.0:8000';
  process.env.JOBSPY_BRIDGE_HOST = '0.0.0.0';
}

/**
 * Main execution function
 */
async function run() {
  try {
    // Connect to database
    await database.connect();
    
    // Check bridge
    const bridgeRunning = await bridgeManager.isRunning();
    if (!bridgeRunning) {
      logger.info('Starting JobSpy bridge...');
      await bridgeManager.start();
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Create and run scraper
    const scraper = new AdminDataEntryScraper();
    
    // Check if we should run in quick mode
    const quickMode = process.argv.includes('--quick');
    
    if (quickMode) {
      // Only enable sources for quick updates
      const quickSources = require('../config/admin-entry-config').schedule.quickUpdateSources;
      Object.keys(scraper.config.sources).forEach(source => {
        scraper.config.sources[source].enabled = quickSources.includes(source);
      });
      logger.info(`Quick mode enabled - only scraping sources: ${quickSources.join(', ')}`);
    }
    
    // Run scraper
    logger.info(`Starting admin/data entry scraper (${quickMode ? 'quick' : 'full'} mode)...`);
    const startTime = new Date();
    const results = await scraper.scrape();
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    // Save results to logs directory
    await saveResultsToLog(results, quickMode);
    
    // Print summary results
    logger.info('=== Admin/Data Entry Scraper Summary ===');
    logger.info(`Run completed in ${duration.toFixed(1)}s`);
    logger.info(`Found: ${results.stats.totalJobs} jobs (${results.stats.adminJobsFound} admin, ${results.stats.dataEntryJobsFound} data entry, ${results.stats.customerServiceJobsFound} customer service)`);
    logger.info(`Filtered out: ${results.stats.filteredOut} irrelevant jobs`);
    
    // Output JSON for when run from scheduler
    if (process.argv.includes('--json-output')) {
      logger.info(JSON.stringify(results));
    }
    
    // Clean exit
    process.exit(0);
  } catch (error) {
    logger.error('Error running admin/data entry scraper:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    try {
      await database.disconnect();
    } catch (err) {
      logger.error('Error disconnecting from database:', err);
    }
    
    // Stop bridge if we started it
    if (process.argv.includes('--stop-bridge')) {
      try {
        await bridgeManager.stop();
      } catch (err) {
        logger.error('Error stopping bridge:', err);
      }
    }
  }
}

/**
 * Save scraper run results to logs
 * @param {Object} results - Results from scraper run
 * @param {boolean} isQuickRun - Whether this was a quick run
 */
async function saveResultsToLog(results, isQuickRun) {
  try {
    // Ensure logs directory exists
    const logDir = path.join(__dirname, '../logs');
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create logs directory: ${error.message}`);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logType = isQuickRun ? 'quick' : 'full';
    const logFile = path.join(logDir, `admin-entry-scraper-${logType}-${timestamp}.json`);
    
    await fs.writeFile(logFile, JSON.stringify(results, null, 2));
    logger.info(`Saved scraper results to ${logFile}`);
  } catch (error) {
    logger.error(`Failed to save scraper results: ${error.message}`);
  }
}

// Run the script if executed directly
if (require.main === module) {
  run().catch(error => {
    logger.error('Fatal error in admin/data entry scraper:', error);
    process.exit(1);
  });
} 