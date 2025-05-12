const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const config = require('../../config/config');

class RemoteCoScraper extends BaseScraper {
  constructor() {
    super('RemoteCo');
    this.baseUrl = config.sources.remoteco.baseUrl;
    this.categories = config.sources.remoteco.categories;
  }

  /**
   * Scrape jobs from Remote.co
   * @returns {Array} - Array of job objects
   */
  async scrape() {
    try {
      await this.init();
      logger.info(`Starting to scrape jobs from Remote.co`);
      
      const jobs = [];
      
      // Scrape each category
      for (const category of this.categories) {
        try {
          const categoryJobs = await this.scrapeCategory(category);
          jobs.push(...categoryJobs);
          
          // Respect rate limits between categories
          await this.delay(this.config.rateLimitMs);
        } catch (error) {
          logger.error(`Error scraping Remote.co category ${category}: ${error.message}`);
          continue; // Continue with next category
        }
      }
      
      logger.info(`Finished scraping Remote.co, found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      logger.error(`Error scraping Remote.co: ${error.message}`);
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
    const categoryUrl = `${this.baseUrl}/${category}`;
    logger.info(`Scraping Remote.co category: ${category}`);
    
    const success = await this.navigateTo(categoryUrl);
    if (!success) {
      logger.error(`Failed to navigate to Remote.co category: ${category}`);
      return [];
    }
    
    try {
      // Wait for job listings to load
      await this.waitForSelector('.job_listings');
      
      // Get all job listings
      const jobElements = await this.page.$$('.job_listing');
      logger.info(`Found ${jobElements.length} job listings in category ${category}`);
      
      const jobs = [];
      
      // Process each job listing
      for (const jobElement of jobElements) {
        try {
          // Extract job data
          const titleElement = await jobElement.$('.position > h3');
          const companyElement = await jobElement.$('.company > strong');
          const dateElement = await jobElement.$('.date');
          const linkElement = await jobElement.$('a.job_listing-clickbox');
          
          if (!titleElement || !companyElement || !linkElement) {
            logger.debug('Skipping job listing with missing essential elements');
            continue;
          }
          
          // Get job details
          const title = await titleElement.textContent().then(text => text.trim());
          const company = await companyElement.textContent().then(text => text.trim());
          const datePosted = await dateElement?.textContent().then(text => text?.trim() || '');
          const url = await linkElement.getAttribute('href');
          
          // Skip if missing essential data
          if (!title || !company || !url) {
            logger.debug('Skipping job listing with missing essential data');
            continue;
          }
          
          // Get job details page
          const jobDetails = await this.scrapeJobDetails(url);
          
          // Create job object
          const job = {
            title,
            company,
            url,
            source: 'remoteco',
            postedDate: this.parseDate(datePosted),
            ...jobDetails
          };
          
          jobs.push(job);
          logger.debug(`Scraped job: ${job.title} at ${job.company}`);
          
          // Respect rate limits between job detail page visits
          await this.delay(this.config.rateLimitMs);
        } catch (error) {
          logger.error(`Error processing Remote.co job listing: ${error.message}`);
          continue; // Continue with next job listing
        }
      }
      
      return jobs;
    } catch (error) {
      logger.error(`Error scraping Remote.co category ${category}: ${error.message}`);
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
      await this.waitForSelector('.job_description');
      
      // Extract job description
      const description = await this.page.$eval('.job_description', 
        el => el.outerHTML
      ).catch(() => '');
      
      // Extract plain text description for analysis
      const descriptionText = await this.page.$eval('.job_description', 
        el => el.textContent
      ).catch(() => '');
      
      // Extract location
      const location = await this.extractText('.location_sm').catch(() => 'Remote');
      
      // Extract tags/categories
      const tagsElements = await this.page.$$('.job-type');
      const tags = [];
      
      for (const tagElement of tagsElements) {
        const tag = await tagElement.textContent();
        if (tag) {
          tags.push(tag.trim());
        }
      }
      
      // Extract salary if available (Remote.co doesn't typically show salary, but adding for completeness)
      const salary = await this.extractText('.job_salary').catch(() => '');
      
      return {
        description,
        descriptionText,
        location: location || 'Remote',
        salary,
        tags
      };
    } catch (error) {
      logger.error(`Error scraping Remote.co job details from ${url}: ${error.message}`);
      return {};
    }
  }
}

module.exports = RemoteCoScraper; 