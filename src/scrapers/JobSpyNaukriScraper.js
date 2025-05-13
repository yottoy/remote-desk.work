const BaseJobSpyScraper = require('./BaseJobSpyScraper');

/**
 * Naukri scraper using JobSpy Python bridge
 */
class JobSpyNaukriScraper extends BaseJobSpyScraper {
  constructor() {
    super('JobSpyNaukri', 'naukri', 'jobspy_naukri');
    
    // Naukri-specific configurations
    this.siteSpecificConfig = {
      description_format: this.jobspyConfig.descriptionFormat || 'markdown'
    };
    
    // Default to medium credibility score for Naukri (Indian job site)
    this.credibilityScore = this.jobspyConfig.credibilityScore || 7;
  }
}

module.exports = JobSpyNaukriScraper; 