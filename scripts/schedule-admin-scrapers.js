/**
 * Scheduler for Admin/Data Entry job scrapers
 * 
 * This script sets up automated scheduling for running the admin/data entry
 * job scrapers according to the configuration defined in admin-entry-config.js
 */

const cron = require('node-cron');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const AdminDataEntryScraper = require('../src/scrapers/AdminDataEntryScraper');
const adminEntryConfig = require('../config/admin-entry-config');
const database = require('../src/utils/database');
const bridgeManager = require('../src/utils/bridgeManager');
const logger = require('../src/utils/logger');

// Track active scraper processes
const activeProcesses = new Map();

// Ensure logs directory exists
async function ensureLogDir() {
  const logDir = path.join(__dirname, '../logs');
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (error) {
    logger.error(`Failed to create logs directory: ${error.message}`);
  }
  return logDir;
}

/**
 * Run the admin data entry scraper
 * @param {boolean} quickMode - Whether to run in quick mode (only some sources)
 * @returns {Promise<Object>} - Results of the scraper run
 */
async function runAdminDataEntryScraper(quickMode = false) {
  try {
    // Connect to database first
    await database.connect();
    
    // Check if bridge is running
    const bridgeRunning = await bridgeManager.isRunning();
    if (!bridgeRunning) {
      logger.info('Starting JobSpy bridge...');
      await bridgeManager.start();
      // Wait for bridge to initialize
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Create scraper instance
    const scraper = new AdminDataEntryScraper();
    
    // Run the scraper
    const startTime = new Date();
    logger.info(`Starting ${quickMode ? 'quick' : 'full'} admin/data entry scraper run at ${startTime.toISOString()}`);
    
    // If in quick mode, temporarily modify the source configuration
    if (quickMode) {
      // Backup original config
      const originalSources = { ...scraper.config.sources };
      
      // Only enable sources specified for quick updates
      Object.keys(scraper.config.sources).forEach(source => {
        if (!adminEntryConfig.schedule.quickUpdateSources.includes(source)) {
          scraper.config.sources[source].enabled = false;
        }
      });
      
      // Run scraper
      const results = await scraper.scrape();
      
      // Restore original configuration
      scraper.config.sources = originalSources;
      
      return results;
    } else {
      // Run full scraper with all sources
      return await scraper.scrape();
    }
  } catch (error) {
    logger.error(`Error running admin/data entry scraper: ${error.message}`);
    throw error;
  } finally {
    // Disconnect from database
    await database.disconnect();
  }
}

/**
 * Save scraper run results to logs
 * @param {Object} results - Results from scraper run
 * @param {boolean} isQuickRun - Whether this was a quick run
 */
async function saveResultsToLog(results, isQuickRun) {
  try {
    const logDir = await ensureLogDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logType = isQuickRun ? 'quick' : 'full';
    const logFile = path.join(logDir, `admin-entry-scraper-${logType}-${timestamp}.json`);
    
    await fs.writeFile(logFile, JSON.stringify(results, null, 2));
    logger.info(`Saved scraper results to ${logFile}`);
  } catch (error) {
    logger.error(`Failed to save scraper results: ${error.message}`);
  }
}

/**
 * Run a scraper in a separate process
 * @param {string} type - Type of scraper run ('full' or 'quick')
 */
function runScraperProcess(type) {
  return new Promise(async (resolve, reject) => {
    try {
      const logDir = await ensureLogDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFile = path.join(logDir, `admin-entry-scraper-${type}-${timestamp}.log`);
      
      // Open log file for writing
      const logStream = fs.open(logFile, 'w').then(fileHandle => {
        return fileHandle.createWriteStream();
      });
      
      // Create a script path for the worker process
      const workerScript = path.join(__dirname, 'run-admin-scraper.js');
      
      // Check if worker script exists, if not create it
      try {
        await fs.access(workerScript);
      } catch (error) {
        // Create run-admin-scraper.js if it doesn't exist
        await fs.writeFile(workerScript, `
const AdminDataEntryScraper = require('../src/scrapers/AdminDataEntryScraper');
const database = require('../src/utils/database');
const bridgeManager = require('../src/utils/bridgeManager');

async function run() {
  try {
    // Connect to database
    await database.connect();
    
    // Check bridge
    const bridgeRunning = await bridgeManager.isRunning();
    if (!bridgeRunning) {
      console.log('Starting JobSpy bridge...');
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
    }
    
    // Run scraper
    const results = await scraper.scrape();
    
    // Output results as JSON
    console.log(JSON.stringify(results));
    
    // Clean exit
    process.exit(0);
  } catch (error) {
    console.error('Error running scraper:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    await database.disconnect();
  }
}

run();
        `);
      }
      
      // Run the worker script in a new process
      const args = type === 'quick' ? ['--quick'] : [];
      const process = spawn('node', [workerScript, ...args], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Store process in active processes map
      activeProcesses.set(type, process);
      
      // Handle process output
      let outputData = '';
      process.stdout.on('data', (data) => {
        outputData += data.toString();
        logger.info(`[${type} scraper] ${data.toString().trim()}`);
      });
      
      process.stderr.on('data', (data) => {
        logger.error(`[${type} scraper] ${data.toString().trim()}`);
      });
      
      // Handle process completion
      process.on('close', async (code) => {
        logger.info(`${type.charAt(0).toUpperCase() + type.slice(1)} scraper process exited with code ${code}`);
        
        // Remove from active processes
        activeProcesses.delete(type);
        
        if (code === 0) {
          try {
            // Parse JSON results from output
            const results = JSON.parse(outputData);
            await saveResultsToLog(results, type === 'quick');
            resolve(results);
          } catch (error) {
            logger.error(`Failed to parse scraper results: ${error.message}`);
            reject(error);
          }
        } else {
          reject(new Error(`Scraper process exited with code ${code}`));
        }
      });
      
      // Handle process error
      process.on('error', (error) => {
        logger.error(`Error in ${type} scraper process: ${error.message}`);
        activeProcesses.delete(type);
        reject(error);
      });
    } catch (error) {
      logger.error(`Failed to start ${type} scraper process: ${error.message}`);
      reject(error);
    }
  });
}

/**
 * Schedule scraper runs
 */
function scheduleScraping() {
  const config = adminEntryConfig.schedule;
  
  // Schedule full scraper run
  logger.info(`Scheduling full scraper run with cron: ${config.fullScrapeInterval}`);
  cron.schedule(config.fullScrapeInterval, async () => {
    try {
      // Check if we already have a full run in progress
      if (activeProcesses.has('full')) {
        logger.warn('Full scraper run already in progress, skipping this scheduled run');
        return;
      }
      
      // Check if we're at the concurrent process limit
      if (activeProcesses.size >= config.concurrentScrapers) {
        logger.warn(`At concurrent scraper limit (${config.concurrentScrapers}), skipping this full scraper run`);
        return;
      }
      
      // Run the scraper in a separate process
      await runScraperProcess('full');
    } catch (error) {
      logger.error(`Error in scheduled full scraper run: ${error.message}`);
    }
  });
  
  // Schedule quick update runs
  logger.info(`Scheduling quick scraper run with cron: ${config.quickUpdateInterval}`);
  cron.schedule(config.quickUpdateInterval, async () => {
    try {
      // Check if we already have a quick run in progress
      if (activeProcesses.has('quick')) {
        logger.warn('Quick scraper run already in progress, skipping this scheduled run');
        return;
      }
      
      // Check if we're at the concurrent process limit
      if (activeProcesses.size >= config.concurrentScrapers) {
        logger.warn(`At concurrent scraper limit (${config.concurrentScrapers}), skipping this quick scraper run`);
        return;
      }
      
      // Run the scraper in a separate process
      await runScraperProcess('quick');
    } catch (error) {
      logger.error(`Error in scheduled quick scraper run: ${error.message}`);
    }
  });
  
  logger.info('Admin/Data Entry job scraper scheduling initialized');
}

/**
 * Main function
 */
async function main() {
  try {
    logger.info('Starting Admin/Data Entry scraper scheduler');
    
    // Check database connection first
    try {
      await database.connect();
      logger.info('Successfully connected to MongoDB');
      await database.disconnect();
    } catch (error) {
      logger.warn(`MongoDB connection check failed: ${error.message}`);
      logger.warn('Continuing with scheduling, but scrapers may fail if database remains unavailable');
    }
    
    // Check bridge connection
    try {
      const bridgeRunning = await bridgeManager.isRunning();
      if (!bridgeRunning) {
        logger.info('JobSpy bridge not running, attempting to start it...');
        const started = await bridgeManager.start();
        if (started) {
          logger.info('Successfully started JobSpy bridge');
        } else {
          logger.warn('Failed to start JobSpy bridge, scrapers may fail');
        }
      } else {
        logger.info('JobSpy bridge is already running');
      }
    } catch (error) {
      logger.warn(`JobSpy bridge check failed: ${error.message}`);
    }
    
    // Set up scheduled scraping
    scheduleScraping();
    
    // Optionally run an initial scrape immediately
    if (process.argv.includes('--run-now')) {
      logger.info('Running initial admin/data entry scraper...');
      try {
        await runScraperProcess('full');
        logger.info('Initial scraper run completed successfully');
      } catch (error) {
        logger.error(`Initial scraper run failed: ${error.message}`);
      }
    }
    
    logger.info('Admin/Data Entry scraper scheduler is running. Press Ctrl+C to exit.');
  } catch (error) {
    logger.error(`Error in scheduler main: ${error.message}`);
    process.exit(1);
  }
}

// Handle exit signals
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down scheduler...');
  
  // Kill any active scraper processes
  for (const [type, process] of activeProcesses.entries()) {
    logger.info(`Terminating active ${type} scraper process...`);
    process.kill();
  }
  
  // Disconnect bridge if it was started by us
  try {
    await bridgeManager.stop();
  } catch (error) {
    logger.error(`Error stopping bridge: ${error.message}`);
  }
  
  logger.info('Scheduler shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down scheduler...');
  
  // Kill any active scraper processes
  for (const [type, process] of activeProcesses.entries()) {
    logger.info(`Terminating active ${type} scraper process...`);
    process.kill();
  }
  
  // Disconnect bridge if it was started by us
  try {
    await bridgeManager.stop();
  } catch (error) {
    logger.error(`Error stopping bridge: ${error.message}`);
  }
  
  logger.info('Scheduler shutdown complete');
  process.exit(0);
});

// Start the scheduler if run directly
if (require.main === module) {
  main();
}

module.exports = {
  runAdminDataEntryScraper,
  scheduleScraping,
  runScraperProcess
}; 