const axios = require('axios');
const cheerio = require('cheerio');
const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const config = require('../../config/config');

class IndeedScraper extends BaseScraper {
  constructor() {
    super('Indeed');
    this.baseUrl = config.sources.indeed.baseUrl;
    this.apiKey = config.sources.indeed.apiKey;
    this.queries = config.sources.indeed.queries;
  }

  /**
   * Scrape jobs from Indeed
   * @returns {Array} - Array of job objects
   */
  async scrape() {
    try {
      logger.info('Starting to scrape jobs from Indeed');
      
      // If API key is not provided, use web scraping
      if (!this.apiKey) {
        logger.warn('Indeed API key not provided, falling back to web scraping');
        return this.scrapeViaWeb();
      }
      
      // Otherwise use the API
      return this.scrapeViaApi();
    } catch (error) {
      logger.error(`Error scraping Indeed: ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape Indeed using their API
   * @returns {Array} - Array of job objects
   */
  async scrapeViaApi() {
    try {
      logger.info('Scraping Indeed via API');
      
      const jobs = [];
      
      // Process each search query
      for (const query of this.queries) {
        try {
          const queryJobs = await this.fetchJobsViaApi(query);
          jobs.push(...queryJobs);
          
          // Respect rate limits between API calls
          await this.delay(this.config.rateLimitMs);
        } catch (error) {
          logger.error(`Error scraping Indeed API with query "${query}": ${error.message}`);
          continue; // Continue with next query
        }
      }
      
      logger.info(`Finished scraping Indeed via API, found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      logger.error(`Error in Indeed API scraping: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch jobs from Indeed API for a specific query
   * @param {string} query - Search query
   * @returns {Array} - Array of job objects
   */
  async fetchJobsViaApi(query) {
    try {
      logger.info(`Fetching Indeed jobs via API for query: "${query}"`);
      
      // Build API request
      const params = {
        publisher: this.apiKey,
        q: query,
        l: 'Remote',
        limit: 25,
        highlight: 0,
        sort: 'date',
        radius: 0,
        fromage: 30,
        format: 'json'
      };
      
      // Make API request
      const response = await axios.get(`${this.baseUrl}/jobs`, { params });
      
      if (!response.data || !response.data.results) {
        logger.warn(`No job results found for query "${query}"`);
        return [];
      }
      
      const apiJobs = response.data.results;
      logger.info(`Found ${apiJobs.length} Indeed jobs for query "${query}"`);
      
      // Process job results
      const jobs = [];
      
      for (const apiJob of apiJobs) {
        try {
          // Create job object from API response
          const job = {
            title: apiJob.jobtitle,
            company: apiJob.company,
            location: apiJob.formattedLocation || 'Remote',
            url: apiJob.url,
            description: apiJob.snippet,
            descriptionText: this.cleanDescription(apiJob.snippet),
            source: 'indeed',
            sourceId: apiJob.jobkey,
            postedDate: apiJob.date ? new Date(apiJob.date) : null
          };
          
          // Get full job details if snippet is too short
          if (!job.descriptionText || job.descriptionText.length < 200) {
            const jobDetails = await this.scrapeJobDetails(job.url);
            job.description = jobDetails.description || job.description;
            job.descriptionText = jobDetails.descriptionText || job.descriptionText;
          }
          
          jobs.push(job);
          logger.debug(`Scraped job: ${job.title} at ${job.company}`);
          
          // Respect rate limits between job detail requests
          await this.delay(this.config.rateLimitMs);
        } catch (error) {
          logger.error(`Error processing Indeed API job: ${error.message}`);
          continue; // Continue with next job
        }
      }
      
      return jobs;
    } catch (error) {
      logger.error(`Error fetching Indeed jobs via API for query "${query}": ${error.message}`);
      
      if (error.response) {
        logger.error(`API response status: ${error.response.status}`);
        logger.error(`API response data: ${JSON.stringify(error.response.data)}`);
      }
      
      return [];
    }
  }

  /**
   * Scrape Indeed using web scraping (fallback method)
   * @returns {Array} - Array of job objects
   */
  async scrapeViaWeb() {
    try {
      await this.init();
      logger.info('Scraping Indeed via web scraping');
      
      const jobs = [];
      
      // Process each search query
      for (const query of this.queries) {
        try {
          const queryJobs = await this.scrapeQueryFromWeb(query);
          jobs.push(...queryJobs);
          
          // Respect rate limits between queries
          await this.delay(this.config.rateLimitMs);
        } catch (error) {
          logger.error(`Error scraping Indeed web for query "${query}": ${error.message}`);
          continue; // Continue with next query
        }
      }
      
      logger.info(`Finished scraping Indeed via web, found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      logger.error(`Error in Indeed web scraping: ${error.message}`);
      return [];
    } finally {
      await this.close();
    }
  }

  /**
   * Scrape Indeed web for a specific query
   * @param {string} query - Search query
   * @returns {Array} - Array of job objects
   */
  async scrapeQueryFromWeb(query) {
    // Encode query for URL
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.indeed.com/jobs?q=${encodedQuery}&l=Remote&sort=date`;
    
    logger.info(`Scraping Indeed web for query: "${query}" at ${searchUrl}`);
    
    const success = await this.navigateTo(searchUrl);
    if (!success) {
      logger.error(`Failed to navigate to Indeed search page for query: "${query}"`);
      return [];
    }
    
    try {
      // Wait for job listings to load
      await this.waitForSelector('.jobsearch-ResultsList');
      
      // Get all job listings
      const jobElements = await this.page.$$('.job_seen_beacon');
      logger.info(`Found ${jobElements.length} job listings for query "${query}"`);
      
      const jobs = [];
      
      // Process each job listing
      for (const jobElement of jobElements) {
        try {
          // Extract job data
          const titleElement = await jobElement.$('.jobTitle a');
          const companyElement = await jobElement.$('[data-testid="company-name"]');
          const dateElement = await jobElement.$('.date');
          
          if (!titleElement || !companyElement) {
            logger.debug('Skipping job listing with missing essential elements');
            continue;
          }
          
          // Get job details
          const title = await titleElement.textContent().then(text => text.trim());
          const company = await companyElement.textContent().then(text => text.trim());
          const datePosted = await dateElement?.textContent().then(text => text?.trim().replace('Posted', '').trim() || '');
          const jobUrl = await titleElement.getAttribute('href');
          
          // Skip if missing essential data
          if (!title || !company || !jobUrl) {
            logger.debug('Skipping job listing with missing essential data');
            continue;
          }
          
          // Create full job URL
          const url = jobUrl.startsWith('http') ? jobUrl : `https://www.indeed.com${jobUrl}`;
          
          // Get job details page
          const jobDetails = await this.scrapeJobDetails(url);
          
          // Create job object
          const job = {
            title,
            company,
            url,
            source: 'indeed',
            postedDate: this.parseDate(datePosted),
            ...jobDetails
          };
          
          jobs.push(job);
          logger.debug(`Scraped job: ${job.title} at ${job.company}`);
          
          // Respect rate limits between job detail page visits
          await this.delay(this.config.rateLimitMs);
        } catch (error) {
          logger.error(`Error processing Indeed job listing: ${error.message}`);
          continue; // Continue with next job listing
        }
      }
      
      return jobs;
    } catch (error) {
      logger.error(`Error scraping Indeed web for query "${query}": ${error.message}`);
      return [];
    }
  }

  /**
   * Scrape details for a specific job
   * @param {string} url - Job URL to scrape details from
   * @returns {Object} - Job details
   */
  async scrapeJobDetails(url) {
    logger.debug(`Scraping Indeed job details from ${url}`);
    
    try {
      // For API mode, use axios to fetch the page
      if (!this.browser) {
        return this.fetchJobDetailsWithAxios(url);
      }
      
      // For web scraping mode, use browser
      const success = await this.navigateTo(url);
      if (!success) {
        logger.error(`Failed to navigate to Indeed job details page: ${url}`);
        return {};
      }
      
      try {
        // Wait for job description to load
        await this.waitForSelector('#jobDescriptionText');
        
        // Extract job description
        const description = await this.page.$eval('#jobDescriptionText', 
          el => el.outerHTML
        ).catch(() => '');
        
        // Extract plain text description for analysis
        const descriptionText = await this.page.$eval('#jobDescriptionText', 
          el => el.textContent
        ).catch(() => '');
        
        // Extract location
        const location = await this.extractText('.jobsearch-JobInfoHeader-subtitle .icl-u-xs-mt--xs').catch(() => 'Remote');
        
        // Extract salary if available
        const salary = await this.extractText('[data-testid="attribute_snippet_testid"]').catch(() => '');
        
        return {
          description,
          descriptionText: this.cleanDescription(descriptionText),
          location: location || 'Remote',
          salary
        };
      } catch (error) {
        logger.error(`Error scraping Indeed job details from ${url}: ${error.message}`);
        return {};
      }
    } catch (error) {
      logger.error(`Error in Indeed job details scraping: ${error.message}`);
      return {};
    }
  }

  /**
   * Fetch job details using axios (for API mode)
   * @param {string} url - Job URL to fetch details from
   * @returns {Object} - Job details
   */
  async fetchJobDetailsWithAxios(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Extract job description
      const description = $('#jobDescriptionText').html() || '';
      
      // Extract plain text description for analysis
      const descriptionText = $('#jobDescriptionText').text() || '';
      
      // Extract location
      const location = $('.jobsearch-JobInfoHeader-subtitle .icl-u-xs-mt--xs').text().trim() || 'Remote';
      
      // Extract salary if available
      const salary = $('[data-testid="attribute_snippet_testid"]').text().trim() || '';
      
      return {
        description,
        descriptionText: this.cleanDescription(descriptionText),
        location,
        salary
      };
    } catch (error) {
      logger.error(`Error fetching Indeed job details with axios from ${url}: ${error.message}`);
      return {};
    }
  }

  /**
   * Clean HTML description to text
   * @param {string} description - HTML or text description
   * @returns {string} - Cleaned text description
   */
  cleanDescription(description) {
    if (!description) return '';
    
    // Remove HTML tags
    let text = description.replace(/<[^>]*>/g, ' ');
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }
}

module.exports = IndeedScraper; 