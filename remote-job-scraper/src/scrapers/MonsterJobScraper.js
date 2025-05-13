const axios = require('axios');
const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const config = require('../../config/config');
const qualityFilter = require('../utils/qualityFilter');

/**
 * Monster.com job scraper using the official Monster Job Search API
 */
class MonsterJobScraper extends BaseScraper {
  constructor() {
    super('MonsterAPI');
    this.apiConfig = config.sources.monster || {};
    this.baseUrl = this.apiConfig.baseUrl || 'https://api.jobs.com/v3';
    this.apiKey = process.env.MONSTER_API_KEY || this.apiConfig.apiKey;
    this.queries = this.apiConfig.queries || [
      'remote data entry',
      'remote administrative assistant', 
      'remote virtual assistant',
      'remote customer service'
    ];
    this.maxJobsPerQuery = this.apiConfig.maxJobsPerQuery || 100;
    this.jobType = this.apiConfig.jobType || 'FullTime';
    this.authToken = null;
  }

  /**
   * Authenticate with Monster API
   * @returns {Promise<boolean>} Success status
   */
  async authenticate() {
    try {
      if (!this.apiKey) {
        logger.error('Monster API key not found. Set MONSTER_API_KEY in your .env file');
        return false;
      }

      const authUrl = `${this.baseUrl.replace('/v3', '')}/auth/token`;
      const response = await axios.post(authUrl, null, {
        params: {
          AppId: 'RemoteJobScraper',
          AppSecret: this.apiKey
        }
      });

      if (response.data && response.data.Token) {
        this.authToken = response.data.Token;
        logger.info('Successfully authenticated with Monster API');
        return true;
      } else {
        logger.error('Failed to get auth token from Monster API');
        return false;
      }
    } catch (error) {
      logger.error(`Monster API authentication error: ${error.message}`);
      if (error.response) {
        logger.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      return false;
    }
  }

  /**
   * Make an API request to Monster with the auth token
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async makeApiRequest(endpoint, params = {}) {
    try {
      if (!this.authToken) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          return null;
        }
      }

      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        params,
        headers: {
          'Authorization': `bearer ${this.authToken}`,
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      // If unauthorized, try to authenticate again
      if (error.response && error.response.status === 401) {
        logger.warn('Token expired, re-authenticating...');
        const authenticated = await this.authenticate();
        if (authenticated) {
          return this.makeApiRequest(endpoint, params);
        }
      }

      logger.error(`Monster API request error: ${error.message}`);
      if (error.response) {
        logger.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      return null;
    }
  }

  /**
   * Search for jobs using Monster API
   * @param {string} query - Search query
   * @returns {Promise<Array>} Job listings
   */
  async searchJobs(query) {
    try {
      logger.info(`Searching Monster jobs for: "${query}"`);

      // Keywords should include "remote" to filter for remote jobs
      const params = {
        keywords: query,
        country: 'US',         // Default to US
        jobType: this.jobType, // FullTime, PartTime, etc.
        age: 30,               // Jobs posted in the last 30 days
        orderBy: 'latest',     // Get newest jobs first
        page: 1,
        perPage: this.maxJobsPerQuery
      };

      const data = await this.makeApiRequest('search/jobs', params);
      
      if (!data || !Array.isArray(data)) {
        logger.warn(`No jobs found or invalid response for query: "${query}"`);
        return [];
      }

      logger.info(`Found ${data.length} Monster jobs for query: "${query}"`);
      return data;
    } catch (error) {
      logger.error(`Error searching Monster jobs: ${error.message}`);
      return [];
    }
  }

  /**
   * Process job data from API into standard format
   * @param {Array} jobs - Raw job data from API
   * @returns {Array} Processed job objects
   */
  processJobs(jobs) {
    return jobs.map(job => {
      // Extract relevant data from the API response
      return {
        title: job.title || '',
        company: job.companyName || 'Unknown Company',
        location: job.location || 'Remote',
        description: job.summary || '',
        url: job.url || job.monsterUrl || '',
        source: 'Monster',
        sourceId: job.id || job.jobId || '',
        datePosted: job.dateCreated ? new Date(job.dateCreated) : new Date(),
        isRemote: true, // We're searching specifically for remote jobs
        salary: '',    // Monster API doesn't consistently provide salary info
        tags: []
      };
    });
  }

  /**
   * Main scrape method
   * @returns {Promise<Array>} Scraped job listings
   */
  async scrape() {
    try {
      if (!this.apiConfig.enabled) {
        logger.info('Monster scraper is disabled in config');
        return [];
      }

      logger.info('Starting Monster job scraper');
      
      // Authenticate with Monster API
      const authenticated = await this.authenticate();
      if (!authenticated) {
        logger.error('Failed to authenticate with Monster API');
        return [];
      }

      const allJobs = [];

      // Search for each query
      for (const query of this.queries) {
        try {
          // Add a delay between queries to respect rate limits
          if (allJobs.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }

          const jobsData = await this.searchJobs(query);
          if (jobsData && jobsData.length > 0) {
            const processedJobs = this.processJobs(jobsData);
            allJobs.push(...processedJobs);
          }
        } catch (error) {
          logger.error(`Error processing query "${query}": ${error.message}`);
          continue; // Continue with next query
        }
      }

      // Remove duplicates based on sourceId
      const uniqueJobs = allJobs.filter((job, index, self) => 
        index === self.findIndex(j => j.sourceId === job.sourceId)
      );

      // Apply quality filter
      const filteredJobs = qualityFilter.filterJobs(uniqueJobs);
      
      logger.info(`Monster scraper completed. Found ${uniqueJobs.length} unique jobs, ${filteredJobs.length} after filtering`);
      return filteredJobs;
    } catch (error) {
      logger.error(`Error in Monster scraper: ${error.message}`);
      return [];
    }
  }
}

module.exports = MonsterJobScraper; 