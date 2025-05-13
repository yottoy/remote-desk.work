const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../../config/config');
const BaseScraper = require('./BaseScraper');
const { JSDOM } = require('jsdom');

/**
 * Scraper for HeyRemote.io
 * Scrapes remote job listings from heyremote.io which has data entry and virtual assistant positions
 */
class HeyRemoteIoScraper extends BaseScraper {
  constructor() {
    super('HeyRemoteIo');
    this.baseUrl = 'https://heyremote.io';
    this.credibilityScore = 8; // Similar credibility level to remoteco
    
    // Target job categories with more specific paths
    this.categories = [
      { name: 'Data Entry', path: 'remote-Data-Entry-jobs' },
      { name: 'Virtual Assistant', path: 'remote-Virtual-Assistant-jobs' },
      { name: 'Customer Support', path: 'remote-Customer-Support-jobs' },
    ];
    
    this.userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ];
  }
  
  /**
   * Get a random user agent
   * @returns {string} - Random user agent string
   */
  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
  
  /**
   * Scrape job listings from HeyRemote.io using HTTP requests
   * @returns {Array} - Array of job objects
   */
  async scrape() {
    logger.info(`Starting to scrape ${this.name}`);
    const allJobs = [];
    
    try {
      // Scrape each category
      for (const category of this.categories) {
        logger.info(`Scraping category: ${category.name}`);
        const categoryJobs = await this.fetchJobsFromCategory(category);
        
        if (categoryJobs.length > 0) {
          logger.info(`Found ${categoryJobs.length} jobs in category ${category.name}`);
          allJobs.push(...categoryJobs);
        } else {
          logger.warn(`No jobs found in category ${category.name}`);
        }
      }
      
      logger.info(`Finished scraping ${this.name}, found ${allJobs.length} jobs`);
      return allJobs;
    } catch (error) {
      logger.error(`Error scraping ${this.name}: ${error.message}`);
      return allJobs;
    }
  }
  
  /**
   * Fetch jobs from a specific category
   * @param {Object} category - The category object containing name and path
   * @returns {Promise<Array>} - Array of job objects
   */
  async fetchJobsFromCategory(category) {
    try {
      // Build the category URL
      const categoryUrl = `${this.baseUrl}/categories/${category.path}`;
      logger.debug(`Fetching jobs from URL: ${categoryUrl}`);
      
      // Make the request with proper headers to avoid being blocked
      const response = await axios.get(categoryUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': this.baseUrl
        },
        timeout: 30000
      });
      
      // Check if the request was successful
      if (response.status !== 200) {
        logger.error(`Failed to fetch jobs from category ${category.name}: ${response.status} ${response.statusText}`);
        return [];
      }
      
      logger.debug(`Successfully fetched HTML for category ${category.name} (${response.data.length} bytes)`);
      
      // Use JSDOM for more reliable parsing
      const jobs = this.parseJobsWithJSDOM(response.data, category.name);
      
      return jobs;
    } catch (error) {
      logger.error(`Error fetching jobs from category ${category.name}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Parse jobs from HTML response using JSDOM
   * @param {string} html - HTML response
   * @param {string} category - Job category
   * @returns {Array} - Array of job objects
   */
  parseJobsWithJSDOM(html, category) {
    const jobs = [];
    
    try {
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Find all job listings - adapt based on the actual HTML structure
      const jobCards = document.querySelectorAll('li, .job-item, .job-card, [class*="job"]');
      logger.debug(`Found ${jobCards.length} potential job elements for category ${category}`);
      
      // Process each job element
      for (let i = 0; i < jobCards.length; i++) {
        try {
          const jobCard = jobCards[i];
          
          // Look for common job card elements - adapt based on actual HTML structure
          const title = this.extractElementText(jobCard.querySelector('h3, .job-title, .title'));
          const company = this.extractElementText(jobCard.querySelector('.company, .company-name, [class*="company"]'));
          
          const urlElement = jobCard.querySelector('a[href*="/remote-"], a[href*="apply-now"], a.job-link');
          const url = urlElement ? urlElement.getAttribute('href') : '';
          
          const timeElement = jobCard.querySelector('time, .posted, .time, [class*="time"]');
          const timeText = this.extractElementText(timeElement);
          
          const locationElement = jobCard.querySelector('.location, [class*="location"]');
          const location = this.extractElementText(locationElement) || 'Remote';
          
          // Only create job objects for entries that look like actual jobs
          if (title && (url || company)) {
            // Create job object
            const job = {
              title: this.cleanText(title),
              company: company ? this.cleanText(company) : 'Unknown Company',
              url: this.formatUrl(url),
              postedDate: timeText ? this.parsePostedDate(timeText) : new Date(),
              location: this.cleanText(location),
              description: `Remote ${category} job at ${company || 'company'}`,
              descriptionText: `Remote ${category} job`,
              source: this.name,
              credibilityScore: this.credibilityScore,
              category
            };
            
            jobs.push(job);
            logger.debug(`Found job: ${job.title} at ${job.company}`);
          }
        } catch (error) {
          logger.error(`Error parsing job element: ${error.message}`);
        }
      }
      
      return jobs;
    } catch (error) {
      logger.error(`Error parsing jobs with JSDOM: ${error.message}`);
      return jobs;
    }
  }
  
  /**
   * Extract text from element safely
   * @param {Element} element - DOM element
   * @returns {string} - Element text or empty string
   */
  extractElementText(element) {
    return element ? element.textContent : '';
  }
  
  /**
   * Format URL (handle relative URLs)
   * @param {string} url - URL from job listing
   * @returns {string} - Formatted URL
   */
  formatUrl(url) {
    if (!url) return '';
    return url.startsWith('http') ? url : `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  
  /**
   * Clean text by removing extra whitespace and HTML entities
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Parse posted date text to Date object
   * @param {string} postedText - Text indicating when the job was posted
   * @returns {Date} - Date object
   */
  parsePostedDate(postedText) {
    try {
      if (!postedText) {
        return new Date(); // Default to current date if no text
      }
      
      const lowerText = postedText.toLowerCase().trim();
      
      // Handle "Xh" (hours) format
      if (lowerText.includes('h')) {
        const hours = parseInt(lowerText.replace(/[^0-9]/g, ''), 10) || 0;
        const date = new Date();
        date.setHours(date.getHours() - hours);
        return date;
      }
      
      // Handle "Xd" (days) format
      if (lowerText.includes('d')) {
        const days = parseInt(lowerText.replace(/[^0-9]/g, ''), 10) || 0;
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
      }
      
      // Try using a direct date parser for any standard date formats
      const date = new Date(postedText);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      return new Date(); // Default to current date
    } catch (error) {
      logger.error(`Error parsing posted date "${postedText}": ${error.message}`);
      return new Date(); // Default to current date if parsing fails
    }
  }
}

module.exports = HeyRemoteIoScraper; 