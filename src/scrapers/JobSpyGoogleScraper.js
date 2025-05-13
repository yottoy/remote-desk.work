const BaseJobSpyScraper = require('./BaseJobSpyScraper');
const logger = require('../utils/logger');
const qualityFilter = require('../utils/qualityFilter');

/**
 * Google Jobs scraper using JobSpy Python bridge
 */
class JobSpyGoogleScraper extends BaseJobSpyScraper {
  constructor() {
    super('JobSpyGoogle', 'google', 'jobspy_google');
    
    // Google-specific configurations
    this.siteSpecificConfig = {
      description_format: this.jobspyConfig.descriptionFormat || 'markdown'
    };
    
    // Default to medium-high credibility score for Google
    this.credibilityScore = this.jobspyConfig.credibilityScore || 8;
  }
  
  /**
   * Customize the scrape method for Google as it uses a different approach
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

      // For Google, we need to use google_search_term instead of search_term
      const requestData = {
        site_names: [this.siteName],
        google_search_term: this.queries.join(' OR '),
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

      logger.info(`Sending request to JobSpy bridge for ${this.siteName} with search terms`);
      
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
      return [];
    }
  }
}

module.exports = JobSpyGoogleScraper; 