const config = require('../../config/config');
const logger = require('./logger');

/**
 * Calculate relevance score based on keyword matching in title and description
 * @param {Object} job - Job data object
 * @returns {number} - Score from 0-10
 */
function calculateRelevanceScore(job) {
  const { title, descriptionText } = job;
  const combinedText = `${title.toLowerCase()} ${descriptionText.toLowerCase()}`;
  
  // Count high relevance keywords
  const highKeywords = config.qualityScoring.relevanceKeywords.high;
  const highMatches = highKeywords.filter(keyword => 
    combinedText.includes(keyword.toLowerCase())
  ).length;
  
  // Count medium relevance keywords
  const mediumKeywords = config.qualityScoring.relevanceKeywords.medium;
  const mediumMatches = mediumKeywords.filter(keyword => 
    combinedText.includes(keyword.toLowerCase())
  ).length;
  
  // Calculate weighted score
  const highWeight = 1.0;
  const mediumWeight = 0.5;
  
  const maxPossibleHighScore = highKeywords.length * highWeight;
  const maxPossibleMediumScore = mediumKeywords.length * mediumWeight;
  const maxPossibleScore = Math.min(10, maxPossibleHighScore + maxPossibleMediumScore);
  
  const rawScore = (highMatches * highWeight) + (mediumMatches * mediumWeight);
  
  // Normalize to 0-10 scale
  const normalizedScore = (rawScore / maxPossibleScore) * 10;
  
  return Math.min(10, Math.max(0, normalizedScore));
}

/**
 * Calculate quality indicator score based on job listing quality
 * @param {Object} job - Job data object
 * @returns {number} - Score from 0-10
 */
function calculateQualityIndicatorScore(job) {
  const { title, description, descriptionText, company, salary } = job;
  let score = 5; // Start with neutral score
  
  // Check for quality indicators
  
  // Length of description (longer descriptions are usually more informative)
  if (descriptionText.length > 2000) score += 1;
  if (descriptionText.length > 4000) score += 1;
  if (descriptionText.length < 500) score -= 2;
  
  // Company name presence
  if (!company || company.trim() === '') score -= 1;
  
  // Title quality
  if (title.toUpperCase() === title) score -= 1; // ALL CAPS titles
  if (title.length < 5) score -= 1; // Very short titles
  if (title.length > 100) score -= 1; // Excessively long titles
  
  // Salary information
  if (salary && salary.trim() !== '') score += 1;
  
  // Check for red flags in description
  const redFlags = config.qualityScoring.redFlags;
  const redFlagMatches = redFlags.filter(flag => 
    descriptionText.toLowerCase().includes(flag.toLowerCase())
  ).length;
  
  // Reduce score for each red flag found
  score -= redFlagMatches * 2;
  
  // Normalize to 0-10 scale
  return Math.min(10, Math.max(0, score));
}

/**
 * Calculate credibility score based on source
 * @param {Object} job - Job data object
 * @returns {number} - Score from 0-10
 */
function calculateCredibilityScore(job) {
  const { source } = job;
  
  // Get credibility score from config
  if (source && config.sources[source]) {
    return config.sources[source].credibilityScore;
  }
  
  // Default credibility score if source is unknown
  return 5;
}

/**
 * Calculate recency score based on posting date
 * @param {Object} job - Job data object
 * @returns {number} - Score from 0-10
 */
function calculateRecencyScore(job) {
  const { postedDate } = job;
  
  // If no posted date, give neutral score
  if (!postedDate) return 5;
  
  const now = new Date();
  const postDate = new Date(postedDate);
  const daysDifference = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));
  
  // Score from 0-10 based on days since posting
  let score;
  if (daysDifference <= 1) {
    score = 10; // Posted today or yesterday
  } else if (daysDifference <= 3) {
    score = 9; // 2-3 days ago
  } else if (daysDifference <= 7) {
    score = 8; // Within the last week
  } else if (daysDifference <= 14) {
    score = 7; // Within 2 weeks
  } else if (daysDifference <= 21) {
    score = 5; // Within 3 weeks
  } else if (daysDifference <= 30) {
    score = 3; // Within a month
  } else {
    score = 1; // Older than a month
  }
  
  return score;
}

/**
 * Calculate overall quality score
 * @param {Object} job - Job data object with component scores
 * @returns {number} - Overall quality score from 0-10
 */
function calculateOverallScore(job) {
  const { 
    relevanceScore = 0, 
    qualityIndicatorScore = 0, 
    credibilityScore = 0, 
    recencyScore = 0 
  } = job;
  
  // Get weights from config
  const { weights } = config.qualityScoring;
  
  // Calculate weighted score
  const weightedScore = 
    (relevanceScore * weights.relevance) +
    (qualityIndicatorScore * weights.quality) +
    (credibilityScore * weights.credibility) +
    (recencyScore * weights.recency);
  
  // Round to 1 decimal place
  return Math.round(weightedScore * 10) / 10;
}

/**
 * Check for explicit red flags that would disqualify a job
 * @param {Object} job - Job data object
 * @returns {boolean} - True if job has red flags
 */
function hasRedFlags(job) {
  const { descriptionText } = job;
  const lowercaseDesc = descriptionText.toLowerCase();
  
  // Check each red flag
  const { redFlags } = config.qualityScoring;
  for (const flag of redFlags) {
    if (lowercaseDesc.includes(flag.toLowerCase())) {
      logger.debug(`Red flag found in job: ${flag}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Evaluate job quality and determine if it should be kept
 * @param {Object} job - Job data object
 * @returns {Object} - Job with calculated scores and quality determination
 */
function evaluateJobQuality(job) {
  // Make sure we have text content for the description
  if (job.description && !job.descriptionText) {
    job.descriptionText = removeHtmlTags(job.description);
  }
  
  // Calculate component scores
  job.relevanceScore = calculateRelevanceScore(job);
  job.qualityIndicatorScore = calculateQualityIndicatorScore(job);
  job.credibilityScore = calculateCredibilityScore(job);
  job.recencyScore = calculateRecencyScore(job);
  
  // Calculate overall score
  job.qualityScore = calculateOverallScore(job);
  
  // Determine if job meets quality threshold
  const { threshold, featuredThreshold } = config.qualityScoring;
  job.meetsQualityThreshold = job.qualityScore >= threshold && !hasRedFlags(job);
  job.featured = job.qualityScore >= featuredThreshold;
  
  logger.debug(`Job quality evaluation: "${job.title}" - Score: ${job.qualityScore}, Featured: ${job.featured}, Meets threshold: ${job.meetsQualityThreshold}`);
  
  return job;
}

/**
 * Filter a list of jobs based on quality
 * @param {Array} jobs - Array of job objects
 * @returns {Array} - Filtered array of jobs that meet quality threshold
 */
function filterJobs(jobs) {
  logger.info(`Filtering ${jobs.length} jobs for quality`);
  
  // Evaluate and filter jobs
  const evaluatedJobs = jobs.map(evaluateJobQuality);
  const filteredJobs = evaluatedJobs.filter(job => job.meetsQualityThreshold);
  
  logger.info(`Filtered jobs: ${filteredJobs.length} met quality criteria out of ${jobs.length}`);
  
  return filteredJobs;
}

/**
 * Helper function to remove HTML tags from text
 * @param {string} html - HTML content
 * @returns {string} - Plain text without HTML tags
 */
function removeHtmlTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = {
  evaluateJobQuality,
  filterJobs,
  calculateRelevanceScore,
  calculateQualityIndicatorScore,
  calculateCredibilityScore,
  calculateRecencyScore,
  calculateOverallScore,
  hasRedFlags
}; 