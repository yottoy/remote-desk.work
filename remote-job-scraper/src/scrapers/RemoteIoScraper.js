const { chromium } = require('playwright');
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../../config/config');
const BaseScraper = require('./BaseScraper');
const bypasser = require('../utils/bypasser');

/**
 * Scraper for Remote.io using a lighter approach
 * Scrapes remote job listings from remote.io
 */
class RemoteIoScraper extends BaseScraper {
  constructor() {
    super('RemoteIo');
    this.baseUrl = 'https://www.remote.io';
    this.apiUrl = 'https://www.remote.io/api/jobs';
    this.credibilityScore = 8; // Similar credibility level to remoteco
    this.categories = ['Admin and Assistants', 'Customer Service', 'Data'];
    // Target job categories - lowercase for API requests
    this.targetCategories = ['admin-and-assistants', 'customer-service', 'data'];
    this.jobsPerPage = 20;
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
   * Scrape job listings from Remote.io using API requests instead of browser automation
   * @returns {Array} - Array of job objects
   */
  async scrape() {
    logger.info(`Starting to scrape ${this.name} using API approach`);
    const allJobs = [];
    
    try {
      // First, try to get all jobs from the main page
      logger.info('Fetching jobs from main page');
      const mainPageJobs = await this.fetchJobsFromApi();
      
      if (mainPageJobs && mainPageJobs.length > 0) {
        logger.info(`Found ${mainPageJobs.length} jobs from main page`);
        allJobs.push(...mainPageJobs);
      }
      
      // Then try to fetch jobs for each category
      for (const category of this.targetCategories) {
        logger.info(`Fetching jobs for category: ${category}`);
        const categoryJobs = await this.fetchJobsFromApi(category);
        
        if (categoryJobs && categoryJobs.length > 0) {
          logger.info(`Found ${categoryJobs.length} jobs in category ${category}`);
          allJobs.push(...categoryJobs);
        }
      }
      
      // Remove duplicates
      const uniqueJobs = this.removeDuplicateJobs(allJobs);
      logger.info(`Finished scraping ${this.name}, found ${uniqueJobs.length} unique jobs after deduplication`);
      
      return uniqueJobs;
    } catch (error) {
      logger.error(`Error scraping ${this.name}: ${error.message}`);
      return allJobs;
    }
  }
  
  /**
   * Fetch jobs from Remote.io API
   * @param {string} category - Optional category to filter by
   * @param {number} page - Page number (default: 1)
   * @returns {Promise<Array>} - Array of job objects
   */
  async fetchJobsFromApi(category = '', page = 1) {
    try {
      // Build the API URL
      let url = this.baseUrl;
      
      if (category) {
        url = `${this.baseUrl}/remote-${category.toLowerCase()}-jobs`;
      }
      
      if (page > 1) {
        url = `${url}/page/${page}`;
      }
      
      // Make the request with proper headers to emulate a browser
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': this.baseUrl,
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 30000
      });
      
      // Check if the request was successful
      if (response.status !== 200) {
        logger.error(`Failed to fetch jobs from API: ${response.status} ${response.statusText}`);
        return [];
      }
      
      // Parse the HTML response using regex or simple patterns
      // This is more reliable than using a full DOM parser for scraping
      const jobs = this.parseJobsFromHtml(response.data, category || 'All');
      
      return jobs;
    } catch (error) {
      logger.error(`Error fetching jobs from API: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Parse jobs from HTML response using basic regex
   * @param {string} html - HTML response
   * @param {string} category - Job category
   * @returns {Array} - Array of job objects
   */
  parseJobsFromHtml(html, category) {
    const jobs = [];
    
    try {
      // Pattern to match job listings
      const jobPattern = /<div\s+class="job-card[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
      
      // Find all job matches
      let match;
      while ((match = jobPattern.exec(html)) !== null) {
        try {
          const jobHtml = match[0];
          
          // Extract job data using more specific patterns
          const titleMatch = /<h3[^>]*>([^<]+)<\/h3>/i.exec(jobHtml);
          const companyMatch = /<div[^>]*class="company"[^>]*>([^<]+)<\/div>/i.exec(jobHtml);
          const locationMatch = /<div[^>]*class="location"[^>]*>([^<]+)<\/div>/i.exec(jobHtml);
          const urlMatch = /<a\s+href="([^"]+)"[^>]*>/i.exec(jobHtml);
          const timeMatch = /<time[^>]*>([^<]+)<\/time>/i.exec(jobHtml);
          const salaryMatch = /<div[^>]*class="salary"[^>]*>([^<]+)<\/div>/i.exec(jobHtml);
          
          // Extract keywords
          const keywords = [];
          const keywordPattern = /<span[^>]*class="(?:keyword|tag|skill)"[^>]*>([^<]+)<\/span>/gi;
          let keywordMatch;
          while ((keywordMatch = keywordPattern.exec(jobHtml)) !== null) {
            keywords.push(keywordMatch[1].trim());
          }
          
          // Create job object
          const job = {
            title: titleMatch ? this.cleanText(titleMatch[1]) : '',
            company: companyMatch ? this.cleanText(companyMatch[1]) : 'Unknown Company',
            location: locationMatch ? this.cleanText(locationMatch[1]) : 'Remote',
            url: urlMatch ? this.formatUrl(urlMatch[1]) : '',
            description: keywords.join(', '),
            descriptionText: keywords.join(', '),
            postedDate: timeMatch ? this.parsePostedDate(timeMatch[1]) : new Date(),
            salary: salaryMatch ? this.cleanText(salaryMatch[1]) : '',
            source: this.name,
            credibilityScore: this.credibilityScore,
            category
          };
          
          // Add to jobs array if it has required fields
          if (job.title && job.url) {
            jobs.push(job);
          }
        } catch (error) {
          logger.error(`Error parsing job data: ${error.message}`);
        }
      }
      
      return jobs;
    } catch (error) {
      logger.error(`Error parsing jobs from HTML: ${error.message}`);
      return jobs;
    }
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
   * Remove duplicate jobs based on job URL
   * @param {Array} jobs - Array of job objects
   * @returns {Array} - Array of unique job objects
   */
  removeDuplicateJobs(jobs) {
    const uniqueJobs = [];
    const urls = new Set();
    
    for (const job of jobs) {
      if (job.url && !urls.has(job.url)) {
        urls.add(job.url);
        uniqueJobs.push(job);
      }
    }
    
    return uniqueJobs;
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
      
      const lowerText = postedText.toLowerCase();
      
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

module.exports = RemoteIoScraper; 