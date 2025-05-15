/**
 * JobFilter - Utility for filtering jobs based on keywords and rules
 * Used to ensure we only capture genuine admin/data entry remote jobs
 */

const fs = require('fs');
const path = require('path');

class JobFilter {
  constructor(options = {}) {
    this.options = {
      keywordsFile: options.keywordsFile || path.join(process.cwd(), 'admin-data-entry-keywords.json'),
      strictMode: options.strictMode !== undefined ? options.strictMode : true,
      minDescriptionWords: options.minDescriptionWords || 50,
      logger: options.logger || console
    };
    
    this.keywords = null;
    this.stats = {
      processed: 0,
      accepted: 0,
      rejected: 0,
      rejectionReasons: {}
    };
    
    this.loadKeywords();
  }
  
  /**
   * Load keywords from the configuration file
   */
  loadKeywords() {
    try {
      if (!fs.existsSync(this.options.keywordsFile)) {
        this.options.logger.warn(`Keywords file not found: ${this.options.keywordsFile}`);
        // Initialize with minimal defaults
        this.keywords = {
          job_types: ['data entry', 'administrative assistant', 'virtual assistant'],
          keywords: ['remote', 'work from home'],
          exclude_keywords: ['senior', 'manager', 'director'],
          required_keywords: ['data entry', 'administrative', 'assistant'],
          description_required_terms: ['remote', 'work from home', 'virtual']
        };
        return;
      }
      
      const content = fs.readFileSync(this.options.keywordsFile, 'utf8');
      this.keywords = JSON.parse(content);
      this.options.logger.info(`Loaded keywords configuration with ${this.keywords.job_types.length} job types and ${this.keywords.keywords.length} keywords`);
    } catch (error) {
      this.options.logger.error(`Error loading keywords: ${error.message}`);
      // Initialize with defaults on error
      this.keywords = {
        job_types: ['data entry', 'administrative assistant', 'virtual assistant'],
        keywords: ['remote', 'work from home'],
        exclude_keywords: ['senior', 'manager', 'director'],
        required_keywords: ['data entry', 'administrative', 'assistant'],
        description_required_terms: ['remote', 'work from home', 'virtual']
      };
    }
  }
  
  /**
   * Filter a single job based on loaded keywords
   * @param {Object} job - The job object to filter
   * @returns {boolean} - Whether the job passes the filter
   */
  isRelevantJob(job) {
    if (!job || !this.keywords) {
      return false;
    }
    
    this.stats.processed++;
    
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const combinedText = `${title} ${description}`;
    
    // Track reasons for filtering
    let includeReason = null;
    let excludeReason = null;
    
    // Check for excluding job titles (senior positions, etc.)
    for (const exclude of this.keywords.exclude_keywords || []) {
      if (title.includes(exclude.toLowerCase())) {
        excludeReason = `Title contains excluded term: ${exclude}`;
        this._trackRejection(excludeReason);
        return this._finalizeJobFiltering(job, false, null, excludeReason);
      }
    }
    
    // Check if description is too short
    if (description) {
      const wordCount = description.split(/\s+/).length;
      if (wordCount < this.options.minDescriptionWords) {
        excludeReason = `Description too short (${wordCount} words)`;
        this._trackRejection(excludeReason);
        return this._finalizeJobFiltering(job, false, null, excludeReason);
      }
    }
    
    // Check for at least one required keyword
    let hasRequiredKeyword = false;
    for (const required of this.keywords.required_keywords || []) {
      if (combinedText.includes(required.toLowerCase())) {
        hasRequiredKeyword = true;
        includeReason = `Contains required keyword: ${required}`;
        break;
      }
    }
    
    // Require at least one keyword match
    if (!hasRequiredKeyword) {
      excludeReason = 'Missing required keywords';
      this._trackRejection(excludeReason);
      return this._finalizeJobFiltering(job, false, null, excludeReason);
    }
    
    // Check for job type in title for higher relevance
    let matchesJobType = false;
    for (const jobType of this.keywords.job_types || []) {
      if (title.includes(jobType.toLowerCase())) {
        matchesJobType = true;
        includeReason = `Title matches job type: ${jobType}`;
        break;
      }
    }
    
    // Check for remote keywords if we're being strict
    if (this.options.strictMode) {
      let hasRemoteKeyword = false;
      for (const remote of this.keywords.description_required_terms || []) {
        if (combinedText.includes(remote.toLowerCase())) {
          hasRemoteKeyword = true;
          break;
        }
      }
      
      // If strict and no remote keywords, only keep if title explicitly matches job type
      if (!hasRemoteKeyword && !matchesJobType) {
        excludeReason = 'Missing remote keywords';
        this._trackRejection(excludeReason);
        return this._finalizeJobFiltering(job, false, null, excludeReason);
      }
    }
    
    // If we got this far, the job passes our filters
    this.stats.accepted++;
    
    // Return the final result
    return this._finalizeJobFiltering(job, true, includeReason, null);
  }
  
