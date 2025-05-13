const axios = require('axios');
const BaseScraper = require('./BaseScraper');
const logger = require('../utils/logger');
const config = require('../../config/config');
const qualityFilter = require('../utils/qualityFilter');
const bridgeManager = require('../utils/bridgeManager');

/**
 * Base scraper for all JobSpy scrapers
 */
class BaseJobSpyScraper extends BaseScraper {
  constructor(name, siteName, configKey) {
    super(name);
    this.siteName = siteName.toLowerCase();
    this.configKey = configKey || `jobspy_${this.siteName}`;
    this.jobspyConfig = config.sources[this.configKey] || {};
    this.bridgeUrl = process.env.JOBSPY_BRIDGE_URL || 'http://localhost:8000';
    this.queries = this.jobspyConfig.queries || [
      'data entry remote',
      'administrative assistant remote',
      'virtual assistant remote',
      'customer service representative remote'
    ];
    this.location = this.jobspyConfig.location || 'Remote';
    this.country = this.jobspyConfig.country || 'USA';
    this.resultsWanted = this.jobspyConfig.resultsWanted || 20;
    this.hoursOld = this.jobspyConfig.hoursOld || 72;
    this.isRemote = this.jobspyConfig.isRemote !== false; // Default to true
    this.credibilityScore = this.jobspyConfig.credibilityScore || 8;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 10000; // 10 seconds

    // Site-specific configurations
    this.siteSpecificConfig = {};
  }

  /**
   * Check if the Python bridge is running
   * @returns {Promise<boolean>} - True if bridge is running
   */
  async checkBridgeStatus() {
    try {
      return await bridgeManager.checkStatus();
    } catch (error) {
      logger.error(`Error checking bridge status: ${error.message}`);
      return false;
    }
  }

  /**
   * Ensure the bridge is running before scraping
   * @returns {Promise<boolean>} - Success status
   */
  async ensureBridgeRunning() {
    const bridgeRunning = await this.checkBridgeStatus();
    
    if (bridgeRunning) {
      logger.info('JobSpy bridge is already running');
      return true;
    }
    
    logger.info('JobSpy bridge is not running, attempting to start it...');
    return await bridgeManager.start();
  }

