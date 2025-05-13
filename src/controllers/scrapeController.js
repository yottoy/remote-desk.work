const logger = require('../utils/logger');
const database = require('../utils/database');
const JobSpyIndeedScraper = require('../scrapers/JobSpyIndeedScraper');
const JobSpyLinkedInScraper = require('../scrapers/JobSpyLinkedInScraper');
const JobSpyGlassdoorScraper = require('../scrapers/JobSpyGlassdoorScraper');
const JobSpyGoogleScraper = require('../scrapers/JobSpyGoogleScraper');
const JobSpyZipRecruiterScraper = require('../scrapers/JobSpyZipRecruiterScraper');
const JobSpyBaytScraper = require('../scrapers/JobSpyBaytScraper');
const JobSpyNaukriScraper = require('../scrapers/JobSpyNaukriScraper');
const config = require('../../config/config');

/**
 * Controller for running the scraping process
 */
class ScrapeController {
  constructor() {
    this.scrapers = [];
    this.results = {
      scrape: {
        totalScraped: 0,
        filteredOut: 0,
        saved: 0
      },
      database: {
        totalJobs: 0,
        featuredJobs: 0
      }
    };
  }

  /**
   * Initialize scrapers based on configuration
   */
  initializeScrapers() {
    this.scrapers = [];
    
    // Initialize JobSpy Indeed scraper if enabled
    if (process.env.ENABLE_JOBSPY_INDEED === 'true' && 
        config.sources.jobspy_indeed && 
        config.sources.jobspy_indeed.enabled) {
      logger.info('Initializing JobSpy Indeed scraper');
      this.scrapers.push(new JobSpyIndeedScraper());
    } else {
      logger.info('JobSpy Indeed scraper is disabled');
    }
    
    // Initialize JobSpy LinkedIn scraper if enabled
    if (process.env.ENABLE_JOBSPY_LINKEDIN === 'true' && 
        config.sources.jobspy_linkedin && 
        config.sources.jobspy_linkedin.enabled) {
      logger.info('Initializing JobSpy LinkedIn scraper');
      this.scrapers.push(new JobSpyLinkedInScraper());
    } else {
      logger.info('JobSpy LinkedIn scraper is disabled');
    }
    
    // Initialize JobSpy Glassdoor scraper if enabled
    if (process.env.ENABLE_JOBSPY_GLASSDOOR === 'true' && 
        config.sources.jobspy_glassdoor && 
        config.sources.jobspy_glassdoor.enabled) {
      logger.info('Initializing JobSpy Glassdoor scraper');
      this.scrapers.push(new JobSpyGlassdoorScraper());
    } else {
      logger.info('JobSpy Glassdoor scraper is disabled');
    }
    
    // Initialize JobSpy Google scraper if enabled
    if (process.env.ENABLE_JOBSPY_GOOGLE === 'true' && 
        config.sources.jobspy_google && 
        config.sources.jobspy_google.enabled) {
      logger.info('Initializing JobSpy Google scraper');
      this.scrapers.push(new JobSpyGoogleScraper());
    } else {
      logger.info('JobSpy Google scraper is disabled');
    }
    
    // Initialize JobSpy ZipRecruiter scraper if enabled
    if (process.env.ENABLE_JOBSPY_ZIPRECRUITER === 'true' && 
        config.sources.jobspy_ziprecruiter && 
        config.sources.jobspy_ziprecruiter.enabled) {
      logger.info('Initializing JobSpy ZipRecruiter scraper');
      this.scrapers.push(new JobSpyZipRecruiterScraper());
    } else {
      logger.info('JobSpy ZipRecruiter scraper is disabled');
    }
    
    // Initialize JobSpy Bayt scraper if enabled
    if (process.env.ENABLE_JOBSPY_BAYT === 'true' && 
        config.sources.jobspy_bayt && 
        config.sources.jobspy_bayt.enabled) {
      logger.info('Initializing JobSpy Bayt scraper');
      this.scrapers.push(new JobSpyBaytScraper());
    } else {
      logger.info('JobSpy Bayt scraper is disabled');
    }
    
    // Initialize JobSpy Naukri scraper if enabled
    if (process.env.ENABLE_JOBSPY_NAUKRI === 'true' && 
        config.sources.jobspy_naukri && 
        config.sources.jobspy_naukri.enabled) {
      logger.info('Initializing JobSpy Naukri scraper');
      this.scrapers.push(new JobSpyNaukriScraper());
    } else {
      logger.info('JobSpy Naukri scraper is disabled');
    }
    
    // Add other scrapers here as needed
    
    logger.info(`Initialized ${this.scrapers.length} scrapers`);
  }
  
  /**
   * Run the scrape process with all enabled scrapers
   * @returns {Promise<Object>} - Scrape results
   */
  async runScrape() {
    try {
      logger.info('Starting scrape process');
      
      // Initialize scrapers
      this.initializeScrapers();
      
      if (this.scrapers.length === 0) {
        logger.warn('No scrapers enabled');
        return this.results;
      }
      
      // Connect to database
      await database.connect();
      
      // Run each scraper and collect results
      const allJobs = [];
      
      for (const scraper of this.scrapers) {
        try {
          logger.info(`Running scraper: ${scraper.name}`);
          const jobs = await scraper.scrape();
          
          logger.info(`Scraper ${scraper.name} found ${jobs.length} jobs`);
          allJobs.push(...jobs);
        } catch (error) {
          logger.error(`Error running scraper ${scraper.name}: ${error.message}`);
        }
      }
      
      this.results.scrape.totalScraped = allJobs.length;
      
      // Save jobs to database
      if (allJobs.length > 0) {
        logger.info(`Saving ${allJobs.length} jobs to database`);
        const saveStats = await database.saveJobs(allJobs);
        
        this.results.scrape.saved = saveStats.saved;
        this.results.scrape.filteredOut = saveStats.duplicates + saveStats.errors;
      }
      
      // Get updated database stats
      const dbStats = await database.getStats();
      this.results.database = dbStats;
      
      logger.info('Scrape process completed');
      return this.results;
    } catch (error) {
      logger.error(`Error in scrape process: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
const scrapeController = new ScrapeController();
module.exports = scrapeController; 