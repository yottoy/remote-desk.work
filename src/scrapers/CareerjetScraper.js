const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const config = require('../../config/config');
const bypasser = require('../utils/bypasser');

class CareerjetScraper extends BaseScraper {
  constructor() {
    super('Careerjet');
    this.baseUrl = config.sources.careerjet.baseUrl;
    this.searches = config.sources.careerjet.searches;
  }

  /**
   * Scrape jobs from Careerjet
   * @returns {Array} - Array of job objects
   */
  async scrape() {
    try {
      await this.init();
      logger.info(`Starting to scrape jobs from Careerjet`);
      
      // Apply additional anti-detection techniques
      await bypasser.hideAutomationFootprints(this.page);
      
      const jobs = [];
      
      // Scrape each search term
      for (const search of this.searches) {
        try {
          // Add longer delay between searches to avoid rate limiting
          await bypasser.randomDelay(10000, 30000);
          
          const searchJobs = await this.scrapeSearch(search);
          jobs.push(...searchJobs);
          
          // Respect rate limits between searches
          await bypasser.randomDelay(15000, 45000);
        } catch (error) {
          logger.error(`Error scraping Careerjet search ${search}: ${error.message}`);
          continue; // Continue with next search
        }
      }
      
      logger.info(`Finished scraping Careerjet, found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      logger.error(`Error scraping Careerjet: ${error.message}`);
      return [];
    } finally {
      await this.close();
    }
  }

  /**
   * Construct the search URL
   * @param {string} searchTerm - Search term
   * @returns {string} - Full search URL
   */
  getSearchUrl(searchTerm) {
    // Encode the search term
    const encodedSearch = encodeURIComponent(searchTerm);
    
    // Create search URL
    return `${this.baseUrl}/search/jobs?s=${encodedSearch}&l=remote`;
  }

  /**
   * Scrape jobs from a specific search
   * @param {string} search - Search term
   * @returns {Array} - Array of job objects for the search
   */
  async scrapeSearch(search) {
    const searchUrl = this.getSearchUrl(search);
    logger.info(`Scraping Careerjet search: ${search}`);
    
    // Handle cookie consent before navigation
    try {
      await this.page.evaluate(() => {
        // Try to handle cookie banners and other popups
        const selectors = [
          '[id*="cookie"] button', 
          '[class*="cookie"] button',
          '[id*="consent"] button',
          '[id*="consent"] a',
          'button[id*="accept"]',
          'button[class*="accept"]',
          'a[id*="accept"]'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el.innerText.toLowerCase().includes('accept') || 
                el.innerText.toLowerCase().includes('agree') ||
                el.innerText.toLowerCase().includes('okay') || 
                el.innerText.toLowerCase().includes('ok')) {
              el.click();
              console.log('Clicked consent button:', el);
            }
          });
        });
      });
    } catch (error) {
      logger.debug(`Error handling cookie consent: ${error.message}`);
    }
    
    const success = await this.navigateTo(searchUrl);
    if (!success) {
      logger.error(`Failed to navigate to Careerjet search: ${search}`);
      return [];
    }
    
    try {
      // Perform some scrolling to mimic reading
      await this.page.evaluate(() => {
        window.scrollTo(0, 200);
      });
      await bypasser.randomDelay(2000, 4000);
      
      await this.page.evaluate(() => {
        window.scrollTo(0, 500);
      });
      await bypasser.randomDelay(1000, 3000);
      
      // Wait for job listings to load
      const jobsListSelector = '.job';
      await this.waitForSelector(jobsListSelector, { timeout: 60000 });
      
      // Get all job listings
      const jobElements = await this.page.$$('.job');
      logger.info(`Found ${jobElements.length} job listings for search "${search}"`);
      
      const jobs = [];
      
      // Only process the first 5 jobs to avoid detection
      const jobsToProcess = jobElements.slice(0, 5);
      
      // Process each job listing
      for (const jobElement of jobsToProcess) {
        try {
          // Add random delay between processing each job
          await bypasser.randomDelay(1000, 3000);
          
          // Extract job data
          const titleElement = await jobElement.$('.job_loc > a');
          if (!titleElement) {
            logger.debug('Skipping job listing with missing title element');
            continue;
          }
          
          const title = await titleElement.textContent().then(text => text.trim());
          const url = await titleElement.getAttribute('href');
          
          // Get company name
          const companyElement = await jobElement.$('.company');
          const company = companyElement 
            ? await companyElement.textContent().then(text => text.trim()) 
            : '';
          
          // Get location
          const locationElement = await jobElement.$('.location');
          const location = locationElement 
            ? await locationElement.textContent().then(text => text.trim())
            : 'Remote';
          
          // Get posted date
          const dateElement = await jobElement.$('.site');
          const datePosted = dateElement 
            ? await dateElement.textContent().then(text => text.trim())
            : '';
          
          // Get brief description
          const descElement = await jobElement.$('.desc');
          const description = descElement 
            ? await descElement.textContent().then(text => text.trim())
            : '';
          
          // Get job details page if we have a valid URL
          let fullJobDetails = {};
          if (url) {
            const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
            
            // Skip job details to avoid too many requests
            // fullJobDetails = await this.scrapeJobDetails(fullUrl);
            
            // Create job object
            const job = {
              title,
              company,
              url: fullUrl,
              description,
              descriptionText: description,
              source: 'careerjet',
              postedDate: this.parseDate(datePosted),
              location: location || 'Remote',
              ...fullJobDetails
            };
            
            jobs.push(job);
            logger.debug(`Scraped job: ${job.title} at ${job.company}`);
          }
          
          // Respect rate limits between job scraping
          await bypasser.randomDelay(2000, 5000);
        } catch (error) {
          logger.error(`Error processing Careerjet job listing: ${error.message}`);
          continue; // Continue with next job listing
        }
      }
      
      return jobs;
    } catch (error) {
      logger.error(`Error scraping Careerjet search ${search}: ${error.message}`);
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
      // Add human-like scrolling behavior
      await bypasser.randomDelay(2000, 5000);
      
      // Scroll down gradually to simulate reading
      for (let i = 0; i < 5; i++) {
        await this.page.evaluate((scrollStep) => {
          window.scrollBy(0, scrollStep);
        }, Math.floor(Math.random() * 300) + 100);
        
        await bypasser.randomDelay(1000, 3000);
      }
      
      // Wait for job description to load
      await this.waitForSelector('.content-main', { timeout: 60000 });
      
      // Random delay before extraction
      await bypasser.randomDelay(2000, 6000);
      
      // Extract full job description
      const description = await this.page.$eval('.content-main', 
        el => el.outerHTML
      ).catch(() => '');
      
      // Extract plain text description for analysis
      const descriptionText = await this.page.$eval('.content-main', 
        el => el.textContent
      ).catch(() => '');
      
      // Scroll back to top before leaving
      await this.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      
      await bypasser.randomDelay(1000, 3000);
      
      return {
        description,
        descriptionText
      };
    } catch (error) {
      logger.error(`Error scraping Careerjet job details from ${url}: ${error.message}`);
      return {};
    }
  }
}

module.exports = CareerjetScraper; 