const logger = require('../utils/logger');
const database = require('../utils/database');
const qualityFilter = require('../utils/qualityFilter');
const WeWorkRemotelyScraper = require('../scrapers/WeWorkRemotelyScraper');
const RemoteCoScraper = require('../scrapers/RemoteCoScraper');
const IndeedScraper = require('../scrapers/IndeedScraper');

/**
 * Main controller for scraping jobs
 * @class ScrapeController
 */
class ScrapeController {
  constructor() {
    this.scrapers = [
      new WeWorkRemotelyScraper(),
      new RemoteCoScraper(),
      new IndeedScraper()
    ];
  }

  /**
   * Run the full scraping process
   * @returns {Promise<Object>} - Scrape results summary
   */
  async runScrape() {
    logger.info('Starting job scrape process');
    
    try {
      // Connect to database
      await database.connect();
      
      // Track statistics
      const stats = {
        totalScraped: 0,
        filteredOut: 0,
        saved: 0,
        errors: 0,
        sources: {}
      };
      
      // Run each scraper
      for (const scraper of this.scrapers) {
        try {
          logger.info(`Running scraper: ${scraper.name}`);
          
          // Scrape jobs
          const scrapedJobs = await scraper.scrape();
          
          if (!scrapedJobs || !Array.isArray(scrapedJobs)) {
            logger.error(`Scraper ${scraper.name} returned invalid results`);
            stats.errors++;
            continue;
          }
          
          logger.info(`${scraper.name} scraped ${scrapedJobs.length} jobs`);
          
          // Add to total count
          stats.totalScraped += scrapedJobs.length;
          
          // Initialize source stats if not exists
          if (!stats.sources[scraper.name]) {
            stats.sources[scraper.name] = {
              scraped: 0,
              filtered: 0,
              saved: 0
            };
          }
          
          stats.sources[scraper.name].scraped = scrapedJobs.length;
          
          // Filter jobs for quality
          const filteredJobs = qualityFilter.filterJobs(scrapedJobs);
          
          // Update filtered count
          const filteredOutCount = scrapedJobs.length - filteredJobs.length;
          stats.filteredOut += filteredOutCount;
          stats.sources[scraper.name].filtered = filteredOutCount;
          
          logger.info(`${scraper.name}: ${filteredJobs.length} jobs passed quality filter, ${filteredOutCount} filtered out`);
          
          if (filteredJobs.length > 0) {
            // Save jobs to database
            const saveResult = await database.bulkSaveJobs(filteredJobs);
            
            // Update saved count
            stats.saved += saveResult.inserted + saveResult.updated;
            stats.sources[scraper.name].saved = saveResult.inserted + saveResult.updated;
            
            logger.info(`${scraper.name}: Saved ${saveResult.inserted} new jobs, updated ${saveResult.updated} existing jobs`);
          }
        } catch (error) {
          logger.error(`Error running scraper ${scraper.name}: ${error.message}`);
          stats.errors++;
        }
      }
      
      // Get database stats
      const dbStats = await database.getStats();
      
      // Combine all stats
      const results = {
        scrape: stats,
        database: dbStats,
        timestamp: new Date()
      };
      
      logger.info('Job scrape process completed successfully');
      logger.info(`Summary: Scraped ${stats.totalScraped} jobs, filtered out ${stats.filteredOut}, saved ${stats.saved}`);
      
      return results;
    } catch (error) {
      logger.error(`Error in scrape process: ${error.message}`);
      throw error;
    } finally {
      // Close database connection
      await database.disconnect();
    }
  }
}

module.exports = new ScrapeController(); 