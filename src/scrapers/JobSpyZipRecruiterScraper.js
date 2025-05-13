const BaseJobSpyScraper = require('./BaseJobSpyScraper');

/**
 * ZipRecruiter scraper using JobSpy Python bridge
 */
class JobSpyZipRecruiterScraper extends BaseJobSpyScraper {
  constructor() {
    super('JobSpyZipRecruiter', 'zip_recruiter', 'jobspy_ziprecruiter');
    
    // ZipRecruiter-specific configurations
    this.siteSpecificConfig = {
      description_format: this.jobspyConfig.descriptionFormat || 'markdown'
    };
    
    // Default to medium credibility score for ZipRecruiter
    this.credibilityScore = this.jobspyConfig.credibilityScore || 7;
  }
}

module.exports = JobSpyZipRecruiterScraper; 