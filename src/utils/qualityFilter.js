const config = require('../../config/config');
const logger = require('./logger');

/**
 * Quality filter for job listings
 */
class QualityFilter {
  constructor() {
    this.config = config.qualityScoring;
    this.redFlags = this.config.redFlags || [];
    this.titleBlocklist = this.config.titleBlocklist || [];
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
      // Hard title blocklist check — reject irrelevant job types outright
      if (this.isTitleBlocked(job)) {
        logger.debug(`Rejected (title blocklist): "${job.title}"`);
        return false;
      }

      // Try to extract salary from description if the scraper didn't capture it
      if (!job.salary) {
        const extracted = this.extractSalaryFromText(job.descriptionText || job.description);
        if (extracted) {
          job.salary = extracted;
          logger.debug(`Extracted salary "${extracted}" from description for: "${job.title}"`);
        }
      }

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
   * Check if a job title matches the hard blocklist.
   * Any match is an immediate rejection — we don't want software engineers,
   * product managers, data scientists, etc. on this site.
   * @param {Object} job - Job listing
   * @returns {boolean} - True if the title should be blocked
   */
  isTitleBlocked(job) {
    if (!job.title) return false;
    const title = job.title.toLowerCase();
    return this.titleBlocklist.some(term => title.includes(term.toLowerCase()));
  }

  /**
   * Attempts to extract a salary string from job description text.
   * Tries patterns from most specific (ranges) to least specific (single values).
   * The extracted string is formatted so parseSalary() in schemaGenerator can parse it.
   *
   * Handles common formats found in job postings:
   *   "$15 - $25 per hour", "$15-$25/hr", "$15 to $25 an hour"
   *   "$40,000 - $55,000 per year", "$40k - $55k"
   *   "$20/hr", "$45,000 annually"
   *
   * @param {string} text - Description text to search
   * @returns {string|null} - Extracted salary string or null
   */
  extractSalaryFromText(text) {
    if (!text || text.length < 10) return null;

    // Normalize whitespace and common unicode dashes to ASCII
    const str = text
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/[–—]/g, '-');

    // Patterns are tried in order — more specific first
    const patterns = [
      // ── HOURLY RANGES ──────────────────────────────────────────────────
      // "$15 - $25 per hour", "$15-$25/hr", "$15 to $25 an hour"
      {
        re: /\$\s*([\d,]+(?:\.\d{1,2})?)\s*(?:to|-)\s*\$?\s*([\d,]+(?:\.\d{1,2})?)\s*(?:per\s+hour|per\s+hr|\/\s*(?:hour|hr)|an?\s+hour)/i,
        format: (m) => `$${m[1].replace(/,/g, '')}-$${m[2].replace(/,/g, '')}/hr`,
      },
      // "15 - 25 per hour" (no $ sign)
      {
        re: /\b([\d]+(?:\.\d{1,2})?)\s*(?:to|-)\s*([\d]+(?:\.\d{1,2})?)\s*(?:per\s+hour|per\s+hr|\/\s*(?:hour|hr)|an?\s+hour)/i,
        format: (m) => `$${m[1]}-$${m[2]}/hr`,
      },

      // ── ANNUAL RANGES ───────────────────────────────────────────────────
      // "$40,000 - $55,000 per year", "$40,000 to $55,000 annually"
      {
        re: /\$\s*([\d]{2,3},[\d]{3})\s*(?:to|-)\s*\$?\s*([\d]{2,3},[\d]{3})\s*(?:per\s+year|per\s+annum|\/\s*year|annually|a\s+year)?/i,
        format: (m) => `$${m[1].replace(/,/g, '')}-$${m[2].replace(/,/g, '')}/year`,
      },
      // "$40k - $55k" or "40k-55k"
      {
        re: /\$?\s*([\d]+)\s*k\s*(?:to|-)\s*\$?\s*([\d]+)\s*k/i,
        format: (m) => `$${m[1]}k-$${m[2]}k`,
      },

      // ── SINGLE HOURLY ───────────────────────────────────────────────────
      // "$20/hr", "$20 per hour", "$20 an hour"
      {
        re: /\$\s*([\d]+(?:\.\d{1,2})?)\s*(?:per\s+hour|per\s+hr|\/\s*(?:hour|hr)|an?\s+hour)/i,
        format: (m) => `$${m[1]}/hr`,
      },

      // ── SINGLE ANNUAL ───────────────────────────────────────────────────
      // "$45,000 per year", "$50,000 annually", "$45k/year"
      {
        re: /\$\s*([\d]{2,3},[\d]{3})\s*(?:per\s+year|per\s+annum|\/\s*year|annually|a\s+year)/i,
        format: (m) => `$${m[1].replace(/,/g, '')}/year`,
      },
      {
        re: /\$\s*([\d]+)\s*k\s*(?:per\s+year|per\s+annum|\/\s*year|annually|a\s+year)?(?:\s|$)/i,
        format: (m) => `$${m[1]}k/year`,
      },
    ];

    for (const { re, format } of patterns) {
      const match = str.match(re);
      if (match) {
        const result = format(match);
        // Sanity-check: extracted value should look like a salary number
        const num = parseFloat(match[1].replace(/,/g, ''));
        if (num < 1 || num > 500000) continue; // Skip obviously wrong matches
        return result;
      }
    }

    return null;
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
