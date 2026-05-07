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
 * Scraper for onlinejobs.ph with pagination support
 */
class OnlineJobsPhScraper extends BaseScraper {
  constructor(config = {}) {
    super('OnlineJobsPh', {
      headless: true,
      timeout: 60000,
      maxRetries: 3,
      ...config
    });
    
    this.baseUrl = 'https://www.onlinejobs.ph';
    this.searchUrl = 'https://www.onlinejobs.ph/jobseekers/jobsearch';
    this.maxPages = config.maxPages || 10; // Default to 10 pages, configurable
    this.jobsPerPage = 30; // OnlineJobs.ph shows 30 jobs per page
  }

  /**
   * Main scraping method with pagination support
   */
  async scrape() {
    try {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize scraper');
      }

      logger.info(`Starting OnlineJobs.ph scraping (up to ${this.maxPages} pages)`);
      
      const allJobs = [];
      let currentPage = 1;
      
      // Scrape multiple pages
      while (currentPage <= this.maxPages) {
        try {
          logger.info(`Scraping page ${currentPage}/${this.maxPages}`);
          
          const pageJobs = await this.scrapePage(currentPage);
          
          if (pageJobs.length === 0) {
            logger.warn(`No jobs found on page ${currentPage}, stopping pagination`);
            break;
          }
          
          allJobs.push(...pageJobs);
          logger.info(`Page ${currentPage}: Found ${pageJobs.length} jobs (Total: ${allJobs.length})`);
          
          currentPage++;
          
          // Respectful delay between pages
          if (currentPage <= this.maxPages) {
            await randomDelay(3000, 6000);
          }
          
        } catch (error) {
          logger.error(`Error scraping page ${currentPage}: ${error.message}`);
          // Continue to next page instead of failing completely
          currentPage++;
          await randomDelay(5000, 8000); // Longer delay after error
        }
      }
      
      // Remove duplicates
      const uniqueJobs = this.removeDuplicates(allJobs);
      
      logger.info(`OnlineJobs.ph scraping completed. Found ${uniqueJobs.length} unique jobs across ${currentPage - 1} pages`);
      return uniqueJobs;
      
    } catch (error) {
      logger.error(`OnlineJobs.ph scraping failed: ${error.message}`);
      return [];
    } finally {
      await this.close();
    }
  }

  /**
   * Scrape a specific page
   */
  async scrapePage(pageNumber) {
    try {
      // Calculate the offset for the page (page 1 = 0, page 2 = 30, page 3 = 60, etc.)
      const offset = (pageNumber - 1) * this.jobsPerPage;
      const pageUrl = pageNumber === 1 ? this.searchUrl : `${this.searchUrl}/${offset}`;
      
      const success = await this.navigateTo(pageUrl);
      if (!success) {
        throw new Error(`Failed to navigate to page ${pageNumber}`);
      }

      await this.handlePopups();
      
      // Wait for the page to load completely
      await this.page.waitForTimeout(5000);
      
      // Wait for job listings to load
      const jobsLoaded = await this.waitForSelector('.jobpost-cat-box', {
        timeout: 20000
      });

      if (!jobsLoaded) {
        const debugInfo = await this.page.evaluate(() => ({
          url: window.location.href,
          title: document.title,
          bodyText: document.body.innerText.substring(0, 500),
          hasLoginForm: !!document.querySelector('form[action*="login"], input[type="password"]'),
          hasCaptcha: !!document.querySelector('[class*="captcha"], [id*="captcha"], iframe[src*="captcha"], iframe[src*="challenge"]'),
        }));
        logger.warn(`No job listings found on page ${pageNumber}. Debug: URL=${debugInfo.url}, title=${debugInfo.title}, hasLogin=${debugInfo.hasLoginForm}, hasCaptcha=${debugInfo.hasCaptcha}`);
        logger.warn(`Page text preview: ${debugInfo.bodyText}`);
        return [];
      }

      // Scroll to load any lazy-loaded content
      await this.humanScroll();

      return await this.extractJobsFromPage();
      
    } catch (error) {
      logger.error(`Error scraping page ${pageNumber}: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract jobs from the current page
   */
  async extractJobsFromPage() {
    try {
      // Based on debug analysis, jobs are in div elements with specific classes
      const jobElements = await this.getAllElements('.jobpost-cat-box.latest-job-post');
      
      if (jobElements.length === 0) {
        // Fallback to more generic selector
        const fallbackElements = await this.getAllElements('.jobpost-cat-box');
        logger.debug(`Found ${fallbackElements.length} job elements with fallback selector`);
        
        if (fallbackElements.length === 0) {
          logger.warn('No job elements found with any selector');
          return [];
        }
        
        // Use fallback elements
        jobElements.push(...fallbackElements);
      }

      logger.debug(`Found ${jobElements.length} job elements on current page`);

      const jobs = [];

      for (let i = 0; i < jobElements.length; i++) {
        try {
          const jobElement = jobElements[i];
          const job = await this.extractJobFromElement(jobElement);
          
          if (job && job.title && job.company) {
            jobs.push(job);
          }
          
          // Small delay between extractions
          await randomDelay(200, 500);
          
        } catch (error) {
          logger.debug(`Error extracting job ${i}: ${error.message}`);
          continue;
        }
      }

      logger.debug(`Extracted ${jobs.length} valid jobs from current page`);
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
      // Get the job URL from the link
      let url = '';
      try {
        const linkElement = await jobElement.$('a[href*="/jobseekers/job/"]');
        if (linkElement) {
          url = await linkElement.getAttribute('href');
        }
      } catch (error) {
        // Continue without URL
      }

      // Get the full text content
      const fullText = await jobElement.textContent();
      
      if (!fullText || fullText.length < 20) {
        return null;
      }

      // Extract job title - improved logic
      let title = '';
      try {
        // Try to get title from the link text first
        const titleElement = await jobElement.$('a[href*="/jobseekers/job/"]');
        if (titleElement) {
          const linkText = await titleElement.textContent();
          if (linkText && linkText.trim().length > 3) {
            title = cleanText(linkText);
          }
        }
        
        // If no title from link, try other elements
        if (!title) {
          const altTitleElement = await jobElement.$('h3, h4, .job-title, strong');
          if (altTitleElement) {
            title = await altTitleElement.textContent();
            title = cleanText(title);
          }
        }
        
        // If still no title, extract from URL
        if (!title && url) {
          const urlParts = url.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          title = lastPart.replace(/-/g, ' ').replace(/\d+$/, '').trim();
          title = cleanText(title);
        }
      } catch (error) {
        // Continue with empty title
      }

      // Extract company/poster information - improved logic
      let company = '';
      try {
        // Look for poster information in the text
        const posterMatch = fullText.match(/([^•\n]+)\s*•\s*Posted on/i);
        if (posterMatch) {
          company = cleanText(posterMatch[1]);
        } else {
          // Try to find company in structured way
          const lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          
          // Look for a line that might be the company/poster name
          for (const line of lines) {
            if (line !== title && 
                line.length > 2 && 
                line.length < 100 && 
                !line.includes('Posted on') &&
                !line.includes('Full Time') &&
                !line.includes('Part Time') &&
                !line.includes('$') &&
                !line.includes('PHP') &&
                !line.includes('Any')) {
              company = cleanText(line);
              break;
            }
          }
        }
      } catch (error) {
        // Continue without company
      }

      // Extract posted date
      let postedDate = new Date();
      try {
        const dateMatch = fullText.match(/Posted on\s+([^•\n]+)/i);
        if (dateMatch) {
          postedDate = parseRelativeDate(dateMatch[1]);
        }
      } catch (error) {
        // Use current date as fallback
      }

      // Extract location (OnlineJobs.ph is Philippines-focused)
      let location = 'Philippines';
      try {
        const locationMatch = fullText.match(/(Remote|Work from Home|Philippines|Manila|Cebu|Davao|Virtual)/i);
        if (locationMatch) {
          location = locationMatch[1];
        }
      } catch (error) {
        // Keep default location
      }

      // Extract salary if available
      const salary = extractSalary(fullText);

      // Make URL absolute
      if (url) {
        url = makeAbsoluteUrl(url, this.baseUrl);
      }

      // Check if this is a remote/virtual job
      const isRemote = isLikelyRemote(title, fullText, location) || 
                      title.toLowerCase().includes('virtual') ||
                      title.toLowerCase().includes('remote') ||
                      fullText.toLowerCase().includes('work from home') ||
                      fullText.toLowerCase().includes('virtual assistant') ||
                      fullText.toLowerCase().includes('online');

      // Create job object
      const job = {
        title: title || 'Unknown Title',
        company: company || 'OnlineJobs.ph Client',
        location: location,
        url: url,
        description: fullText,
        descriptionText: fullText,
        salary: salary,
        source: 'onlinejobs.ph',
        postedDate: postedDate,
        credibilityScore: 7, // OnlineJobs.ph is reputable for Filipino remote workers
        isRemote: isRemote
      };

      return job;
      
    } catch (error) {
      logger.debug(`Error extracting job from element: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove duplicate jobs based on URL and title
   */
  removeDuplicates(jobs) {
    const seen = new Set();
    const unique = [];
    
    for (const job of jobs) {
      const key = `${job.url || ''}-${job.title}-${job.company}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(job);
      }
    }
    
    return unique;
  }
}

module.exports = OnlineJobsPhScraper; 