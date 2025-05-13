const config = require('../../config/config');
const logger = require('./logger');

/**
 * Quality filter for job listings
 */
class QualityFilter {
  constructor() {
    this.config = config.qualityScoring;
    this.redFlags = this.config.redFlags || [];
    this.relevanceKeywords = this.config.relevanceKeywords || { high: [], medium: [] };
    this.threshold = this.config.threshold || 5;
  }

  /**
   * Filter jobs based on quality criteria
   * @param {Array} jobs - Job listings to filter
   * @returns {Array} - Filtered job listings
   */
  filterJobs(jobs) {
    if (!Array.isArray(jobs)) {
      logger.error('Expected jobs array but received:', typeof jobs);
      return [];
    }

    logger.info(`Filtering ${jobs.length} jobs using quality threshold ${this.threshold}`);
    
    const filteredJobs = jobs.filter(job => {
      // Calculate quality score
      const qualityScore = this.calculateQualityScore(job);
      
      // Add quality score to job
      job.qualityScore = qualityScore;
      
      // Keep jobs above threshold
      return qualityScore >= this.threshold;
    });
    
    logger.info(`Filtered out ${jobs.length - filteredJobs.length} jobs, keeping ${filteredJobs.length}`);
    return filteredJobs;
  }

  /**
   * Calculate quality score for a job
   * @param {Object} job - Job listing
   * @returns {number} - Quality score (0-10)
   */
  calculateQualityScore(job) {
    let score = job.credibilityScore || 5; // Start with source credibility
    
    // Check for red flags (-3 per flag found)
    const descriptionText = (job.descriptionText || job.description || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    
    for (const flag of this.redFlags) {
      if (descriptionText.includes(flag) || title.includes(flag)) {
        score -= 3;
      }
    }
    
    // Check for relevance keywords (+2 for high, +1 for medium)
    for (const keyword of this.relevanceKeywords.high) {
      if (descriptionText.includes(keyword) || title.includes(keyword)) {
        score += 2;
      }
    }
    
    for (const keyword of this.relevanceKeywords.medium) {
      if (descriptionText.includes(keyword) || title.includes(keyword)) {
        score += 1;
      }
    }
    
    // Check for remote (+1)
    if (job.isRemote === true || 
        title.includes('remote') || 
        descriptionText.includes('remote work') || 
        descriptionText.includes('work from home')) {
      score += 1;
    }
    
    // Cap score between 0-10
    return Math.max(0, Math.min(10, score));
  }
}

// Export singleton instance
const qualityFilter = new QualityFilter();
module.exports = qualityFilter; 