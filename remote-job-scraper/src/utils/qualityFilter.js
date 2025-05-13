const config = require('../../config/config');
const logger = require('./logger');

/**
 * Quality Filter Utility
 * Implements sophisticated filtering and scoring of job listings
 */
class QualityFilter {
  constructor() {
    // Load configuration
    this.qualityConfig = config.qualityScoring || {};
    
    // Define keyword sets
    this.primaryKeywords = [
      'data entry', 'data input', 'administrative assistant', 'admin assistant',
      'virtual assistant', 'customer service representative', 'customer service rep',
      'data processing', 'data analyst', 'data specialist', 'admin support',
      'executive assistant', 'office assistant', 'remote assistant'
    ];
    
    this.secondaryKeywords = [
      'remote', 'work from home', 'wfh', 'excel', 'spreadsheet', 'typing',
      'data management', 'microsoft office', 'word', 'powerpoint', 'outlook',
      'google workspace', 'data organization', 'clerical', 'administrative',
      'communication', 'organization', 'detail-oriented', 'customer support',
      'data processing', 'scheduling', 'email', 'phone', 'virtual', 'documentation'
    ];
    
    this.exclusionKeywords = [
      'mlm', 'pyramid', 'upfront fee', 'cryptocurrency mining', 'get rich quick',
      'multi level marketing', 'investment required', 'pay to start', 'pay to work',
      'pay for training', 'pay for equipment', 'business opportunity', 'quick cash',
      'immediate profits', 'unlimited earning', 'unlimited income', 'be your own boss',
      'passive income', 'easy money', 'work from anywhere', '1000/day', '$1000 per day',
      'earn while you sleep', 'cash app', 'bitcoin', 'forex', 'day trading', 'cbd',
      'marijuana', 'network marketing', 'direct selling', 'direct sales', 'commission only'
    ];
    
    // Set score thresholds
    this.qualityThreshold = this.qualityConfig.threshold || 5;
    this.featuredThreshold = this.qualityConfig.featuredThreshold || 8;
    
    // Set score weights
    this.weights = this.qualityConfig.weights || {
      relevance: 0.5,
      quality: 0.3,
      credibility: 0.15,
      recency: 0.05
    };
    
    // Initialize rejection stats
    this.rejectionStats = {
      total: 0,
      byReason: {
        exclusionKeywords: 0,
        tooOld: 0,
        lowQualityScore: 0,
        insufficientDescription: 0,
        missingPrimaryKeywords: 0
      }
    };
  }
  
  /**
   * Filter and score a collection of jobs
   * @param {Array} jobs - Array of job objects to filter
   * @returns {Array} - Filtered and scored jobs
   */
  filterJobs(jobs) {
    logger.info(`Filtering ${jobs.length} jobs for quality`);
    
    const filteredJobs = [];
    
    for (const job of jobs) {
      try {
        // Skip jobs with no description
        if (!job.description && !job.descriptionText) {
          this.rejectionStats.byReason.insufficientDescription++;
          this.rejectionStats.total++;
          logger.debug(`Rejected job '${job.title}' due to missing description`);
          continue;
        }
        
        // Normalize description text
        const descriptionText = (job.descriptionText || job.description || '').toLowerCase();
        const title = (job.title || '').toLowerCase();
        
        // Check for exclusion keywords (immediate rejection)
        if (this.containsExclusionKeywords(title, descriptionText)) {
          this.rejectionStats.byReason.exclusionKeywords++;
          this.rejectionStats.total++;
          logger.debug(`Rejected job '${job.title}' due to exclusion keywords`);
          continue;
        }
        
        // Check for minimum description length
        const minLength = job.source && job.source.toLowerCase().includes('rss') ? 30 : 100;
        if (descriptionText.length < minLength) {
          this.rejectionStats.byReason.insufficientDescription++;
          this.rejectionStats.total++;
          logger.debug(`Rejected job '${job.title}' due to insufficient description length (${descriptionText.length} < ${minLength})`);
          continue;
        }
        
        // Verify primary keywords
        if (!this.containsPrimaryKeywords(title, descriptionText, job)) {
          this.rejectionStats.byReason.missingPrimaryKeywords++;
          this.rejectionStats.total++;
          logger.debug(`Rejected job '${job.title}' due to missing primary keywords`);
          continue;
        }
        
        // Check job age
        const postedDate = job.postedDate ? new Date(job.postedDate) : new Date();
        const ageDays = this.getJobAgeDays(postedDate);
        
        if (ageDays > 30) {
          this.rejectionStats.byReason.tooOld++;
          this.rejectionStats.total++;
          logger.debug(`Rejected job '${job.title}' due to age (${ageDays} days old)`);
          continue;
        }
        
        // Calculate quality scores
        const relevanceScore = this.calculateRelevanceScore(title, descriptionText);
        const qualityScore = this.calculateQualityScore(job, descriptionText);
        const credibilityScore = this.calculateCredibilityScore(job);
        const recencyScore = this.calculateRecencyScore(ageDays);
        
        // Calculate weighted total score
        const totalScore = (
          (relevanceScore * this.weights.relevance) +
          (qualityScore * this.weights.quality) +
          (credibilityScore * this.weights.credibility) +
          (recencyScore * this.weights.recency)
        );
        
        // Round to 2 decimal places
        const roundedScore = Math.round(totalScore * 100) / 100;
        
        // Only accept jobs meeting the minimum quality threshold
        if (roundedScore < this.qualityThreshold) {
          this.rejectionStats.byReason.lowQualityScore++;
          this.rejectionStats.total++;
          logger.debug(`Rejected job '${job.title}' due to low quality score (${roundedScore})`);
          continue;
        }
        
        // Add quality metrics to job
        const enhancedJob = {
          ...job,
          qualityMetrics: {
            relevanceScore,
            qualityScore,
            credibilityScore,
            recencyScore,
            totalScore: roundedScore,
            ageDays,
            isFeatured: roundedScore >= this.featuredThreshold
          }
        };
        
        // Add to filtered jobs
        filteredJobs.push(enhancedJob);
        
      } catch (error) {
        logger.error(`Error filtering job '${job.title}': ${error.message}`);
      }
    }
    
    // Log rejection stats
    logger.info(`Rejected ${this.rejectionStats.total} jobs in total`);
    logger.debug(`Rejection reasons: ${JSON.stringify(this.rejectionStats.byReason)}`);
    
    // Sort by quality score (highest first)
    filteredJobs.sort((a, b) => b.qualityMetrics.totalScore - a.qualityMetrics.totalScore);
    
    return filteredJobs;
  }
  
