const { chromium } = require('playwright');
const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const config = require('../../config/config');
const path = require('path');
const fs = require('fs').promises;

/**
 * Indeed scraper using Playwright for browser automation
 * Based on the approach from https://github.com/Eben001/IndeedJobScraper
 */
class IndeedSeleniumScraper extends BaseScraper {
  constructor() {
    super('IndeedSelenium');
    this.baseUrl = 'https://www.indeed.com';
    this.queries = config.sources.indeed?.queries || [
      'data entry remote',
      'administrative assistant remote',
      'virtual assistant remote',
      'customer service representative remote'
    ];
    this.credibilityScore = config.sources.indeed?.credibilityScore || 8;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.screenshotsDir = path.join(process.cwd(), 'indeed-screenshots');
    this.maxJobsPerQuery = 25;
    this.maxRetries = 3;
    this.delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Scrape jobs from Indeed
   * @returns {Array} - Array of job objects
   */
  async scrape() {
    try {
      logger.info('Starting to scrape jobs from Indeed using Playwright');
      
      // Create screenshots directory
      await fs.mkdir(this.screenshotsDir, { recursive: true });
      
      // Initialize browser
      await this.initBrowser();
      
      const allJobs = [];
      
      // Process each search query
      for (const query of this.queries) {
        try {
          const jobs = await this.scrapeQuery(query);
          allJobs.push(...jobs);
          logger.info(`Found ${jobs.length} jobs for query "${query}"`);
          
          // Take a short break between queries
          await this.delay(3000);
        } catch (error) {
          logger.error(`Error scraping query "${query}": ${error.message}`);
        }
      }
      
      logger.info(`Total jobs found: ${allJobs.length}`);
      return allJobs;
    } catch (error) {
      logger.error(`Error in Indeed scraping: ${error.message}`);
      return [];
    } finally {
      await this.closeBrowser();
    }
  }
  
  /**
   * Initialize browser and page
   */
  async initBrowser() {
    try {
      logger.info('Initializing Playwright browser');
      
      // Launch browser with stealth mode settings
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials'
        ]
      });
      
