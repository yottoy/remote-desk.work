const BaseJobSpyScraper = require('./BaseJobSpyScraper');

/**
 * LinkedIn scraper using JobSpy Python bridge
 */
class JobSpyLinkedInScraper extends BaseJobSpyScraper {
  constructor() {
    super('JobSpyLinkedIn', 'linkedin', 'jobspy_linkedin');
    
    // LinkedIn-specific configurations
    this.siteSpecificConfig = {
      linkedin_fetch_description: this.jobspyConfig.fetchDescription || true,
      description_format: this.jobspyConfig.descriptionFormat || 'markdown'
    };
    
    // Default to slightly higher credibility score for LinkedIn
    this.credibilityScore = this.jobspyConfig.credibilityScore || 9;
  }
}

module.exports = JobSpyLinkedInScraper; 