  /**
   * Check if text contains any exclusion keywords
   * @param {string} title - Job title
   * @param {string} description - Job description
   * @returns {boolean} - True if exclusion keywords found
   */
  containsExclusionKeywords(title, description) {
    const combinedText = `${title} ${description}`.toLowerCase();
    
    for (const keyword of this.exclusionKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(combinedText)) {
        logger.debug(`Exclusion keyword found: "${keyword}"`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if text contains at least one primary keyword
   * @param {string} title - Job title
   * @param {string} description - Job description
   * @returns {boolean} - True if primary keywords found
   */
  containsPrimaryKeywords(title, description) {
    const combinedText = `${title} ${description}`.toLowerCase();
    
    // Check if job already has identified primary keywords
    if (title.toLowerCase().includes('data entry') || 
        title.toLowerCase().includes('administrative') || 
        title.toLowerCase().includes('assistant') ||
        title.toLowerCase().includes('customer service')) {
      return true;
    }
    
    // Check if source is RSS feed (be more lenient)
    if (combinedText.includes('rss') || combinedText.includes('feed')) {
      return true;
    }
    
    // If job has explicitly identified primaryKeywords property
    if (arguments[2] && arguments[2].primaryKeywords && arguments[2].primaryKeywords.length > 0) {
      return true;
    }
    
    for (const keyword of this.primaryKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(combinedText)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Calculate relevance score based on keyword matches
   * @param {string} title - Job title
   * @param {string} description - Job description
   * @returns {number} - Relevance score (0-10)
   */
  calculateRelevanceScore(title, description) {
    let score = 0;
    const combinedText = `${title} ${description}`.toLowerCase();
    
    // Check primary keywords (higher weight)
    let primaryCount = 0;
    for (const keyword of this.primaryKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(combinedText)) {
        primaryCount++;
        // Give extra points for keywords in the title
        if (regex.test(title)) {
          score += 2;
        }
      }
    }
    
    // Score based on primary keyword count (max 5 points)
    score += Math.min(primaryCount, 5);
    
    // Check secondary keywords
    let secondaryCount = 0;
    for (const keyword of this.secondaryKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(combinedText)) {
        secondaryCount++;
        // Give extra points for keywords in the title
        if (regex.test(title)) {
          score += 0.5;
        }
      }
    }
    
    // Score based on secondary keyword count (max 3 points)
    score += Math.min(secondaryCount * 0.3, 3);
    
    // Cap score at 10
    return Math.min(score, 10);
  }
  
  /**
   * Calculate quality score based on job details
   * @param {Object} job - Job object
   * @param {string} description - Job description
   * @returns {number} - Quality score (0-10)
   */
  calculateQualityScore(job, description) {
    let score = 5; // Start with a baseline score
    
    // Check description length (longer descriptions tend to be better quality)
    const wordCount = description.split(/\s+/).length;
    if (wordCount > 500) score += 1.5;
    else if (wordCount > 300) score += 1;
    else if (wordCount > 200) score += 0.5;
    else if (wordCount < 150) score -= 1;
    
    // Check for clear responsibilities (bulleted lists, sections)
    if (description.includes('responsibilities:') || 
        description.includes('duties:') ||
        description.includes('what you\'ll do') ||
        description.includes('what you will do') ||
        description.includes('requirements:') ||
        (description.match(/•|\*|\-\s+/g) || []).length >= 3) {
      score += 1;
    }
    
    // Check for salary information
    if (job.salary || 
        description.toLowerCase().includes('salary') || 
        description.toLowerCase().includes('compensation') ||
        description.toLowerCase().includes('per hour') ||
        description.toLowerCase().includes('per month') ||
        description.toLowerCase().includes('per year') ||
        /\$\d+\s*(\/|\s*per\s*)(hr|hour|wk|week|mo|month|yr|year|annum)/.test(description)) {
      score += 1;
    }
    
    // Check for professional language
    const typosAndErrors = (description.match(/!{2,}|\?{2,}|[A-Z]{5,}|typo/g) || []).length;
    if (typosAndErrors > 5) score -= 1.5;
    else if (typosAndErrors > 2) score -= 0.5;
    
    // Check for complete company information
    if (job.company && job.company.length > 0) {
      score += 0.5;
      // Additional points if company name isn't generic
      if (!/(client|company|employer|business)/i.test(job.company)) {
        score += 0.5;
      }
    } else {
      score -= 1;
    }
    
    // Check for detailed location information
    if (job.location && job.location.length > 0 && job.location.toLowerCase() !== 'remote') {
      score += 0.5;
    }
    
    // Cap score between 0 and 10
    return Math.max(0, Math.min(score, 10));
  }
  
  /**
   * Calculate credibility score based on source and company
   * @param {Object} job - Job object
   * @returns {number} - Credibility score (0-10)
   */
  calculateCredibilityScore(job) {
    // Use the source's credibility score if available
    if (job.credibilityScore) {
      return job.credibilityScore;
    }
    
    // Otherwise calculate based on source
    const source = job.source ? job.source.toLowerCase() : '';
    
    // Default credibility scores by source
    const sourceScores = {
      'weworkremotely': 9,
      'remote.co': 8,
      'remoteco': 8,
      'upwork': 7,
      'careerjet': 6,
      'indeed': 7,
      'linkedin': 8,
      'glassdoor': 7,
      'ziprecruiter': 6,
      'simplyhired': 5
    };
    
    // Check if we have a predefined score for this source
    if (sourceScores[source]) {
      return sourceScores[source];
    }
    
    // Check if this is a company site
    if (source.startsWith('company-')) {
      return 8;
    }
    
    // Default score for unknown sources
    return 5;
  }
  
  /**
   * Calculate recency score based on job age
   * @param {number} ageDays - Job age in days
   * @returns {number} - Recency score (0-10)
   */
  calculateRecencyScore(ageDays) {
    // Score based on age
    if (ageDays < 1) return 10;       // Less than 24 hours
    if (ageDays < 3) return 9;        // 1-2 days
    if (ageDays < 7) return 8;        // 3-6 days
    if (ageDays < 14) return 7;       // 7-13 days
    if (ageDays < 21) return 6;       // 14-20 days
    if (ageDays < 30) return 5;       // 21-29 days
    return 0;                         // 30+ days (should be filtered out)
  }
  
  /**
   * Calculate job age in days
   * @param {Date} postedDate - Job posted date
   * @returns {number} - Age in days
   */
  getJobAgeDays(postedDate) {
    const now = new Date();
    const diffTime = Math.abs(now - postedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  
  /**
   * Get rejection statistics
   * @returns {Object} - Rejection statistics
   */
  getRejectionStats() {
    return this.rejectionStats;
  }
  
  /**
   * Reset rejection statistics
   */
  resetRejectionStats() {
    this.rejectionStats = {
      total: 0,
      byReason: {
        exclusionKeywords: 0,
        tooOld: 0,
        lowQualityScore: 0,
        insufficientDescription: 0,
        missingPrimaryKeywords: 0
      }
    };
  }
}

module.exports = new QualityFilter(); 