      // Create a context with realistic user agent and viewport
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        javaScriptEnabled: true,
        bypassCSP: true,
        acceptDownloads: true
      });
      
      // Set extra HTTP headers to appear more human-like
      await this.context.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1'
      });
      
      // Create a new page
      this.page = await this.context.newPage();
      
      // Add human-like behavior by simulating mouse movements
      await this.page.mouse.move(100, 100);
      
      logger.info('Playwright browser initialized');
    } catch (error) {
      logger.error(`Error initializing browser: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Scrape a specific query
   * @param {string} query - Search query
   * @returns {Array} - Array of job objects
   */
  async scrapeQuery(query) {
    let retryCount = 0;
    let jobs = [];
    
    while (retryCount < this.maxRetries && jobs.length === 0) {
      try {
        // Format the query for the URL
        const formattedQuery = encodeURIComponent(query);
        const searchUrl = `${this.baseUrl}/jobs?q=${formattedQuery}&l=Remote&sort=date`;
        
        logger.info(`Searching Indeed for: "${query}" (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        // Navigate to search page with shorter timeout
        await this.page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 
        });
        
        // Wait for only essential content with shorter timeout
        try {
          // Try to wait for content to load, but don't wait for networkidle
          // as it can cause timeouts with Indeed's endless tracking calls
          await this.page.waitForSelector('body', { timeout: 5000 });
          
          // Give the page a moment to render
          await this.delay(2000);
        } catch (timeoutError) {
          logger.warn(`Timeout waiting for page content: ${timeoutError.message}`);
          // Continue anyway - we'll try to extract what we can
        }
        
        // Take a screenshot right away - even if the page is partially loaded
        const screenshotPath = path.join(this.screenshotsDir, `${query.replace(/\s+/g, '-')}-results-${retryCount + 1}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: false });
        logger.info(`Screenshot saved to ${screenshotPath}`);
        
        // Check for captcha/anti-bot detection
        const isCaptcha = await this.checkForCaptcha();
        if (isCaptcha) {
          logger.warn('Captcha detected, retrying with different approach');
          retryCount++;
          
          // Try a different user agent on each retry
          if (retryCount < this.maxRetries) {
            await this.rotateUserAgent();
            await this.delay(5000 * retryCount);
          }
          continue;
        }
        
        // Extract jobs from the search results
        jobs = await this.extractJobsFromPage(query);
        
        if (jobs.length === 0) {
          logger.warn(`No jobs found for query "${query}". Retrying...`);
          retryCount++;
          
          if (retryCount < this.maxRetries) {
            await this.rotateUserAgent();
            await this.delay(3000 * retryCount);
          }
          continue;
        }
        
        return jobs;
      } catch (error) {
        logger.error(`Error scraping query "${query}": ${error.message}`);
        retryCount++;
        
        if (retryCount < this.maxRetries) {
          logger.info(`Retrying (${retryCount}/${this.maxRetries})...`);
          await this.rotateUserAgent();
          await this.delay(5000 * retryCount); // Exponential backoff
        }
      }
    }
    
    return jobs;
  }
  
  /**
   * Rotate user agent to try to bypass blocking
   */
  async rotateUserAgent() {
    try {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
      ];
      
      // Get a random user agent
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      
      // Close existing context and create a new one with the new user agent
      if (this.context) {
        await this.context.close();
      }
      
      this.context = await this.browser.newContext({
        userAgent,
        viewport: { width: 1280, height: 800 },
        javaScriptEnabled: true,
        bypassCSP: true,
        acceptDownloads: true
      });
      
      // Set extra HTTP headers
      await this.context.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      });
      
      // Create a new page
      this.page = await this.context.newPage();
      
      // Add random mouse movements
      await this.simulateHumanBehavior();
      
      logger.info(`Rotated user agent to: ${userAgent.substring(0, 30)}...`);
    } catch (error) {
      logger.error(`Error rotating user agent: ${error.message}`);
    }
  }
  
  /**
   * Simulate human behavior with mouse movements and scrolling
   */
  async simulateHumanBehavior() {
    try {
      // Random mouse movements
      await this.page.mouse.move(100, 100);
      await this.delay(300);
      await this.page.mouse.move(200, 150);
      await this.delay(200);
      
      // After the page loads, we'll add more behavior
    } catch (error) {
      logger.error(`Error simulating human behavior: ${error.message}`);
    }
  }
  
  /**
   * Check if the page contains a captcha or anti-bot detection
   * @returns {boolean} - True if captcha detected
   */
  async checkForCaptcha() {
    try {
      const captchaSelectors = [
        'iframe[src*="captcha"]',
        'iframe[src*="challenge"]',
        '.g-recaptcha',
        '#captchacharacters',
        'input[name="captcha"]',
        'div[class*="challenge"]',
        'div[id*="challenge"]',
        'div[class*="captcha"]',
        'div[id*="captcha"]'
      ];
      
      for (const selector of captchaSelectors) {
        const isCaptcha = await this.page.$(selector);
        if (isCaptcha) {
          logger.warn(`Captcha detected (${selector})`);
          return true;
        }
      }
      
      // Check for common Cloudflare text
      const pageText = await this.page.textContent('body');
      if (pageText.includes('Checking if the site connection is secure') || 
          pageText.includes('Please complete the security check') || 
          pageText.includes('Please wait while we verify') ||
          pageText.includes('Please turn JavaScript on')) {
        logger.warn('Security challenge text detected');
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error checking for captcha: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Extract jobs from the current page
   * @param {string} query - Original search query
   * @returns {Array} - Array of job objects
   */
  async extractJobsFromPage(query) {
    try {
      // Save the HTML content for debugging
      const html = await this.page.content();
      const debugPath = path.join(this.screenshotsDir, `${query.replace(/\s+/g, '-')}-html.txt`);
      await fs.writeFile(debugPath, html);
      
      // Try several selector patterns to find job cards
      const allSelectors = [
        '.job_seen_beacon',
        '.jobsearch-ResultsList > div',
        '.tapItem',
        '.job-search-card',
        '.resultContent',
        '[data-testid="jobListing"]',
        '.jobCard',
        // Additional selectors for Indeed's different layouts
        '.jobsearch-JobCard',
        '.jobCard-container',
        '.job-container',
        '.jobsearch-SerpJobCard',
        // Generic selectors as fallback
        'div[id^="job_"]',
        'div[class*="job"]'
      ];
      
      // Try each selector to find job listings
      let jobCardSelector = null;
      let jobCount = 0;
      
      for (const selector of allSelectors) {
        try {
          // Check if this selector exists
          const count = await this.page.$$eval(selector, items => items.length)
            .catch(() => 0);
          
          if (count > 0) {
            jobCardSelector = selector;
            jobCount = count;
            logger.info(`Found ${count} job cards with selector: ${selector}`);
            break;
          }
        } catch (error) {
          // Continue trying other selectors
          continue;
        }
      }
      
      // If no jobs found with any selector, take some generic links instead
      if (!jobCardSelector || jobCount === 0) {
        logger.warn('No job cards found with standard selectors, trying generic approach');
        
        try {
          // Extract all links that might be job links
          const potentialJobs = await this.page.$$eval('a[href*="/viewjob"], a[href*="/job/"], a[href*="/pagead/"], a[href*="?jk="]', 
            links => links.map(link => {
              // Try to find nearby text elements for title and company
              const parent = link.closest('div') || link.parentElement;
              
              // Try to extract title from the link text or nearby heading
              const title = link.textContent.trim() || 
                (parent && parent.querySelector('h2, h3, h4')) ? 
                parent.querySelector('h2, h3, h4').textContent.trim() : 'Unknown Title';
              
              // Try to find company name in nearby text
              const companyElement = parent && parent.querySelector('[class*="company"], [data-testid*="company"], span[class*="company"]');
              const company = companyElement ? companyElement.textContent.trim() : 'Unknown Company';
              
              // Get URL
              const url = link.href;
              
              return { title, company, url };
            })
          );
          
          // Filter out duplicates and invalid entries
          const jobs = potentialJobs
            .filter(job => job.title && job.title !== 'Unknown Title' && job.url)
            .slice(0, this.maxJobsPerQuery);
          
          logger.info(`Found ${jobs.length} potential job links with generic approach`);
          
          // Process these jobs similar to the regular flow
          const processedJobs = [];
          for (const job of jobs) {
            try {
              // Get job details if we have a URL
              if (job.url) {
                try {
                  const details = await this.getJobDetails(job.url);
                  
                  processedJobs.push({
                    title: job.title,
                    company: job.company,
                    location: 'Remote',
                    url: job.url,
                    description: details.description || '',
                    descriptionText: details.descriptionText || '',
                    source: this.name,
                    postedDate: new Date(), // We don't have date info in this fallback
                    credibilityScore: this.credibilityScore - 1, // Slightly lower score for fallback method
                    searchQuery: query
                  });
                } catch (detailError) {
                  logger.error(`Error getting job details: ${detailError.message}`);
                }
              }
            } catch (error) {
              logger.error(`Error processing potential job: ${error.message}`);
            }
          }
          
          return processedJobs;
        } catch (fallbackError) {
          logger.error(`Error with fallback job extraction: ${fallbackError.message}`);
          return [];
        }
      }
      
      // Extract job data using the successful selector
      let jobs = [];
      try {
        jobs = await this.page.$$eval(jobCardSelector, (cards, maxJobs) => {
          return cards.slice(0, maxJobs).map(card => {
            try {
              // Find key elements - try multiple potential selectors
              const titleElement = 
                card.querySelector('.jobTitle a, [data-testid="jobTitle"], h2 a, h2 span, h3, h4, .title, .job-title') ||
                card.querySelector('a'); // Fallback to any link
                
              const companyElement = 
                card.querySelector('[data-testid="company-name"], .companyName, .company-name, .company, [class*="company"]') ||
                card.querySelector('span:not(.jobTitle)'); // Fallback to any span that's not a job title
                
              const locationElement = 
                card.querySelector('[data-testid="text-location"], .companyLocation, .location, [class*="location"]');
                
              const dateElement = 
                card.querySelector('.date, .new, .posted-date, [class*="date"], [data-testid*="date"]');
              
              // Extract text
              const title = titleElement ? titleElement.textContent.trim() : '';
              const company = companyElement ? companyElement.textContent.trim() : '';
              const location = locationElement ? locationElement.textContent.trim() : 'Remote';
              const datePosted = dateElement ? dateElement.textContent.trim() : '';
              
              // Get job URL
              let url = '';
              if (titleElement && titleElement.tagName === 'A') {
                url = titleElement.href;
              } else if (card.querySelector('a')) {
                url = card.querySelector('a').href;
              }
              
              // Get job description preview
              const snippetElement = 
                card.querySelector('.job-snippet, .job-description, .summary, [class*="summary"], [class*="snippet"], [class*="description"]');
              const snippet = snippetElement ? snippetElement.textContent.trim() : '';
              
              // Skip incomplete jobs
              if (!title) {
                return null;
              }
              
              return {
                title,
                company: company || 'Unknown Company',
                location,
                datePosted,
                url,
                snippet
              };
            } catch (error) {
              console.log(`Error extracting job data: ${error.message}`);
              return null;
            }
          }).filter(job => job !== null);
        }, this.maxJobsPerQuery);
      } catch (extractError) {
        logger.error(`Error extracting job data: ${extractError.message}`);
        return [];
      }
      
      logger.info(`Successfully extracted ${jobs.length} jobs`);
      
      // Process jobs to match our schema
      const processedJobs = [];
      for (const job of jobs) {
        try {
          // Estimate posted date
          const postedDate = this.estimatePostedDate(job.datePosted);
          
          // For jobs with URLs, try to get details but don't fail if we can't
          let description = job.snippet || '';
          let descriptionText = job.snippet || '';
          
          if (job.url) {
            try {
              const details = await this.getJobDetails(job.url)
                .catch(e => ({ description: job.snippet || '', descriptionText: job.snippet || '' }));
              
              description = details.description || job.snippet || '';
              descriptionText = details.descriptionText || job.snippet || '';
            } catch (detailError) {
              logger.error(`Error getting job details: ${detailError.message}`);
              // Keep using the snippet as fallback
            }
          }
          
          // Create job object - require only title as minimum
          if (job.title) {
            processedJobs.push({
              title: job.title,
              company: job.company || 'Unknown Company',
              location: job.location || 'Remote',
              url: job.url || '',
              description: description,
              descriptionText: descriptionText,
              source: this.name,
              postedDate: postedDate,
              credibilityScore: this.credibilityScore,
              searchQuery: query
            });
          }
        } catch (error) {
          logger.error(`Error processing job: ${error.message}`);
        }
      }
      
      return processedJobs;
    } catch (error) {
      logger.error(`Error extracting jobs from page: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get detailed job information
   * @param {string} url - Job URL
   * @returns {Object} - Job details
   */
  async getJobDetails(url) {
    // Create a new page for job details to not interfere with search results
    const detailsPage = await this.context.newPage();
    try {
      // Set shorter timeouts
      await detailsPage.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
      
      // Save the HTML for debugging
      const urlSafeId = url.split('/').pop().replace(/[^a-z0-9]/gi, '-');
      const debugPath = path.join(this.screenshotsDir, `job-details-${urlSafeId}-html.txt`);
      const html = await detailsPage.content();
      await fs.writeFile(debugPath, html);
      
      // Take a screenshot right away
      const screenshotPath = path.join(
        this.screenshotsDir, 
        `job-details-${urlSafeId}.png`
      );
      await detailsPage.screenshot({ path: screenshotPath, fullPage: false });
      
      // Wait for description with shorter timeout
      let description = '';
      let descriptionText = '';
      
      // Try multiple selectors for job description
      const descriptionSelectors = [
        '#jobDescriptionText',
        '.jobsearch-jobDescriptionText',
        '.description-content',
        '[data-testid="jobDescriptionText"]',
        '.job-desc',
        '.jobDescription',
        '.job-description',
        // Generic fallbacks
        'div[class*="description"]',
        'div[id*="description"]',
        'div[class*="desc"]',
        'div[id*="desc"]',
        'article'
      ];
      
      for (const selector of descriptionSelectors) {
        try {
          const exists = await detailsPage.$(selector);
          if (exists) {
            description = await detailsPage.$eval(selector, el => el.innerHTML).catch(() => '');
            descriptionText = await detailsPage.$eval(selector, el => el.textContent).catch(() => '');
            if (description && descriptionText) {
              logger.debug(`Found job description with selector: ${selector}`);
              break;
            }
          }
        } catch (error) {
          // Try next selector
          continue;
        }
      }
      
      // If no description found with specific selectors, extract from main content area
      if (!description || !descriptionText) {
        try {
          // Try to get main content area
          const mainContent = await detailsPage.$eval('main, #main, .main-content, #mainContent, .jobsearch-JobComponent', 
            el => ({
              html: el.innerHTML,
              text: el.textContent
            })
          ).catch(() => ({html: '', text: ''}));
          
          if (mainContent.html && mainContent.text) {
            description = mainContent.html;
            descriptionText = mainContent.text;
            logger.debug('Using main content area for job description');
          }
        } catch (error) {
          // If all else fails, use the entire body content
          logger.warn(`Error getting main content: ${error.message}`);
          
          try {
            description = await detailsPage.$eval('body', el => el.innerHTML).catch(() => '');
            descriptionText = await detailsPage.$eval('body', el => el.textContent).catch(() => '');
            logger.debug('Using body content for job description as fallback');
          } catch (bodyError) {
            logger.error(`Error getting body content: ${bodyError.message}`);
          }
        }
      }
      
      // Clean the description text
      descriptionText = descriptionText
        .replace(/\s+/g, ' ')
        .trim();
      
      return {
        description,
        descriptionText: descriptionText
      };
    } catch (error) {
      logger.error(`Error getting job details: ${error.message}`);
      return {
        description: '',
        descriptionText: ''
      };
    } finally {
      await detailsPage.close().catch(() => {});
    }
  }
  
  /**
   * Estimate posted date from date text
   * @param {string} dateText - Date text from job listing
   * @returns {Date} - Estimated date
   */
  estimatePostedDate(dateText) {
    try {
      const now = new Date();
      
      if (!dateText) {
        return now;
      }
      
      // Parse "X days ago"
      const daysMatch = dateText.match(/(\d+)\s*day/i);
      if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
      }
      
      // Parse "X hours ago"
      const hoursMatch = dateText.match(/(\d+)\s*hour/i);
      if (hoursMatch) {
        const hours = parseInt(hoursMatch[1], 10);
        const date = new Date();
        date.setHours(date.getHours() - hours);
        return date;
      }
      
      // Parse "Today" or "Just posted"
      if (dateText.match(/today|just posted/i)) {
        return now;
      }
      
      // Parse "Yesterday"
      if (dateText.match(/yesterday/i)) {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date;
      }
      
      return now;
    } catch (error) {
      logger.error(`Error parsing date "${dateText}": ${error.message}`);
      return new Date();
    }
  }
  
  /**
   * Close browser and clean up
   */
  async closeBrowser() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.context = null;
        this.page = null;
        logger.info('Browser closed');
      }
    } catch (error) {
      logger.error(`Error closing browser: ${error.message}`);
    }
  }
}

module.exports = IndeedSeleniumScraper; 