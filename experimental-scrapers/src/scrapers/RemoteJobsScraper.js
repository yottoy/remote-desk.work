const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const { 
  randomDelay, 
  cleanText, 
  extractSalary, 
  parseRelativeDate, 
  isLikelyRemote,
  makeAbsoluteUrl 
} = require('../utils/helpers');

/**
 * Scraper for remotejobs.com
 */
class RemoteJobsScraper extends BaseScraper {
  constructor(config = {}) {
    super('RemoteJobs', {
      headless: true,
      timeout: 45000,
      maxRetries: 3,
      ...config
    });
    
    this.baseUrl = 'https://remotejobs.com';
    this.maxJobsPerPage = 30;
  }

  /**
   * Main scraping method
   */
  async scrape() {
    try {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize scraper');
      }

      logger.info('Starting RemoteJobs.com scraping');
      
      // Scrape the main page for recent jobs
      const jobs = await this.scrapeMainPage();
      
      logger.info(`RemoteJobs.com scraping completed. Found ${jobs.length} jobs`);
      return jobs;
      
    } catch (error) {
      logger.error(`RemoteJobs.com scraping failed: ${error.message}`);
      return [];
    } finally {
      await this.close();
    }
  }

  /**
   * Scrape the main page for recent jobs
   */
  async scrapeMainPage() {
    try {
      logger.info('Scraping RemoteJobs.com main page');
      
      const success = await this.navigateTo(this.baseUrl);
      if (!success) {
        throw new Error('Failed to navigate to main page');
      }

      await this.handlePopups();
      
      // Wait for the page to load completely (it's a Next.js app)
      await this.page.waitForTimeout(5000);
      
      // Wait for job listings to load - based on debug analysis
      const jobsLoaded = await this.waitForSelector('article.flex', {
        timeout: 15000
      });

      if (!jobsLoaded) {
        logger.warn('No job listings found on main page');
        return [];
      }

      await this.humanScroll();

      return await this.extractJobsFromPage();
      
    } catch (error) {
      logger.error(`Error scraping main page: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract jobs from the current page
   */
  async extractJobsFromPage() {
    try {
      // Based on debug analysis, jobs are in article elements with specific class
      const jobElements = await this.getAllElements('article.flex.md\\:items-center.space-x-4');
      
      if (jobElements.length === 0) {
        // Fallback to more generic selector
        const fallbackElements = await this.getAllElements('article');
        logger.debug(`Found ${fallbackElements.length} article elements as fallback`);
        
        if (fallbackElements.length === 0) {
          logger.warn('No job elements found with any selector');
          return [];
        }
        
        // Use fallback elements
        jobElements.push(...fallbackElements);
      }

      logger.debug(`Found ${jobElements.length} job elements`);

      const jobs = [];
      const maxJobs = Math.min(jobElements.length, this.maxJobsPerPage);

      for (let i = 0; i < maxJobs; i++) {
        try {
          const jobElement = jobElements[i];
          const job = await this.extractJobFromElement(jobElement);
          
          if (job && job.title && job.company) {
            jobs.push(job);
          }
          
          // Small delay between extractions
          await randomDelay(500, 1500);
          
        } catch (error) {
          logger.debug(`Error extracting job ${i}: ${error.message}`);
          continue;
        }
      }

      logger.info(`Extracted ${jobs.length} jobs from page`);
      return jobs;
      
    } catch (error) {
      logger.error(`Error extracting jobs from page: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract job data from a single job element
   */
  async extractJobFromElement(jobElement) {
    try {
      // Get the full text content first
      const fullText = await jobElement.textContent();
      
      if (!fullText || fullText.length < 20) {
        return null;
      }

      // Extract job URL from the parent link
      let url = '';
      try {
        const linkElement = await jobElement.$('xpath=ancestor-or-self::a');
        if (linkElement) {
          url = await linkElement.getAttribute('href');
        }
      } catch (error) {
        // Try to find a link within the element
        const innerLink = await jobElement.$('a');
        if (innerLink) {
          url = await innerLink.getAttribute('href');
        }
      }

      // Parse the text content to extract job details
      // Format appears to be: "Company—Job Title Location Time ago Salary,Type,Category Tags"
      const textParts = fullText.split('—');
      
      let company = '';
      let title = '';
      let location = 'Remote';
      let postedDate = new Date();
      let salary = '';
      
      if (textParts.length >= 2) {
        company = cleanText(textParts[0]);
        
        // The rest contains title, location, time, salary, etc.
        const remainder = textParts[1];
        
        // Try to extract components using patterns
        // Look for location patterns (North America, Europe, etc.)
        const locationMatch = remainder.match(/(North America|Europe|Asia|Africa|Australia|South America|Remote)/i);
        if (locationMatch) {
          location = locationMatch[1];
          
          // Title is everything before the location
          const titlePart = remainder.substring(0, locationMatch.index).trim();
          title = cleanText(titlePart);
        } else {
          // If no location found, try to extract title differently
          const parts = remainder.split(/\s+/);
          if (parts.length > 0) {
            // Take first few words as title
            title = parts.slice(0, Math.min(5, parts.length)).join(' ');
            title = cleanText(title);
          }
        }
        
        // Extract time posted (look for patterns like "5 hours ago", "2 days ago")
        const timeMatch = remainder.match(/(\d+)\s+(hour|day|week|month)s?\s+ago/i);
        if (timeMatch) {
          postedDate = parseRelativeDate(timeMatch[0]);
        }
        
        // Extract salary
        salary = extractSalary(remainder);
      }

      // Make URL absolute
      if (url) {
        url = makeAbsoluteUrl(url, this.baseUrl);
      }

      // Create job object
      const job = {
        title: title || 'Unknown Title',
        company: company || 'Unknown Company',
        location: location,
        url: url,
        description: fullText, // Use full text as description for now
        descriptionText: fullText,
        salary: salary,
        source: 'remotejobs.com',
        postedDate: postedDate,
        credibilityScore: 8, // RemoteJobs.com is a reputable remote job site
        isRemote: true // All jobs on remotejobs.com should be remote
      };

      return job;
      
    } catch (error) {
      logger.debug(`Error extracting job from element: ${error.message}`);
      return null;
    }
  }
}

module.exports = RemoteJobsScraper; 