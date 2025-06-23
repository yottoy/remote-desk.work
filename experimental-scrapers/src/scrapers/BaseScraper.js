const { chromium } = require('playwright');
const logger = require('../utils/logger');
const { randomDelay, getRandomUserAgent } = require('../utils/helpers');

/**
 * Base scraper class for experimental scrapers
 */
class BaseScraper {
  constructor(name, config = {}) {
    this.name = name;
    this.config = {
      headless: true,
      timeout: 30000,
      maxRetries: 3,
      ...config
    };
    this.browser = null;
    this.page = null;
    this.retryCount = 0;
  }

  /**
   * Initialize the scraper
   */
  async init() {
    try {
      logger.info(`Initializing ${this.name} scraper`);
      
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const context = await this.browser.newContext({
        userAgent: getRandomUserAgent(),
        viewport: { width: 1366, height: 768 },
        locale: 'en-US',
        timezoneId: 'America/New_York'
      });

      this.page = await context.newPage();
      
      // Set default timeout
      this.page.setDefaultTimeout(this.config.timeout);
      
      // Block unnecessary resources to speed up scraping
      await this.page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      logger.info(`${this.name} scraper initialized successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to initialize ${this.name} scraper: ${error.message}`);
      return false;
    }
  }

  /**
   * Navigate to a URL with retry logic
   */
  async navigateTo(url, options = {}) {
    const maxRetries = options.retries || this.config.maxRetries;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`Navigating to ${url} (attempt ${attempt}/${maxRetries})`);
        
        await this.page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: this.config.timeout
        });
        
        // Random delay to appear more human-like
        await randomDelay(1000, 3000);
        
        return true;
      } catch (error) {
        logger.warn(`Navigation attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          logger.error(`Failed to navigate to ${url} after ${maxRetries} attempts`);
          return false;
        }
        
        // Wait before retrying
        await randomDelay(2000, 5000);
      }
    }
    
    return false;
  }

  /**
   * Wait for a selector with timeout
   */
  async waitForSelector(selector, options = {}) {
    try {
      await this.page.waitForSelector(selector, {
        timeout: options.timeout || this.config.timeout,
        state: options.state || 'visible'
      });
      return true;
    } catch (error) {
      logger.debug(`Selector ${selector} not found: ${error.message}`);
      return false;
    }
  }

  /**
   * Extract text content from an element
   */
  async getTextContent(selector, defaultValue = '') {
    try {
      const element = await this.page.$(selector);
      if (element) {
        const text = await element.textContent();
        return text ? text.trim() : defaultValue;
      }
      return defaultValue;
    } catch (error) {
      logger.debug(`Error getting text content for ${selector}: ${error.message}`);
      return defaultValue;
    }
  }

  /**
   * Extract attribute from an element
   */
  async getAttribute(selector, attribute, defaultValue = '') {
    try {
      const element = await this.page.$(selector);
      if (element) {
        const value = await element.getAttribute(attribute);
        return value || defaultValue;
      }
      return defaultValue;
    } catch (error) {
      logger.debug(`Error getting attribute ${attribute} for ${selector}: ${error.message}`);
      return defaultValue;
    }
  }

  /**
   * Get all elements matching a selector
   */
  async getAllElements(selector) {
    try {
      return await this.page.$$(selector);
    } catch (error) {
      logger.debug(`Error getting elements for ${selector}: ${error.message}`);
      return [];
    }
  }

  /**
   * Scroll page to simulate human behavior
   */
  async humanScroll() {
    try {
      // Random scroll pattern
      const scrollSteps = Math.floor(Math.random() * 3) + 2; // 2-4 steps
      
      for (let i = 0; i < scrollSteps; i++) {
        const scrollAmount = Math.floor(Math.random() * 500) + 200; // 200-700px
        await this.page.evaluate((amount) => {
          window.scrollBy(0, amount);
        }, scrollAmount);
        
        await randomDelay(500, 1500);
      }
      
      // Scroll back to top
      await this.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      
      await randomDelay(500, 1000);
    } catch (error) {
      logger.debug(`Error during human scroll: ${error.message}`);
    }
  }

  /**
   * Handle common popups and overlays
   */
  async handlePopups() {
    try {
      // Common popup selectors
      const popupSelectors = [
        '[class*="cookie"] button[class*="accept"]',
        '[class*="consent"] button[class*="accept"]',
        '[id*="cookie"] button',
        '[class*="modal"] button[class*="close"]',
        '[class*="popup"] button[class*="close"]',
        'button[aria-label*="close"]',
        'button[aria-label*="dismiss"]'
      ];

      for (const selector of popupSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            await element.click();
            logger.debug(`Closed popup with selector: ${selector}`);
            await randomDelay(500, 1000);
          }
        } catch (error) {
          // Continue to next selector
        }
      }
    } catch (error) {
      logger.debug(`Error handling popups: ${error.message}`);
    }
  }

  /**
   * Close the scraper
   */
  async close() {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      logger.info(`${this.name} scraper closed`);
    } catch (error) {
      logger.error(`Error closing ${this.name} scraper: ${error.message}`);
    }
  }

  /**
   * Abstract method to be implemented by subclasses
   */
  async scrape() {
    throw new Error('Scrape method must be implemented by subclasses');
  }
}

module.exports = BaseScraper; 