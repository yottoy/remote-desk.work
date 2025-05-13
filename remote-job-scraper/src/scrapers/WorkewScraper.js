const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../../config/config');
const BaseScraper = require('./BaseScraper');
const { JSDOM } = require('jsdom');

/**
 * Scraper for Workew.com
 * Scrapes remote job listings from workew.com focusing on data entry and administrative positions
 */
class WorkewScraper extends BaseScraper {
  constructor() {
    super('Workew');
    this.baseUrl = 'https://workew.com';
    this.credibilityScore = 7.5; // Moderate credibility
    
    // Target job categories with paths
    this.categories = [
      { name: 'Customer Service', path: 'remote-jobs' }, // Search all jobs instead of categories
      { name: 'Administrative', path: 'remote-jobs' }, // Search all jobs
      { name: 'Data Entry', path: 'remote-jobs' } // Search all jobs
    ];
    
    // Keywords for each category to filter by
    this.categoryKeywords = {
      'Customer Service': ['customer service', 'customer support', 'support specialist'],
      'Administrative': ['administrative', 'admin', 'assistant', 'secretary', 'receptionist', 'coordinator'],
      'Data Entry': ['data entry', 'data', 'entry', 'typing', 'clerk']
    };
  }
  
  /**
   * Scrape job listings from Workew.com
   * @returns {Promise<Array>} - Promise resolving to array of job objects
   */
  async scrape() {
    logger.info(`Starting Workew scraper`);
    const allJobs = [];
    
    try {
      // Use a simpler approach - just scrape all jobs once and filter by keywords
      const url = `${this.baseUrl}/remote-jobs`;
      logger.info(`Scraping all jobs from Workew at ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });
      
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      
      // Debug log the HTML structure for analysis
      logger.debug(`Response HTML structure: ${dom.serialize().substring(0, 200)}...`);
      
      // Find all job cards or listings
      const jobCards = Array.from(document.querySelectorAll('article, .job-card, li.job-item, [class*="job"]'));
      logger.debug(`Found ${jobCards.length} job cards`);
      
      if (jobCards.length === 0) {
        // If no job cards found, try to inspect all elements with 'job' in their text
        logger.debug('No job cards found, searching for job-related elements');
        const allElements = Array.from(document.querySelectorAll('*'));
        const jobElements = allElements.filter(el => 
          el.textContent && 
          (el.textContent.toLowerCase().includes('job') || 
           el.textContent.toLowerCase().includes('remote'))
        );
        logger.debug(`Found ${jobElements.length} elements with job-related text`);
      }
      
      for (const jobCard of jobCards) {
        try {
          // Extract job title - try multiple selectors
          const titleElement = jobCard.querySelector('h2, h3, h4, .job-title, .title, a[href*="job"]');
          if (!titleElement) {
            logger.debug(`No title element found for job card: ${jobCard.outerHTML.substring(0, 100)}...`);
            continue;
          }
          
          const title = titleElement.textContent.trim();
          logger.debug(`Found job: ${title}`);
          
          // Determine which category this job fits into
          const matchedCategory = this.findMatchingCategory(title);
          if (!matchedCategory) {
            logger.debug(`Job "${title}" doesn't match any target categories, skipping`);
            continue;
          }
          
          // Extract other job details
          const companyElement = jobCard.querySelector('.company, [class*="company"], .employer');
          const company = companyElement ? companyElement.textContent.trim() : 'Unknown Company';
          
          const linkElement = titleElement.tagName === 'A' ? titleElement : jobCard.querySelector('a');
          const link = linkElement ? new URL(linkElement.href, this.baseUrl).href : '';
          
          const locationElement = jobCard.querySelector('.location, [class*="location"], [class*="remote"]');
          const location = locationElement ? locationElement.textContent.trim() : 'Remote';
          
          const dateElement = jobCard.querySelector('.date, [class*="date"], [class*="time"], time');
          const dateText = dateElement ? dateElement.textContent.trim() : '';
          
          // Create job object
          const job = {
            title,
            company,
            location,
            date: dateText,
            category: matchedCategory,
            link,
            source: 'Workew',
            description: '', // Will be filled if we scrape individual job pages
            credibilityScore: this.credibilityScore
          };
          
          allJobs.push(job);
          logger.debug(`Added job: ${title} at ${company}`);
        } catch (error) {
          logger.error(`Error parsing job card: ${error.message}`);
        }
      }
      
      logger.info(`Workew scraper completed. Found ${allJobs.length} jobs.`);
      return allJobs;
    } catch (error) {
      logger.error(`Error in Workew scraper: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Find which category a job title matches
   * @param {string} title - Job title
   * @returns {string|null} - Matching category or null if no match
   */
  findMatchingCategory(title) {
    const lowercaseTitle = title.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => lowercaseTitle.includes(keyword))) {
        return category;
      }
    }
    
    return null;
  }
}

module.exports = WorkewScraper; 