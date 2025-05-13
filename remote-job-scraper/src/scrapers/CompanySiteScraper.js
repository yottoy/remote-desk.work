const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const config = require('../../config/config');
const bypasser = require('../utils/bypasser');

class CompanySiteScraper extends BaseScraper {
  constructor() {
    super('CompanySite');
    this.sites = config.sources.companySites.sites;
  }
  
  /**
   * Scrape jobs from all company sites
   * @returns {Array} - Array of job objects
   */
  async scrape() {
    try {
      await this.init();
      logger.info('Starting to scrape jobs from company sites');
      
      // Apply additional anti-detection techniques
      await bypasser.hideAutomationFootprints(this.page);
      
      const jobs = [];
      
      // Scrape each company site
      for (const site of this.sites) {
        if (!site.enabled) {
          logger.info(`Skipping disabled site: ${site.name}`);
          continue;
        }
        
        try {
          // Add longer delay between sites to avoid rate limiting
          await bypasser.randomDelay(10000, 30000);
          
          // Set the name for this specific site
          this.name = `CompanySite-${site.name}`;
          
          const siteJobs = await this.scrapeSite(site);
          jobs.push(...siteJobs);
          
          // Respect rate limits between sites
          await bypasser.randomDelay(15000, 45000);
        } catch (error) {
          logger.error(`Error scraping company site ${site.name}: ${error.message}`);
          continue; // Continue with next site
        }
      }
      
      logger.info(`Finished scraping company sites, found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      logger.error(`Error scraping company sites: ${error.message}`);
      return [];
    } finally {
      await this.close();
    }
  }

  /**
   * Scrape jobs from a specific company site
   * @param {Object} site - Site configuration
   * @returns {Array} - Array of job objects for the site
   */
  async scrapeSite(site) {
    logger.info(`Scraping jobs from ${site.name} at ${site.url}`);
    
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
    
    const success = await this.navigateTo(site.url);
    if (!success) {
      logger.error(`Failed to navigate to ${site.name} at ${site.url}`);
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
      
      // Different sites have different selectors, so we try a few common ones
      const commonJobSelectors = [
        // Common job list selectors
        '.jobs-list', '.careers-list', '.job-listings', 
        '.vacancies', '.job-list', '.open-positions',
        // Common job item selectors for direct list selection
        '.job-item', '.job-card', '.job-listing', 
        '.job-posting', '.vacancy', '.career-item',
        // Table based listings
        'table.jobs', 'table.job-list', 'table.careers'
      ];
      
      // Wait for any of the common selectors to appear
      let jobItems = [];
      let foundSelector = null;
      
      // Check each selector
      for (const selector of commonJobSelectors) {
        try {
          const exists = await this.page.$(selector);
          if (exists) {
            foundSelector = selector;
            
            // If this is a container selector, look for job items within it
            if (['.jobs-list', '.careers-list', '.job-listings', '.vacancies', '.job-list', '.open-positions'].includes(selector)) {
              jobItems = await this.page.$$(`${selector} > *`);
            } else if (selector.startsWith('table')) {
              // Handle table-based job listings
              jobItems = await this.page.$$(`${selector} tr:not(:first-child)`);
            } else {
              // This is a direct job item selector
              jobItems = await this.page.$$(selector);
            }
            
            if (jobItems.length > 0) {
              logger.info(`Found ${jobItems.length} job listings using selector: ${selector}`);
              break;
            }
          }
        } catch (error) {
          // Continue to the next selector
        }
      }
      
      // If no common selector worked, try a more generic approach to find any links
      if (jobItems.length === 0) {
        logger.debug(`No jobs found with common selectors, trying generic approach`);
        jobItems = await this.page.$$('a[href*="job"], a[href*="career"], a[href*="position"]');
        foundSelector = 'generic-links';
      }
      
      logger.info(`Found ${jobItems.length} job listings at ${site.name}`);
      
      const jobs = [];
      
      // Only process the first 5-10 jobs to avoid detection
      const jobsToProcess = jobItems.slice(0, Math.min(10, jobItems.length));
      
      // Process each job listing based on what selector we found
      for (const jobItem of jobsToProcess) {
        try {
          // Add random delay between processing each job
          await bypasser.randomDelay(1000, 3000);
          
          // Extract job data based on the type of element we found
          let title = '';
          let url = '';
          let company = site.name;
          let description = '';
          
          if (foundSelector === 'generic-links') {
            // Handle generic link approach
            title = await jobItem.textContent().then(text => text.trim());
            url = await jobItem.getAttribute('href');
          } else if (foundSelector.startsWith('table')) {
            // Handle table-based listings
            const titleEl = await jobItem.$('td:first-child');
            const linkEl = await jobItem.$('a');
            title = titleEl ? await titleEl.textContent().then(text => text.trim()) : '';
            url = linkEl ? await linkEl.getAttribute('href') : '';
          } else {
            // Try common elements for structured job listings
            const titleEl = await jobItem.$('h2, h3, h4, .title, .job-title');
            const linkEl = await jobItem.$('a');
            const descEl = await jobItem.$('.description, .summary, .excerpt, p');
            
            title = titleEl ? await titleEl.textContent().then(text => text.trim()) : '';
            url = linkEl ? await linkEl.getAttribute('href') : '';
            description = descEl ? await descEl.textContent().then(text => text.trim()) : '';
            
            // If no title found in sub-element, try the item itself
            if (!title && jobItem) {
              title = await jobItem.textContent().then(text => text.trim());
            }
          }
          
          // Skip if we don't have at least a title
          if (!title) {
            logger.debug('Skipping job listing with missing title');
            continue;
          }
          
          // Ensure URL is absolute
          if (url && !url.startsWith('http')) {
            // Handle relative URLs
            if (url.startsWith('/')) {
              const siteUrl = new URL(site.url);
              url = `${siteUrl.protocol}//${siteUrl.host}${url}`;
            } else {
              url = new URL(url, site.url).href;
            }
          }
          
          // Skip job details page to avoid too many requests
          // let fullJobDetails = {};
          // if (url) {
          //   fullJobDetails = await this.scrapeJobDetails(url);
          // }
          
          // Create job object
          const job = {
            title,
            company,
            url,
            description,
            descriptionText: description,
            source: `company-${site.name.toLowerCase().replace(/\s+/g, '-')}`,
            postedDate: new Date().toISOString(), // Most company sites don't have easily scrapable dates
            location: 'Remote',
            credibilityScore: site.credibilityScore || 7
            // ...fullJobDetails
          };
          
          jobs.push(job);
          logger.debug(`Scraped job: ${job.title} at ${job.company}`);
          
          // Respect rate limits between job scraping
          await bypasser.randomDelay(2000, 5000);
        } catch (error) {
          logger.error(`Error processing job listing for ${site.name}: ${error.message}`);
          continue; // Continue with next job listing
        }
      }
      
      return jobs;
    } catch (error) {
      logger.error(`Error scraping company site ${site.name}: ${error.message}`);
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
      
      // Try to find job description using common selectors
      const descriptionSelectors = [
        '.job-description', '.description', '.job-details',
        '.position-description', '.vacancy-description',
        '#job-description', '#description', 
        'article', '.main-content', '.content'
      ];
      
      let description = '';
      let descriptionText = '';
      
      for (const selector of descriptionSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            description = await element.evaluate(el => el.outerHTML);
            descriptionText = await element.evaluate(el => el.textContent);
            break;
          }
        } catch (error) {
          // Try next selector
          continue;
        }
      }
      
      // If no specific container found, use body as fallback
      if (!description) {
        try {
          const bodyContent = await this.page.$('body');
          if (bodyContent) {
            description = await bodyContent.evaluate(el => el.outerHTML);
            descriptionText = await bodyContent.evaluate(el => el.textContent);
          }
        } catch (error) {
          logger.error(`Error getting page content: ${error.message}`);
        }
      }
      
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
      logger.error(`Error scraping job details from ${url}: ${error.message}`);
      return {};
    }
  }
}

module.exports = CompanySiteScraper; 