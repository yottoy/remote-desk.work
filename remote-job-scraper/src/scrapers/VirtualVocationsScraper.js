const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../../config/config');
const BaseScraper = require('./BaseScraper');
const { JSDOM } = require('jsdom');

/**
 * Scraper for VirtualVocations.com
 * Scrapes remote job listings from virtualvocations.com focusing on data entry and administrative positions
 */
class VirtualVocationsScraper extends BaseScraper {
  constructor() {
    super('VirtualVocations');
    this.baseUrl = 'https://www.virtualvocations.com';
    this.credibilityScore = 9; // High credibility as they screen jobs
    
    // Target job categories with paths
    this.categories = [
      { name: 'Data Entry', path: 'q-remote-data-entry-jobs.html' },
      { name: 'Administrative Assistant', path: 'q-remote-administrative-assistant-jobs.html' },
      { name: 'Virtual Assistant', path: 'q-remote-assistant-jobs.html' }
    ];
  }
  
  /**
   * Scrape job listings from VirtualVocations.com
   * @returns {Promise<Array>} - Promise resolving to array of job objects
   */
  async scrape() {
    logger.info(`Starting VirtualVocations scraper`);
    const allJobs = [];
    
    try {
      for (const category of this.categories) {
        logger.info(`Scraping ${category.name} jobs from VirtualVocations`);
        const jobs = await this.scrapeCategory(category);
        allJobs.push(...jobs);
      }
      
      logger.info(`VirtualVocations scraper completed. Found ${allJobs.length} jobs.`);
      return allJobs;
    } catch (error) {
      logger.error(`Error in VirtualVocations scraper: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Scrape a specific category from VirtualVocations.com
   * @param {Object} category - Category to scrape
   * @returns {Promise<Array>} - Promise resolving to array of job objects
   */
  async scrapeCategory(category) {
    const url = `${this.baseUrl}/${category.path}`;
    logger.debug(`Scraping ${url}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      });
      
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      
      // Parse the job listings - VirtualVocations has a specific layout for job listings
      const jobElements = Array.from(document.querySelectorAll('.job-listing, .job-item, article.job'));
      logger.debug(`Found ${jobElements.length} job elements on page`);
      
      // If no job elements found, try alternative selectors
      if (jobElements.length === 0) {
        logger.debug('No job elements found with primary selectors, trying alternative selectors');
        // VirtualVocations might require registration to view full job details
        logger.info('VirtualVocations may require registration to view full job details');
        return [];
      }
      
      const jobs = [];
      
      for (const jobElement of jobElements) {
        try {
          // Extract job details
          const titleElement = jobElement.querySelector('h3, .job-title, a.job-title');
          if (!titleElement) continue;
          
          const title = titleElement.textContent.trim();
          
          // Skip if not relevant to data entry or admin
          if (!this.isRelevantJob(title)) continue;
          
          const companyElement = jobElement.querySelector('.company-name, .employer, .company');
          const company = companyElement ? companyElement.textContent.trim() : 'Unknown Company';
          
          const linkElement = jobElement.querySelector('a[href*="job"]');
          const link = linkElement ? new URL(linkElement.href, this.baseUrl).href : '';
          
          const locationElement = jobElement.querySelector('.job-location, .location');
          const location = locationElement ? locationElement.textContent.trim() : 'Remote';
          
          const dateElement = jobElement.querySelector('.date, .posted-date, time');
          const dateText = dateElement ? dateElement.textContent.trim() : '';
          
          // Create job object
          const job = {
            title,
            company,
            location,
            date: dateText,
            category: category.name,
            link,
            source: 'VirtualVocations',
            description: '', // Will be filled if we scrape individual job pages
            credibilityScore: this.credibilityScore
          };
          
          jobs.push(job);
          logger.debug(`Parsed job: ${title} at ${company}`);
        } catch (error) {
          logger.error(`Error parsing job element: ${error.message}`);
        }
      }
      
      logger.info(`Found ${jobs.length} jobs in category ${category.name}`);
      return jobs;
    } catch (error) {
      logger.error(`Error scraping category ${category.name}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Check if job is relevant to data entry or admin work
   * @param {string} title - Job title
   * @returns {boolean} - Whether job is relevant
   */
  isRelevantJob(title) {
    const lowercaseTitle = title.toLowerCase();
    const relevantKeywords = [
      'data entry', 'data', 'entry', 'admin', 'administrative', 'assistant', 
      'virtual assistant', 'customer service', 'support', 'clerk', 
      'receptionist', 'secretary', 'coordinator', 'operations'
    ];
    
    return relevantKeywords.some(keyword => lowercaseTitle.includes(keyword));
  }
}

module.exports = VirtualVocationsScraper; 