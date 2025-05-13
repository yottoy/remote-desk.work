const BaseJobSpyScraper = require('./BaseJobSpyScraper');

/**
 * Indeed scraper using JobSpy Python bridge
 */
class JobSpyIndeedScraper extends BaseJobSpyScraper {
  constructor() {
    super('JobSpyIndeed', 'indeed', 'jobspy_indeed');

    // Any Indeed-specific config can go here
    this.siteSpecificConfig = {};
  }
}

module.exports = JobSpyIndeedScraper; 