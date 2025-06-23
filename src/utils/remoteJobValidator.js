const logger = require('./logger');

/**
 * Enhanced Remote Job Validator
 * Determines if a job is truly remote or requires on-site work
 */
class RemoteJobValidator {
  constructor() {
    // Keywords that strongly indicate remote work
    this.remoteIndicators = [
      'remote',
      'work from home',
      'work-from-home',
      'telecommute',
      'virtual',
      'distributed',
      'anywhere',
      'location independent',
      'fully remote',
      '100% remote',
      'remote-first',
      'remote only'
    ];

    // Keywords that indicate on-site requirements
    this.onsiteIndicators = [
      'on-site',
      'onsite',
      'in-person',
      'office',
      'headquarters',
      'commute',
      'relocation',
      'relocate',
      'must be located in',
      'local candidates',
      'within commuting distance',
      'come into the office',
      'face-to-face',
      'in our office',
      'at our location'
    ];

    // Patterns that indicate specific location requirements
    this.locationRequiredPatterns = [
      /must be (located )?in \w+/i,
      /based in \w+/i,
      /candidates in \w+/i,
      /\d+\s*(miles?|km|minutes?)\s*(from|to|of)\s+\w+/i,
      /commut(e|ing) to/i,
      /relocation (to|required)/i,
      /local to \w+/i,
      /within \d+/i,
      /\w+ area candidates/i,
      /prefer local/i,
      /office location.*\d+.*\w+.*\w+/i, // Catches addresses
      /monday.*friday.*\d+.*am.*pm/i, // Catches specific office hours
    ];

    // Specific address patterns that indicate on-site work
    this.addressPatterns = [
      /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr|lane|ln|way|court|ct|circle|cir|place|pl)/i,
      /\w+,\s*[A-Z]{2}\s*\d{5}/i, // City, ST ZIP
      /\d+\s+[A-Z]\w+\s+(Street|Avenue|Road|Boulevard)/i,
    ];

    // Countries/regions that may indicate specific location requirements
    this.specificLocations = [
      /only.*candidates.*from/i,
      /candidates.*must.*be.*in/i,
      /restricted.*to.*residents/i,
      /authorized.*to.*work.*in/i,
      /eligible.*to.*work.*in/i
    ];
  }

  /**
   * Validate if a job is truly remote
   * @param {Object} job - Job object
   * @returns {Object} - Validation result with isRemote flag and confidence score
   */
  validateRemoteJob(job) {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    
    // Combine all text for analysis
    const combinedText = `${title} ${description} ${location} ${company}`;

    let remoteScore = 0;
    let onsiteScore = 0;
    let reasons = [];

    // Check for remote indicators
    for (const indicator of this.remoteIndicators) {
      const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        remoteScore += matches.length * 2;
        reasons.push(`Found remote indicator: "${indicator}" (${matches.length} times)`);
      }
    }

    // Check for on-site indicators
    for (const indicator of this.onsiteIndicators) {
      const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        onsiteScore += matches.length * 3; // Weight on-site indicators more heavily
        reasons.push(`Found on-site indicator: "${indicator}" (${matches.length} times)`);
      }
    }

    // Check for location requirement patterns
    for (const pattern of this.locationRequiredPatterns) {
      if (pattern.test(combinedText)) {
        onsiteScore += 5;
        reasons.push(`Found location requirement pattern: ${pattern.source}`);
      }
    }

    // Check for specific address patterns
    for (const pattern of this.addressPatterns) {
      if (pattern.test(combinedText)) {
        onsiteScore += 4;
        reasons.push(`Found address pattern: ${pattern.source}`);
      }
    }

    // Analyze location field specifically
    if (location && location !== 'remote') {
      // Check if location contains specific city/state/country
      if (this.isSpecificLocation(location)) {
        onsiteScore += 2;
        reasons.push(`Specific location mentioned: "${location}"`);
      }
    }

    // Calculate confidence and final decision
    const totalScore = Math.max(remoteScore - onsiteScore, -10);
    const confidence = Math.min(Math.abs(totalScore) / 10, 1);
    const isRemote = totalScore > 0;

    // Additional checks for edge cases
    const result = {
      isRemote,
      confidence,
      remoteScore,
      onsiteScore,
      totalScore,
      reasons,
      recommendation: this.getRecommendation(totalScore, confidence)
    };

    return result;
  }

  /**
   * Check if a location string indicates a specific geographic location
   */
  isSpecificLocation(location) {
    const specific = [
      /\w+,\s*[A-Z]{2}/i, // City, State
      /\w+,\s*\w+/i, // City, Country or State
      /\b(in|near|around)\s+\w+/i,
      /\w+\s+(area|region|county|state|province)/i,
      /[A-Z]{2},?\s*USA/i,
      /United States/i,
      /\b(NY|CA|TX|FL|IL|PA|OH|GA|NC|MI)\b/i // Common state abbreviations
    ];

    return specific.some(pattern => pattern.test(location));
  }

  /**
   * Get recommendation based on scoring
   */
  getRecommendation(totalScore, confidence) {
    if (totalScore > 5 && confidence > 0.7) {
      return 'ACCEPT_HIGH_CONFIDENCE';
    } else if (totalScore > 2 && confidence > 0.5) {
      return 'ACCEPT_MEDIUM_CONFIDENCE';
    } else if (totalScore > 0) {
      return 'ACCEPT_LOW_CONFIDENCE';
    } else if (totalScore < -5 && confidence > 0.7) {
      return 'REJECT_HIGH_CONFIDENCE';
    } else if (totalScore < -2) {
      return 'REJECT_MEDIUM_CONFIDENCE';
    } else {
      return 'MANUAL_REVIEW_REQUIRED';
    }
  }

  /**
   * Filter jobs array to only include truly remote positions
   */
  filterRemoteJobs(jobs, minConfidence = 0.5, allowLowConfidence = false) {
    if (!Array.isArray(jobs)) {
      logger.error('Expected jobs array but received:', typeof jobs);
      return [];
    }

    logger.info(`Filtering ${jobs.length} jobs for remote work requirements`);
    
    const filteredJobs = [];
    const rejectedJobs = [];
    
    for (const job of jobs) {
      const validation = this.validateRemoteJob(job);
      
      // Add validation info to job
      job.remoteValidation = validation;
      
      // Determine if job should be included
      let shouldInclude = false;
      
      if (validation.recommendation === 'ACCEPT_HIGH_CONFIDENCE') {
        shouldInclude = true;
      } else if (validation.recommendation === 'ACCEPT_MEDIUM_CONFIDENCE' && validation.confidence >= minConfidence) {
        shouldInclude = true;
      } else if (validation.recommendation === 'ACCEPT_LOW_CONFIDENCE' && allowLowConfidence) {
        shouldInclude = true;
      }
      
      if (shouldInclude) {
        filteredJobs.push(job);
      } else {
        rejectedJobs.push({
          title: job.title,
          company: job.company,
          location: job.location,
          reason: validation.recommendation,
          confidence: validation.confidence,
          reasons: validation.reasons
        });
      }
    }
    
    logger.info(`Remote validation results: ${filteredJobs.length} accepted, ${rejectedJobs.length} rejected`);
    
    // Log some examples of rejected jobs for debugging
    if (rejectedJobs.length > 0) {
      logger.info('Sample rejected jobs:');
      rejectedJobs.slice(0, 5).forEach(job => {
        logger.info(`- ${job.title} at ${job.company} (${job.reason}): ${job.reasons.slice(0, 2).join(', ')}`);
      });
    }
    
    return filteredJobs;
  }
}

module.exports = new RemoteJobValidator(); 