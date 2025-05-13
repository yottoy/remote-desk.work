/**
 * Test JobSpy + MongoDB integration
 * 
 * This script:
 * 1. Starts the JobSpy bridge
 * 2. Scrapes jobs from Indeed
 * 3. Stores the results in MongoDB
 */

require('dotenv').config();
const bridgeManager = require('./src/utils/bridgeManager');
const JobSpyIndeedScraper = require('./src/scrapers/JobSpyIndeedScraper');
const database = require('./src/utils/database');
const fs = require('fs').promises;
const path = require('path');

// Force enable JobSpy for testing
process.env.ENABLE_JOBSPY_INDEED = 'true';
process.env.JOBSPY_BRIDGE_URL = 'http://localhost:8000';

// Simple logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  debug: (msg) => console.debug(`[DEBUG] ${msg}`)
};

/**
 * Test MongoDB connection
 */
async function testMongoConnection() {
  try {
    await database.connect();
    
    if (database.useInMemory) {
      logger.warn('Using in-memory storage because MongoDB connection failed');
      return false;
    }
    
    const dbStats = await database.getStats();
    logger.info(`Connected to MongoDB. Current job count: ${dbStats.totalJobs}`);
    return true;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    return false;
  }
}

/**
 * Scrape jobs and save to database
 */
async function scrapeAndSaveJobs() {
  // Initialize scraper with limited search
  const scraper = new JobSpyIndeedScraper();
  scraper.jobspyConfig.enabled = true;
  scraper.queries = ['remote data entry']; // Just one query for testing
  scraper.resultsWanted = 5; // Limit results
  
  // Run the scraper
  logger.info('Running JobSpy scraper...');
  const jobs = await scraper.scrape();
  
  logger.info(`Found ${jobs.length} jobs`);
  
  if (jobs.length === 0) {
    logger.warn('No jobs found');
    return false;
  }
  
  // Save job sample to file for inspection
  const outputDir = path.join(process.cwd(), 'test-results');
  await fs.mkdir(outputDir, { recursive: true });
  
  const samplePath = path.join(outputDir, 'jobspy-sample.json');
  await fs.writeFile(samplePath, JSON.stringify(jobs[0], null, 2));
  logger.info(`Saved sample job to ${samplePath}`);
  
  // Save to database
  logger.info(`Saving ${jobs.length} jobs to database...`);
  const saveStats = await database.saveJobs(jobs);
  
  logger.info(`Database save results: ${JSON.stringify(saveStats)}`);
  return saveStats.saved > 0;
}

/**
 * Run the full test
 */
async function runTest() {
  try {
    logger.info('Starting JobSpy + MongoDB integration test');
    
    // 1. Test MongoDB connection
    logger.info('Testing MongoDB connection...');
    const dbConnected = await testMongoConnection();
    
    if (!dbConnected) {
      logger.warn('MongoDB connection test failed - continuing with in-memory storage');
    }
    
    // 2. Start bridge
    logger.info('Starting JobSpy bridge...');
    const bridgeStarted = await bridgeManager.start();
    
    if (!bridgeStarted) {
      throw new Error('Failed to start JobSpy bridge');
    }
    
    bridgeManager.startMonitoring(10000);
    logger.info('JobSpy bridge started and monitoring enabled');
    
    // 3. Scrape and save jobs
    logger.info('Scraping and saving jobs...');
    const scrapeResult = await scrapeAndSaveJobs();
    
    if (scrapeResult) {
      logger.info('Successfully scraped and saved jobs to database');
    } else {
      logger.warn('Failed to scrape or save jobs');
    }
    
    // 4. Get final database stats
    const finalStats = await database.getStats();
    logger.info(`Final database stats: ${JSON.stringify(finalStats)}`);
    
    logger.info('Integration test completed');
    return true;
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    return false;
  } finally {
    // Clean up
    logger.info('Stopping bridge...');
    bridgeManager.stop();
    
    logger.info('Disconnecting from database...');
    await database.disconnect();
    
    logger.info('Test cleanup completed');
  }
}

// Run the test
runTest()
  .then(success => {
    if (success) {
      logger.info('Integration test succeeded');
      process.exit(0);
    } else {
      logger.error('Integration test failed');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  }); 