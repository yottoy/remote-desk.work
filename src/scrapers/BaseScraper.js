const { chromium } = require('playwright');
const logger = require('../utils/logger');
const config = require('../../config/config');
const bypasser = require('../utils/bypasser');

/**
 * Simplified BaseScraper class for testing
 */
class BaseScraper {
  constructor(name) {
    this.name = name;
  }

  async init() {
    // Not needed for our test
  }

  async close() {
    // Not needed for our test
  }

  async scrape() {
    throw new Error('Scrape method must be implemented by subclasses');
  }
}

module.exports = BaseScraper; 