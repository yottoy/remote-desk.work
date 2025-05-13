const axios = require('axios');
const cheerio = require('cheerio');
const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const config = require('../../config/config');

class IndeedScraper extends BaseScraper {
  constructor() {
    super('Indeed');
    this.baseUrl = config.sources.indeed?.baseUrl || 'https://api.indeed.com/ads';
    this.apiKey = config.sources.indeed?.apiKey || '';
    this.queries = config.sources.indeed?.queries || [
      'data entry remote',
      'administrative assistant remote',
      'virtual assistant remote',
      'customer service representative remote'
    ];
    this.credibilityScore = config.sources.indeed?.credibilityScore || 8;
    this.browser = null;
    this.page = null;
    this.config = {
      rateLimitMs: 2000,
      maxRetries: 3,
      retryDelayMs: 5000
    };
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
            source: 'Indeed',
            sourceId: apiJob.jobkey,
            postedDate: apiJob.date ? new Date(apiJob.date) : null
          };
          
          // Get full job details if snippet is too short
          if (!job.descriptionText || job.descriptionText.length < 200) {
            const jobDetails = await this.fetchJobDetailsWithAxios(job.url);
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
          // Use axios instead of browser navigation
          const queryJobs = await this.scrapeQueryWithAxios(query);
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
   * Scrape Indeed web using axios for a specific query
   * @param {string} query - Search query
   * @returns {Array} - Array of job objects
   */
  async scrapeQueryWithAxios(query) {
    try {
      // Encode query for URL
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://www.indeed.com/jobs?q=${encodedQuery}&l=Remote&sort=date`;
      
      logger.info(`Scraping Indeed web for query: "${query}" at ${searchUrl}`);
      
      // Make the request with a browser-like header
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.indeed.com/'
        },
        timeout: 30000
      });
      
      // Parse HTML with cheerio
      const $ = cheerio.load(response.data);
      
      // Find job cards
      const jobCards = $('.job_seen_beacon');
      logger.info(`Found ${jobCards.length} job listings for query "${query}"`);
      
      const jobs = [];
      
      // Process each job card
      jobCards.each((index, element) => {
        try {
          // Extract job data
          const titleElement = $(element).find('.jobTitle a');
          const companyElement = $(element).find('[data-testid="company-name"]');
          const dateElement = $(element).find('.date');
          
          if (!titleElement.length || !companyElement.length) {
            logger.debug('Skipping job listing with missing essential elements');
            return; // Continue to next element (like 'continue' in a for loop)
          }
          
          // Get job details
          const title = titleElement.text().trim();
          const company = companyElement.text().trim();
          const datePosted = dateElement.length ? dateElement.text().trim().replace('Posted', '').trim() : '';
          const jobUrl = titleElement.attr('href');
          
          // Skip if missing essential data
          if (!title || !company || !jobUrl) {
            logger.debug('Skipping job listing with missing essential data');
            return;
          }
          
          // Create full job URL
          const url = jobUrl.startsWith('http') ? jobUrl : `https://www.indeed.com${jobUrl}`;
          
          // Estimate posted date
          const postedDate = this.estimatePostedDate(datePosted);
          
          // Schedule a job to fetch full details later
          jobs.push({
            title,
            company,
            url,
            source: 'Indeed',
            postedDate,
            // These fields will be populated later when we fetch full details
            description: '',
            descriptionText: '',
            location: 'Remote',
            fetchDetails: true
          });
        } catch (error) {
          logger.error(`Error processing job card: ${error.message}`);
        }
      });
      
      // Fetch full details for each job
      const jobsWithDetails = [];
      for (const job of jobs) {
        if (job.fetchDetails) {
          try {
            // Fetch job details
            const jobDetails = await this.fetchJobDetailsWithAxios(job.url);
            
            // Add details to job
            jobsWithDetails.push({
              ...job,
              description: jobDetails.description || '',
              descriptionText: jobDetails.descriptionText || '',
              fetchDetails: undefined // Remove this temporary field
            });
            
            // Respect rate limits
            await this.delay(this.config.rateLimitMs);
          } catch (error) {
            logger.error(`Error fetching job details for ${job.url}: ${error.message}`);
            // Include the job even without full details
            jobsWithDetails.push({
              ...job,
              fetchDetails: undefined
            });
          }
        } else {
          jobsWithDetails.push({
            ...job,
            fetchDetails: undefined
          });
        }
      }
      
      return jobsWithDetails;
    } catch (error) {
      logger.error(`Error scraping Indeed with axios for query "${query}": ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch job details from a job page
   * @param {string} url - Job URL
   * @returns {Object} - Job details object
   */
  async fetchJobDetailsWithAxios(url) {
    try {
      logger.debug(`Fetching job details from ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.indeed.com/'
        },
        timeout: 30000
      });
      
      // Parse HTML
      const $ = cheerio.load(response.data);
      
      // Extract description
      const descriptionElement = $('#jobDescriptionText');
      const description = descriptionElement.html() || '';
      const descriptionText = descriptionElement.text().trim() || '';
      
      return {
        description,
        descriptionText
      };
    } catch (error) {
      logger.error(`Error fetching job details: ${error.message}`);
      return {
        description: '',
        descriptionText: ''
      };
    }
  }

  /**
   * Clean description text
   * @param {string} description - Job description
   * @returns {string} - Cleaned description text
   */
  cleanDescription(description) {
    if (!description) return '';
    return description
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ')     // Replace multiple spaces with a single space
      .trim();
  }
  
  /**
   * Estimate posted date from description
   * @param {string} dateText - Date text from job listing
   * @returns {Date} - Estimated posted date
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
      
      // Default to today
      return now;
    } catch (error) {
      logger.error(`Error parsing date "${dateText}": ${error.message}`);
      return new Date();
    }
  }
  
  /**
   * Delay execution for a specified time
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} - Promise that resolves after the delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = IndeedScraper; 