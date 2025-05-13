const BaseJobSpyScraper = require('./BaseJobSpyScraper');

/**
 * Bayt scraper using JobSpy Python bridge
 */
class JobSpyBaytScraper extends BaseJobSpyScraper {
  constructor() {
    super('JobSpyBayt', 'bayt', 'jobspy_bayt');
    
    // Bayt-specific configurations
    this.siteSpecificConfig = {
      description_format: this.jobspyConfig.descriptionFormat || 'markdown'
    };
    
    // Default to medium credibility score for Bayt (Middle East job site)
    this.credibilityScore = this.jobspyConfig.credibilityScore || 7;
  }
}

module.exports = JobSpyBaytScraper; 