  /**
   * Scrape jobs using JobSpy bridge
   * @returns {Promise<Array>} - Array of job objects
   */
  async scrape() {
    try {
      // Check if this scraper is enabled
      if (!this.jobspyConfig.enabled) {
        logger.info(`JobSpy ${this.name} scraper is disabled in config`);
        return [];
      }

      logger.info(`Starting JobSpy ${this.name} scraper`);

      // Ensure bridge is running
      const bridgeReady = await this.ensureBridgeRunning();
      if (!bridgeReady) {
        throw new Error('Failed to start JobSpy bridge. Please check logs for details.');
      }

      // Prepare request for JobSpy bridge
      const requestData = {
        site_names: [this.siteName],
        search_terms: this.queries,
        location: this.location,
        results_wanted: this.resultsWanted,
        hours_old: this.hoursOld,
        country_indeed: this.country,
        is_remote: this.isRemote,
        job_type: this.jobspyConfig.jobType || null,
        distance: this.jobspyConfig.distance || 50,
        proxies: this.jobspyConfig.proxies || null,
        ...this.siteSpecificConfig
      };

      logger.info(`Sending request to JobSpy bridge for ${this.siteName} with ${this.queries.length} search terms`);
      
      // Make request to JobSpy bridge with retry logic
      const response = await this._makeRequestWithRetry(`${this.bridgeUrl}/scrape-jobs`, requestData);
      
      const { jobs, count, metadata } = response.data;
      
      logger.info(`JobSpy bridge returned ${count} jobs in ${metadata.duration_seconds.toFixed(2)} seconds`);

      // Convert JobSpy jobs to our standard format
      const processedJobs = this.processJobs(jobs);
      
      // Filter jobs
      const filteredJobs = qualityFilter.filterJobs(processedJobs);
      
      logger.info(`JobSpy ${this.name} scraper completed. Found ${processedJobs.length} jobs, ${filteredJobs.length} after filtering`);
      
      // Reset retry counter on success
      this.retryCount = 0;
      
      return filteredJobs;
    } catch (error) {
      logger.error(`Error in JobSpy ${this.name} scraper: ${error.message}`);
      
      if (error.response) {
        const status = error.response.status;
        logger.error(`API response status: ${status}`);
        
        // Log response data if available
        try {
          logger.error(`API response data: ${JSON.stringify(error.response.data)}`);
        } catch (e) {
          logger.error('Could not stringify response data');
        }
        
        // Handle specific error codes
        if (status === 429) {
          logger.warn('Rate limit exceeded. Consider adding more proxies or increasing delay.');
        } else if (status >= 500) {
          logger.warn('Bridge server error. The service might be experiencing issues.');
        }
      }
      
      // Check if it's a connection error
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        logger.error('Connection to bridge failed. The bridge might be down.');
        
        // Try to restart the bridge
        logger.info('Attempting to restart bridge...');
        await bridgeManager.start();
      }
      
      return [];
    }
  }

  /**
   * Make a request to the bridge with retry logic
   * @param {string} url - The API URL
   * @param {Object} data - The request data
   * @returns {Promise<Object>} - Axios response
   * @private
   */
  async _makeRequestWithRetry(url, data) {
    try {
      return await axios.post(url, data, {
        timeout: 300000, // 5 minutes timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
        logger.warn(`Request failed, retrying in ${delay/1000} seconds (attempt ${this.retryCount}/${this.maxRetries})...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._makeRequestWithRetry(url, data);
      }
      
      // Reset retry counter before throwing
      this.retryCount = 0;
      throw error;
    }
  }

  /**
   * Process jobs from JobSpy to match our standard format
   * @param {Array} jobs - Raw jobs from JobSpy
   * @returns {Array} - Processed jobs
   */
  processJobs(jobs) {
    if (!Array.isArray(jobs)) {
      logger.error('Expected jobs array but received:', typeof jobs);
      return [];
    }
    
    return jobs.map(job => {
      try {
        return {
          title: job.title || '',
          company: job.company || 'Unknown Company',
          location: job.location?.city && job.location?.state 
            ? `${job.location.city}, ${job.location.state}` 
            : (job.location || 'Remote'),
          url: job.job_url || '',
          description: job.description || '',
          descriptionText: job.description || '',
          source: this.name,
          postedDate: job.date_posted ? new Date(job.date_posted) : new Date(),
          credibilityScore: this.credibilityScore,
          searchQuery: job.search_query || '',
          salary: this.formatSalary(job),
          isRemote: job.is_remote === true
        };
      } catch (error) {
        logger.error(`Error processing job: ${error.message}`);
        return null;
      }
    }).filter(job => job !== null);
  }

  /**
   * Format salary information from JobSpy
   * @param {Object} job - Job from JobSpy
   * @returns {string} - Formatted salary string
   */
  formatSalary(job) {
    try {
      if (!job.job_type || !job.job_type.interval || 
          (!job.job_type.min_amount && !job.job_type.max_amount)) {
        return '';
      }

      const { interval, min_amount, max_amount, currency = 'USD' } = job.job_type;
      
      if (min_amount && max_amount) {
        return `${currency} ${min_amount}-${max_amount} ${interval}`;
      } else if (min_amount) {
        return `${currency} ${min_amount}+ ${interval}`;
      } else if (max_amount) {
        return `${currency} ${max_amount} ${interval}`;
      }
      
      return '';
    } catch (error) {
      logger.error(`Error formatting salary: ${error.message}`);
      return '';
    }
  }
}

module.exports = BaseJobSpyScraper; 