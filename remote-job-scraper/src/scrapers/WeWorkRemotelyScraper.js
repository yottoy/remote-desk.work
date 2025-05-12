const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const config = require('../../config/config');

class WeWorkRemotelyScraper extends BaseScraper {
  constructor() {
    super('WeWorkRemotely');
    this.baseUrl = config.sources.weworkremotely.baseUrl;
    this.categories = config.sources.weworkremotely.categories;
  }

  /**
   * Scrape jobs from We Work Remotely
   * @returns {Array} - Array of job objects
   */
  async scrape() {
    try {
      await this.init();
      logger.info(`Starting to scrape jobs from We Work Remotely`);
      
      const jobs = [];
      
      // Scrape each category
      for (const category of this.categories) {
        try {
          const categoryJobs = await this.scrapeCategory(category);
          jobs.push(...categoryJobs);
          
          // Respect rate limits between categories
          await this.delay(this.config.rateLimitMs);
        } catch (error) {
          logger.error(`Error scraping We Work Remotely category ${category}: ${error.message}`);
          continue; // Continue with next category
        }
      }
      
      logger.info(`Finished scraping We Work Remotely, found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      logger.error(`Error scraping We Work Remotely: ${error.message}`);
      return [];
    } finally {
      await this.close();
    }
  }

  /**
   * Scrape jobs from a specific category
   * @param {string} category - Category to scrape
   * @returns {Array} - Array of job objects for the category
   */
  async scrapeCategory(category) {
    const categoryUrl = `${this.baseUrl}/categories/${category}`;
    logger.info(`Scraping We Work Remotely category: ${category}`);
    
    const success = await this.navigateTo(categoryUrl);
    if (!success) {
      logger.error(`Failed to navigate to We Work Remotely category: ${category}`);
      return [];
    }
    
    try {
      // Wait for job listings to load
      await this.waitForSelector('.jobs');
      
      // Get all job listings
      const jobElements = await this.page.$$('.jobs > article > ul > li:not(.view-all)');
      logger.info(`Found ${jobElements.length} job listings in category ${category}`);
      
      const jobs = [];
      
      // Process each job listing
      for (const jobElement of jobElements) {
        try {
          // Extract job data
          const titleElement = await jobElement.$('a > span.title');
          const companyElement = await jobElement.$('a > span.company');
          const dateElement = await jobElement.$('a > span.date');
          const linkElement = await jobElement.$('a');
          
          if (!titleElement || !companyElement || !linkElement) {
            logger.debug('Skipping job listing with missing essential elements');
            continue;
          }
          
          // Get job details
          const title = await titleElement.textContent().then(text => text.trim());
          const company = await companyElement.textContent().then(text => text.trim());
          const datePosted = await dateElement?.textContent().then(text => text?.trim() || '');
          const relativeUrl = await linkElement.getAttribute('href');
          
          // Skip if missing essential data
          if (!title || !company || !relativeUrl) {
            logger.debug('Skipping job listing with missing essential data');
            continue;
          }
          
          // Create full job URL
          const url = `${this.baseUrl}${relativeUrl}`;
          
          // Get job details page
          const jobDetails = await this.scrapeJobDetails(url);
          
          // Create job object
          const job = {
            title,
            company,
            url,
            source: 'weworkremotely',
            postedDate: this.parseDate(datePosted),
            ...jobDetails
          };
          
          jobs.push(job);
          logger.debug(`Scraped job: ${job.title} at ${job.company}`);
          
          // Respect rate limits between job detail page visits
          await this.delay(this.config.rateLimitMs);
        } catch (error) {
          logger.error(`Error processing We Work Remotely job listing: ${error.message}`);
          continue; // Continue with next job listing
        }
      }
      
      return jobs;
    } catch (error) {
      logger.error(`Error scraping We Work Remotely category ${category}: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape details for a specific job
   * @param {string} url - Job URL to scrape details from
   * @returns {Object} - Job details
   */
  async scrapeJobDetails(url) {
    logger.debug(`Scraping job details from ${url}`);
    
    const success = await this.navigateTo(url);
    if (!success) {
      logger.error(`Failed to navigate to job details page: ${url}`);
      return {};
    }
    
    try {
      // Wait for job description to load
      await this.waitForSelector('.listing-container');
      
      // Extract job description
      const description = await this.page.$eval('.listing-container', 
        el => el.outerHTML
      ).catch(() => '');
      
      // Extract plain text description for analysis
      const descriptionText = await this.page.$eval('.listing-container', 
        el => el.textContent
      ).catch(() => '');
      
      // Extract location
      const location = await this.extractText('.company-card h3').catch(() => 'Remote');
      
      // Extract salary if available
      const salary = await this.extractText('.salary').catch(() => '');
      
      return {
        description,
        descriptionText,
        location: location || 'Remote',
        salary
      };
    } catch (error) {
      logger.error(`Error scraping We Work Remotely job details from ${url}: ${error.message}`);
      return {};
    }
  }
}

module.exports = WeWorkRemotelyScraper; 