  /**
   * Filter an array of jobs based on loaded keywords
   * @param {Array} jobs - The array of job objects to filter
   * @returns {Array} - The filtered array of jobs
   */
  filterJobs(jobs) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return [];
    }
    
    const filteredJobs = jobs.filter(job => this.isRelevantJob(job));
    
    this.options.logger.info(`Filtered ${jobs.length} jobs to ${filteredJobs.length} relevant jobs (${Math.round(filteredJobs.length/jobs.length*100)}% pass rate)`);
    
    return filteredJobs;
  }
  
  /**
   * Get statistics about the filtering process
   * @returns {Object} - Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      passRate: this.stats.processed > 0 ? (this.stats.accepted / this.stats.processed) : 0
    };
  }
  
  /**
   * Track rejection reason for statistics
   * @private
   */
  _trackRejection(reason) {
    this.stats.rejected++;
    if (reason) {
      this.stats.rejectionReasons[reason] = (this.stats.rejectionReasons[reason] || 0) + 1;
    }
  }
  
  /**
   * Finalize job filtering by adding metadata
   * @private
   */
  _finalizeJobFiltering(job, isAccepted, includeReason, excludeReason) {
    // Add metadata to the job for tracking
    if (job) {
      if (isAccepted) {
        job.include_reason = includeReason;
        job.is_validated = true;
      } else {
        job.exclude_reason = excludeReason;
        job.is_validated = false;
      }
    }
    
    return isAccepted;
  }
  
  /**
   * Calculate relevance score for a job
   * @param {Object} job - The job to score
   * @returns {number} - Relevance score from 0-10
   */
  calculateRelevanceScore(job) {
    if (!job || !this.keywords) {
      return 0;
    }
    
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const combinedText = `${title} ${description}`;
    
    let score = 0;
    
    // Keyword matches in title are most important (0-5 points)
    let titleMatches = 0;
    for (const jobType of this.keywords.job_types || []) {
      if (title.includes(jobType.toLowerCase())) {
        titleMatches++;
      }
    }
    score += Math.min(titleMatches * 2, 5); // Up to 5 points for title matches
    
    // Required keyword matches (0-3 points)
    let requiredMatches = 0;
    for (const required of this.keywords.required_keywords || []) {
      if (combinedText.includes(required.toLowerCase())) {
        requiredMatches++;
      }
    }
    score += Math.min(requiredMatches, 3); // Up to 3 points for required keyword matches
    
    // Remote keyword matches (0-2 points)
    let remoteMatches = 0;
    for (const remote of this.keywords.description_required_terms || []) {
      if (combinedText.includes(remote.toLowerCase())) {
        remoteMatches++;
      }
    }
    score += Math.min(remoteMatches, 2); // Up to 2 points for remote keyword matches
    
    return score;
  }
}

module.exports = JobFilter; 