const BaseJobSpyScraper = require('./BaseJobSpyScraper');

/**
 * Glassdoor scraper using JobSpy Python bridge
 */
class JobSpyGlassdoorScraper extends BaseJobSpyScraper {
  constructor() {
    super('JobSpyGlassdoor', 'glassdoor', 'jobspy_glassdoor');
    
    // Glassdoor-specific configurations
    this.siteSpecificConfig = {
      description_format: this.jobspyConfig.descriptionFormat || 'markdown'
    };
    
    // Default to medium-high credibility score for Glassdoor
    this.credibilityScore = this.jobspyConfig.credibilityScore || 8;
  }
}

module.exports = JobSpyGlassdoorScraper; 