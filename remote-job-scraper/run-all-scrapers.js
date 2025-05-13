const logger = require('./src/utils/logger');
const database = require('./src/utils/database');
const qualityFilter = require('./src/utils/qualityFilter');
const fs = require('fs').promises;
const path = require('path');
const Job = require('./src/models/Job');
const config = require('./config/config');

// Import all our scrapers
const WeWorkRemotelyRssScraper = require('./src/scrapers/WeWorkRemotelyRssScraper');
const RemoteCoScraper = require('./src/scrapers/RemoteCoScraper');
const WorkewScraper = require('./src/scrapers/WorkewScraper');
const VirtualVocationsScraper = require('./src/scrapers/VirtualVocationsScraper');
const IndeedSeleniumScraper = require('./src/scrapers/IndeedSeleniumScraper');
const MonsterJobScraper = require('./src/scrapers/MonsterJobScraper');
const JobSpyIndeedScraper = require('./src/scrapers/JobSpyIndeedScraper');

/**
 * Run all scrapers and combine results
 */
async function runAllScrapers() {
  try {
    logger.info('Starting all scrapers');
    
    // Initialize database (will use in-memory if MongoDB unavailable)
    await database.connect();
    logger.info('Database initialized');
    
    // Create results directory
    const resultsDir = path.join(process.cwd(), 'combined-results');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (err) {
      logger.debug(`Error creating results directory: ${err.message}`);
    }
    
    // Initialize all scrapers - use RSS version for WWR to bypass Cloudflare
    const scrapers = [
      new WeWorkRemotelyRssScraper(),
      new RemoteCoScraper(),
      new WorkewScraper(),
      new VirtualVocationsScraper()
    ];
    
    // Add Indeed scraper only if enabled in config
    const indeedEnabled = config.sources.indeed?.enabled === true;
    if (indeedEnabled) {
      logger.info('Indeed scraper is enabled - adding to scrapers list');
      scrapers.push(new IndeedSeleniumScraper());
    } else {
      logger.info('Indeed scraper is disabled in config - skipping');
    }
    
    // Add Monster scraper only if enabled in config
    const monsterEnabled = config.sources.monster?.enabled === true;
    if (monsterEnabled) {
      logger.info('Monster scraper is enabled - adding to scrapers list');
      scrapers.push(new MonsterJobScraper());
    } else {
      logger.info('Monster scraper is disabled in config - skipping');
    }
    
    // Add JobSpy Indeed scraper only if enabled in config
    const jobspyIndeedEnabled = config.sources.jobspy_indeed?.enabled === true;
    if (jobspyIndeedEnabled) {
      logger.info('JobSpy Indeed scraper is enabled - adding to scrapers list');
      scrapers.push(new JobSpyIndeedScraper());
    } else {
      logger.info('JobSpy Indeed scraper is disabled in config - skipping');
    }
    
    // Run each scraper and collect results
    const allJobs = [];
    const scrapeResults = {};
    
    for (const scraper of scrapers) {
      const scraperName = scraper.name;
      logger.info(`Running ${scraperName} scraper`);
      
      try {
        // Add extra timeout handling for API/Selenium scrapers
        let jobs = [];
        if (scraperName === 'IndeedSelenium' || scraperName === 'MonsterAPI' || scraperName === 'JobSpyIndeed') {
          // Create promise with timeout for API/Selenium scrapers
          const timeout = 5 * 60 * 1000; // 5 minutes maximum
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout: ${scraperName} scraper took too long`)), timeout);
          });
          
          try {
            jobs = await Promise.race([
              scraper.scrape(),
              timeoutPromise
            ]);
          } catch (timeoutError) {
            logger.error(`${scraperName} scraper timed out after ${timeout/1000} seconds: ${timeoutError.message}`);
            jobs = [];
          }
        } else {
          // Normal execution for other scrapers
          jobs = await scraper.scrape();
        }
        
        scrapeResults[scraperName] = {
          total: jobs.length,
          jobs: jobs
        };
        
        logger.info(`${scraperName} found ${jobs.length} jobs`);
        allJobs.push(...jobs);
      } catch (error) {
        logger.error(`Error running ${scraperName} scraper: ${error.message}`);
        scrapeResults[scraperName] = {
          total: 0,
          jobs: [],
          error: error.message
        };
      }
    }
    
    // Apply quality filter to combined results
    logger.info(`Total jobs found: ${allJobs.length}`);
    const filteredJobs = qualityFilter.filterJobs(allJobs);
    logger.info(`After quality filtering: ${filteredJobs.length} jobs remain`);
    
    // Save individual scraper results
    for (const [scraperName, result] of Object.entries(scrapeResults)) {
      const scraperResultsPath = path.join(resultsDir, `${scraperName.toLowerCase()}-results.json`);
      await fs.writeFile(scraperResultsPath, JSON.stringify(result.jobs, null, 2));
      logger.info(`Saved ${result.total} jobs from ${scraperName} to ${scraperResultsPath}`);
    }
    
    // Save combined results
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const rawResultsPath = path.join(resultsDir, `combined-raw-results-${timestamp}.json`);
    const filteredResultsPath = path.join(resultsDir, `combined-filtered-results-${timestamp}.json`);
    
    await fs.writeFile(rawResultsPath, JSON.stringify(allJobs, null, 2));
    await fs.writeFile(filteredResultsPath, JSON.stringify(filteredJobs, null, 2));
    
    logger.info(`Raw combined results (${allJobs.length} jobs) saved to ${rawResultsPath}`);
    logger.info(`Filtered combined results (${filteredJobs.length} jobs) saved to ${filteredResultsPath}`);
    
    // Generate a summary report
    const summaryReport = {
      timestamp: new Date().toISOString(),
      totalJobsFound: allJobs.length,
      totalJobsAfterFiltering: filteredJobs.length,
      scraperStats: {},
      settings: {
        indeedEnabled,
        monsterEnabled,
        jobspyIndeedEnabled
      }
    };
    
    for (const [scraperName, result] of Object.entries(scrapeResults)) {
      summaryReport.scraperStats[scraperName] = {
        totalJobs: result.total,
        error: result.error || null
      };
    }
    
    const summaryPath = path.join(resultsDir, `scraper-summary-${timestamp}.json`);
    await fs.writeFile(summaryPath, JSON.stringify(summaryReport, null, 2));
    logger.info(`Scraper summary saved to ${summaryPath}`);
    
    // Store results in database if connected
    if (database.isConnected()) {
      logger.info(`Storing ${filteredJobs.length} filtered jobs in database`);
      try {
        // Use database.bulkSaveJobs instead of trying to access collection directly
        const saveResult = await database.bulkSaveJobs(filteredJobs);
        logger.info(`Successfully stored jobs in database: ${saveResult.inserted} inserted, ${saveResult.updated} updated`);
      } catch (dbError) {
        logger.error(`Error storing jobs in database: ${dbError.message}`);
      }
    }
    
    // Disconnect from database
    await database.disconnect();
    logger.info('Database disconnected');
    
    return {
      summary: summaryReport,
      filteredJobs
    };
  } catch (error) {
    logger.error(`Error running scrapers: ${error.message}`);
    if (database.isConnected()) {
      await database.disconnect();
    }
    throw error;
  }
}

// Run the combined scrapers
runAllScrapers()
  .then(result => {
    logger.info(`Successfully completed all scrapers with ${result.filteredJobs.length} filtered jobs`);
    process.exit(0);
  })
  .catch(error => {
    logger.error(`Failed to complete scrapers: ${error.message}`);
    process.exit(1);
  }); 