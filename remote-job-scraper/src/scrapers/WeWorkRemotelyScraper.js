const { chromium } = require('playwright');
const logger = require('../utils/logger');
const config = require('../../config/config');
const BaseScraper = require('./BaseScraper');

/**
 * Scraper for We Work Remotely
 */
class WeWorkRemotelyScraper extends BaseScraper {
  constructor() {
    super('WeWorkRemotely');
    this.baseUrl = config.sources.weworkremotely?.baseUrl || 'https://weworkremotely.com';
    this.categories = config.sources.weworkremotely?.categories || 
                     ['customer-service', 'administrative', 'virtual-admin'];
    this.credibilityScore = config.sources.weworkremotely?.credibilityScore || 9;
    this.headless = false; // Default to non-headless for Cloudflare bypass
  }
  
  /**
   * Set headless mode
   * @param {boolean} isHeadless - Whether to run in headless mode
   */
  setHeadless(isHeadless) {
    this.headless = isHeadless;
    return this;
  }
  
  /**
   * Initialize the browser and page
   */
  async init() {
    try {
      logger.info(`Initializing ${this.name} scraper (headless: ${this.headless})`);

      // Launch browser with more robust settings for Cloudflare bypass
      this.browser = await chromium.launch({
        headless: this.headless, // Use headless setting from configuration
        timeout: 60000,
        args: [
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--disable-blink-features=AutomationControlled', // Critical for avoiding detection
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--ignore-certificate-errors'
        ]
      });
      
      this.context = await this.browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1366, height: 768 }, // Common resolution
        screen: { width: 1366, height: 768 },
        bypassCSP: true,
        javaScriptEnabled: true,
        locale: 'en-US',
        timezoneId: 'America/New_York',
        hasTouch: false
      });
      
      // Add storage state if available
      try {
        const fs = require('fs');
        if (fs.existsSync('./storage/wwr-state.json')) {
          const storageState = JSON.parse(fs.readFileSync('./storage/wwr-state.json'));
          await this.context.addCookies(storageState.cookies || []);
        }
      } catch (err) {
        logger.debug(`Failed to load storage state: ${err.message}`);
      }
      
      this.page = await this.context.newPage();
      
      // Hide automation hints - critical for Cloudflare
      await this.page.addInitScript(() => {
        // Overwrite the navigator.webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false
        });
        
        // Hide automation-related properties
        window.navigator.chrome = { runtime: {} };
        
        // Remove automation strings from user agent
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Headless')) {
          Object.defineProperty(navigator, 'userAgent', {
            get: function() { return userAgent.replace('Headless', ''); }
          });
        }
        
        // Add common navigator properties
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });
      
      // Setup error handling
      this.page.on('pageerror', err => {
        logger.error(`[${this.name}] Page error: ${err.message}`);
      });
      
      this.page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          logger.debug(`[${this.name}] Console ${msg.type()}: ${msg.text()}`);
        }
      });
      
      // Specific for Cloudflare - wait for user to solve captcha if needed
      this.page.on('dialog', async dialog => {
        logger.info(`Dialog appeared: ${dialog.message()}`);
        await dialog.dismiss();
      });
      
      return true;
    } catch (error) {
      logger.error(`Error initializing ${this.name} scraper: ${error.message}`);
      // Don't throw error, to allow other scrapers to continue
      return false;
    }
  }
  
  /**
   * Scrape all categories
   */
  async scrape() {
    try {
      if (!await this.init()) {
        logger.warn(`Skipping ${this.name} scraper due to initialization failure`);
        return [];
      }
      
      logger.info(`Starting to scrape ${this.name}`);
      
      const allJobs = [];
      
      for (const category of this.categories) {
        try {
          const jobs = await this.scrapeCategory(category);
          if (jobs && jobs.length) {
            allJobs.push(...jobs);
            logger.info(`Scraped ${jobs.length} jobs from ${this.name} category: ${category}`);
          }
        } catch (error) {
          logger.error(`Failed to scrape ${this.name} category ${category}: ${error.message}`);
        }
        
        // Add a random delay between category scraping to avoid rate limiting
        await this.randomDelay(3000, 5000);
      }
      
      // Save cookies for future use
      try {
        const fs = require('fs');
        const path = require('path');
        const storageDir = path.join(process.cwd(), 'storage');
        if (!fs.existsSync(storageDir)) {
          fs.mkdirSync(storageDir, { recursive: true });
        }
        const storageState = await this.context.storageState();
        fs.writeFileSync(path.join(storageDir, 'wwr-state.json'), JSON.stringify(storageState));
      } catch (err) {
        logger.debug(`Failed to save storage state: ${err.message}`);
      }
      
      await this.close();
      
      logger.info(`Completed scraping ${this.name}, found ${allJobs.length} jobs`);
      return allJobs;
    } catch (error) {
      logger.error(`Error scraping ${this.name}: ${error.message}`);
      await this.close();
      // Return empty array instead of throwing to allow other scrapers to continue
      return [];
    }
  }
  
  /**
   * Scrape a specific category
   */
  async scrapeCategory(category) {
    const categoryUrl = `${this.baseUrl}/categories/${category}`;
    logger.info(`Scraping ${this.name} category: ${category} at ${categoryUrl}`);
    
    try {
      // Retry navigation 3 times
      let success = false;
      let attemptCount = 0;
      const maxAttempts = 3;
      
      while (!success && attemptCount < maxAttempts) {
        attemptCount++;
        try {
          logger.debug(`Navigation attempt ${attemptCount} to ${categoryUrl}`);
          
          // Navigate with a timeout
          await this.page.goto(categoryUrl, { timeout: 60000, waitUntil: 'domcontentloaded' });
          
          // Wait for a key element to ensure page is loaded
          await this.page.waitForSelector('body', { timeout: 15000 });
          
          // Check if we hit Cloudflare protection
          const isCloudflare = await this.isCloudflareChallenge();
          if (isCloudflare) {
            logger.info("Cloudflare challenge detected. Waiting for user to solve...");
            // Slow human-like scrolling while waiting for Cloudflare
            await this.humanLikeScrolling();
            
            // Wait longer for the user to solve Cloudflare challenge if needed
            // Give 30 seconds for manual intervention with Cloudflare
            await this.page.waitForTimeout(30000);
            
            // Check again for protection
            if (await this.isCloudflareChallenge()) {
              logger.warn("Still hitting Cloudflare protection. Waiting longer...");
              await this.page.waitForTimeout(20000);
            }
          }
          
          // Check if we're on the correct page
          const pageTitle = await this.page.title();
          if (pageTitle && (pageTitle.includes("Work Remotely") || pageTitle.includes("Remote Jobs"))) {
            success = true;
            logger.info(`Successfully navigated to ${category} page`);
          } else {
            logger.warn(`Page title doesn't look right: "${pageTitle}"`);
            await this.randomDelay(3000, 5000);
          }
        } catch (err) {
          logger.warn(`Navigation attempt ${attemptCount} failed: ${err.message}`);
          await this.randomDelay(3000, 5000);
          
          if (attemptCount === maxAttempts) {
            throw new Error(`Failed to navigate to ${categoryUrl} after ${maxAttempts} attempts`);
          }
        }
      }
      
      // Wait for job listings to load with a fallback strategy
      let jobSelector;
      
      try {
        // Try primary selector
        await this.page.waitForSelector('.jobs', { timeout: 10000 });
        jobSelector = '.jobs';
      } catch (err) {
        try {
          // Try alternate selector
          await this.page.waitForSelector('.listing-container', { timeout: 5000 });
          jobSelector = '.listing-container';
        } catch (err2) {
          try {
            // Final fallback
            await this.page.waitForSelector('article', { timeout: 5000 });
            jobSelector = 'article';
          } catch (err3) {
            throw new Error(`Failed to find job listings after trying multiple selectors`);
          }
        }
      }
      
      logger.debug(`Found job listings using selector: ${jobSelector}`);
      
      // Get all job links
      await this.randomDelay(1000, 2000);
      
      // Two different approaches to find job links for resilience
      let jobLinks = [];
      
      try {
        // Method 1: Using evaluateHandle
        const linksHandle = await this.page.evaluateHandle(() => {
          const links = Array.from(document.querySelectorAll('a[href*="/remote-jobs/"]'))
            .filter(a => !a.href.includes('#'));
          return links.map(a => a.href);
        });
        
        jobLinks = await linksHandle.jsonValue();
      } catch (err) {
        // Method 2: Direct querySelector
        const links = await this.page.$$eval('a[href*="/remote-jobs/"]', links => 
          links.filter(a => !a.href.includes('#')).map(a => a.href)
        );
        
        if (links && links.length) {
          jobLinks = links;
        }
      }
      
      // Deduplicate links
      jobLinks = [...new Set(jobLinks)];
      
      if (!jobLinks.length) {
        logger.warn(`No job links found for ${category}`);
        return [];
      }
      
      logger.info(`Found ${jobLinks.length} job links for ${category}`);
      
      // Limit to first 20 jobs per category to avoid overloading
      const limitedLinks = jobLinks.slice(0, 20);
      
      // Scrape each job
      const jobs = [];
      for (const link of limitedLinks) {
        try {
          const job = await this.scrapeJobDetails(link);
          if (job) {
            jobs.push(job);
          }
          
          // Be nice to the server
          await this.randomDelay(1000, 3000);
        } catch (error) {
          logger.error(`Error scraping job at ${link}: ${error.message}`);
        }
      }
      
      return jobs;
    } catch (error) {
      logger.error(`Failed to navigate to ${this.name} category: ${category}`);
      throw error;
    }
  }
  
  /**
   * Scrape details from a job page
   */
  async scrapeJobDetails(url) {
    logger.debug(`Scraping job details from ${url}`);
    
    try {
      // Create a new page for each job to avoid state issues
      const jobPage = await this.context.newPage();
      
      try {
        // Navigate to job page
        await jobPage.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
        
        // Wait for content to load
        await jobPage.waitForSelector('body', { timeout: 10000 });
        
        // Allow extra time for page to render
        await this.randomDelay(1000, 2000);
        
        // Extract job data using both DOM and JavaScript evaluation for resilience
        const jobData = await jobPage.evaluate(() => {
          // Utility function to safely extract text
          const safeText = (selector) => {
            const element = document.querySelector(selector);
            return element ? element.textContent.trim() : '';
          };
          
          // Try multiple selectors for each piece of data
          const title = safeText('h1.title') || 
                        safeText('.listing-header h1') || 
                        safeText('main h1');
                        
          const company = safeText('.company') || 
                         safeText('.listing-header h2') || 
                         safeText('main h2');
                         
          // Get description with fallbacks
          let description = '';
          const descriptionEl = document.querySelector('.listing-container') || 
                               document.querySelector('.job') ||
                               document.querySelector('main');
                               
          if (descriptionEl) {
            description = descriptionEl.innerHTML;
          }
          
          // Get plain text description
          let descriptionText = description ? descriptionEl.textContent.trim() : '';
          
          // Get date with fallbacks
          let dateString = '';
          const dateEl = document.querySelector('.listing-header time') ||
                        document.querySelector('time') ||
                        document.querySelector('.date');
                        
          if (dateEl) {
            dateString = dateEl.getAttribute('datetime') || dateEl.textContent.trim();
          }
          
          return {
            title,
            company,
            description,
            descriptionText,
            dateString
          };
        });
        
        // Skip if we couldn't get essential info
        if (!jobData.title || !jobData.company || !jobData.description) {
          logger.warn(`Skipping job at ${url} due to missing essential data`);
          await jobPage.close();
          return null;
        }
        
        // Parse date
        let postedDate = new Date();
        if (jobData.dateString) {
          try {
            postedDate = new Date(jobData.dateString);
            if (isNaN(postedDate.getTime())) {
              postedDate = new Date(); // Fallback to current date
            }
          } catch (err) {
            logger.debug(`Failed to parse date string "${jobData.dateString}": ${err.message}`);
          }
        }
        
        // Construct job object
        const job = {
          title: jobData.title,
          company: jobData.company,
          description: jobData.description,
          descriptionText: jobData.descriptionText,
          url: url,
          postedDate: postedDate,
          source: this.name,
          credibilityScore: this.credibilityScore
        };
        
        await jobPage.close();
        return job;
      } catch (error) {
        logger.error(`Error scraping job at ${url}: ${error.message}`);
        await jobPage.close();
        return null;
      }
    } catch (error) {
      logger.error(`Failed to create new page for job ${url}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Close browser when done
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        logger.debug(`${this.name} browser closed`);
      }
    } catch (error) {
      logger.error(`Error closing ${this.name} browser: ${error.message}`);
    }
  }
  
  /**
   * Add a random delay between actions
   */
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Get a random user agent
   */
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
  
  /**
   * Check if we're on a Cloudflare challenge page
   */
  async isCloudflareChallenge() {
    try {
      const content = await this.page.content();
      const title = await this.page.title();
      
      const cloudflareIndicators = [
        'cloudflare',
        'security check',
        'attention required',
        'please wait',
        'verify you are human',
        'please turn javascript on',
        'just a moment',
        'checking your browser'
      ];
      
      const contentLower = content.toLowerCase();
      const titleLower = title.toLowerCase();
      
      for (const indicator of cloudflareIndicators) {
        if (contentLower.includes(indicator) || titleLower.includes(indicator)) {
          return true;
        }
      }
      
      // Also check for Cloudflare's iframe
      const hasCloudflareIframe = await this.page.evaluate(() => {
        return !!document.querySelector('iframe[src*="cloudflare"]');
      });
      
      return hasCloudflareIframe;
    } catch (error) {
      logger.error(`Error checking for Cloudflare: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Perform human-like scrolling on the page
   */
  async humanLikeScrolling() {
    try {
      // Get page height
      const pageHeight = await this.page.evaluate(() => document.body.scrollHeight);
      
      // Scroll down slowly in chunks with random pauses
      let currentPosition = 0;
      const viewportHeight = (await this.page.viewportSize()).height;
      
      while (currentPosition < pageHeight) {
        const scrollAmount = Math.floor(Math.random() * 100) + 100; // Random scroll between 100-200px
        currentPosition += scrollAmount;
        
        await this.page.evaluate((scrollPos) => {
          window.scrollTo({
            top: scrollPos,
            behavior: 'smooth'
          });
        }, currentPosition);
        
        // Add a random pause between scrolls
        await this.randomDelay(500, 2000);
        
        // Occasionally move the mouse
        if (Math.random() > 0.7) {
          const x = Math.floor(Math.random() * (await this.page.viewportSize()).width);
          const y = Math.floor(Math.random() * viewportHeight);
          await this.page.mouse.move(x, y);
        }
      }
      
      // Scroll back up randomly
      await this.randomDelay(1000, 2000);
      
      // Scroll back to top in chunks
      while (currentPosition > 0) {
        const scrollAmount = Math.floor(Math.random() * 100) + 100;
        currentPosition -= scrollAmount;
        if (currentPosition < 0) currentPosition = 0;
        
        await this.page.evaluate((scrollPos) => {
          window.scrollTo({
            top: scrollPos,
            behavior: 'smooth'
          });
        }, currentPosition);
        
        await this.randomDelay(500, 1500);
      }
    } catch (error) {
      logger.error(`Error during human-like scrolling: ${error.message}`);
    }
  }
}

module.exports = WeWorkRemotelyScraper; 