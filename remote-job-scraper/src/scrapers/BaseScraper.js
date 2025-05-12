const { chromium } = require('playwright');
const logger = require('../utils/logger');
const config = require('../../config/config');
const bypasser = require('../utils/bypasser');

class BaseScraper {
  constructor(name) {
    this.name = name;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.config = config.scraping;
  }

  /**
   * Initialize the browser
   */
  async init() {
    logger.info(`Initializing ${this.name} scraper`);
    try {
      this.browser = await chromium.launch({
        headless: true
      });
      
      // Use anti-scraping bypasser to configure browser context
      this.context = await bypasser.configureBrowserForStealth(this.browser);
      this.page = await this.context.newPage();
      
      // Set default timeout
      this.page.setDefaultTimeout(this.config.timeout);
      
      // Add common page event handlers
      this.page.on('console', msg => logger.debug(`[${this.name}] Console: ${msg.text()}`));
      this.page.on('pageerror', error => logger.error(`[${this.name}] Page error: ${error.message}`));
      
      logger.info(`${this.name} scraper initialized successfully`);
    } catch (error) {
      logger.error(`Error initializing ${this.name} scraper: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close the browser
   */
  async close() {
    logger.info(`Closing ${this.name} scraper`);
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.context = null;
        this.page = null;
        logger.info(`${this.name} scraper closed successfully`);
      }
    } catch (error) {
      logger.error(`Error closing ${this.name} scraper: ${error.message}`);
    }
  }

  /**
   * Scrape jobs from the source
   * @returns {Array} - Array of job objects
   */
  async scrape() {
    throw new Error('Scrape method must be implemented by subclasses');
  }

  /**
   * Navigate to a URL with retry logic
   * @param {string} url - The URL to navigate to
   * @returns {boolean} - Success status
   */
  async navigateTo(url) {
    logger.debug(`Navigating to ${url}`);
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        // Add random delay before navigation to mimic human behavior
        await bypasser.randomDelay(1000, 3000);
        
        const response = await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: this.config.timeout
        });
        
        // Perform random mouse movements to appear more human-like
        await bypasser.performRandomMouseMovements(this.page);
        
        // Add additional random delay after page load
        await bypasser.randomDelay(500, 2000);
        
        if (response && response.ok()) {
          logger.debug(`Successfully navigated to ${url}`);
          return true;
        } else {
          logger.warn(`Failed to navigate to ${url}, status: ${response ? response.status() : 'unknown'}`);
        }
      } catch (error) {
        logger.warn(`Navigation attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.config.retries) {
          const delay = this.config.rateLimitMs * attempt;
          logger.debug(`Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }
    
    logger.error(`Failed to navigate to ${url} after ${this.config.retries} attempts`);
    return false;
  }

  /**
   * Wait for a selector with retry logic
   * @param {string} selector - The selector to wait for
   * @param {Object} options - Additional options
   * @returns {boolean} - Success status
   */
  async waitForSelector(selector, options = {}) {
    const { timeout = this.config.timeout } = options;
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        await this.page.waitForSelector(selector, { timeout });
        logger.debug(`Selector found: ${selector}`);
        return true;
      } catch (error) {
        logger.warn(`Wait for selector attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.config.retries) {
          const delay = this.config.rateLimitMs * attempt;
          logger.debug(`Retrying in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }
    
    logger.error(`Failed to find selector ${selector} after ${this.config.retries} attempts`);
    return false;
  }

  /**
   * Utility method to delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after delay
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract text from a node with selector
   * @param {string} selector - The selector to extract text from
   * @param {Object} options - Additional options
   * @returns {string} - Extracted text or empty string
   */
  async extractText(selector, options = {}) {
    const { parent = this.page, defaultValue = '' } = options;
    
    try {
      await this.waitForSelector(selector);
      const text = await parent.textContent(selector);
      return text ? text.trim() : defaultValue;
    } catch (error) {
      logger.debug(`Error extracting text from ${selector}: ${error.message}`);
      return defaultValue;
    }
  }

  /**
   * Extract an attribute from a node with selector
   * @param {string} selector - The selector to extract attribute from
   * @param {string} attribute - The attribute name to extract
   * @param {Object} options - Additional options
   * @returns {string} - Extracted attribute value or empty string
   */
  async extractAttribute(selector, attribute, options = {}) {
    const { parent = this.page, defaultValue = '' } = options;
    
    try {
      await this.waitForSelector(selector);
      const value = await parent.getAttribute(selector, attribute);
      return value || defaultValue;
    } catch (error) {
      logger.debug(`Error extracting attribute ${attribute} from ${selector}: ${error.message}`);
      return defaultValue;
    }
  }

  /**
   * Parse date string to Date object
   * @param {string} dateString - Date string to parse
   * @param {Object} options - Additional options
   * @returns {Date|null} - Parsed Date object or null
   */
  parseDate(dateString, options = {}) {
    const { format = 'auto', baseDate = new Date() } = options;
    
    if (!dateString) return null;
    
    try {
      // Try direct parsing
      const directDate = new Date(dateString);
      if (!isNaN(directDate.getTime())) {
        return directDate;
      }
      
      // Handle relative dates
      const lowerDateString = dateString.toLowerCase();
      
      if (lowerDateString.includes('today')) {
        return new Date();
      }
      
      if (lowerDateString.includes('yesterday')) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
      }
      
      // Parse "X days/weeks/months ago" format
      const timeUnitMatch = lowerDateString.match(/(\d+)\s+(day|week|month|year)s?\s+ago/i);
      if (timeUnitMatch) {
        const amount = parseInt(timeUnitMatch[1], 10);
        const unit = timeUnitMatch[2].toLowerCase();
        
        const date = new Date(baseDate);
        
        if (unit === 'day') {
          date.setDate(date.getDate() - amount);
        } else if (unit === 'week') {
          date.setDate(date.getDate() - (amount * 7));
        } else if (unit === 'month') {
          date.setMonth(date.getMonth() - amount);
        } else if (unit === 'year') {
          date.setFullYear(date.getFullYear() - amount);
        }
        
        return date;
      }
      
      logger.warn(`Could not parse date string: ${dateString}`);
      return null;
    } catch (error) {
      logger.error(`Error parsing date: ${error.message}`);
      return null;
    }
  }
}

module.exports = BaseScraper; 