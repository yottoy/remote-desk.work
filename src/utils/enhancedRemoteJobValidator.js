const logger = require('./logger');

/**
 * Enhanced Remote Job Validator with Improved On-site Detection
 * This version has more sophisticated rules to catch on-site jobs
 */
class EnhancedRemoteJobValidator {
  constructor() {
    // Strong remote indicators
    this.strongRemoteIndicators = [
      'fully remote',
      '100% remote',
      'remote-first',
      'remote only',
      'work from anywhere',
      'location independent',
      'distributed team',
      'no office required',
      'home office',
      'telecommute',
      'work-from-home',
      'work from home'
    ];

    // Weak remote indicators (need additional confirmation)
    this.weakRemoteIndicators = [
      'remote',
      'virtual',
      'wfh'
    ];

    // Strong on-site indicators
    this.strongOnsiteIndicators = [
      'on-site',
      'onsite',
      'in-person',
      'office location',
      'come into the office',
      'at our office',
      'in our office',
      'office environment',
      'office setting',
      'headquarters',
      'commute to',
      'commuting distance',
      'within commuting distance',
      'relocation required',
      'must relocate',
      'local candidates',
      'local candidates only',
      'candidates in',
      'must be located in',
      'based in',
      'prefer local',
      'face-to-face',
      'in-office',
      'parking provided',
      'office culture',
      'team lunches',
      'on-site training',
      'report to office',
      // Enhanced patterns for explicit onsite requirements
      'onsite only',
      'on-site only', 
      'in-person only',
      'office based only',
      'office-based only',
      'no remote work',
      'remote work is not available',
      'remote work not available',
      'no work from home',
      'work from home not available',
      'must work onsite',
      'must work on-site',
      'must work in office',
      'office attendance required',
      'physical presence required',
      'on-premises only',
      'on premises only',
      'must be present in office',
      'candidates that live in',
      'must live in',
      'required to live in',
      'must reside in',
      'candidates who live in',
      'living in.*required',
      'residents of.*only',
      'must be a resident of'
    ];

    // Location requirement patterns
    this.locationRequiredPatterns = [
      /must be (located )?in \w+/i,
      /based in \w+/i,
      /candidates in \w+/i,
      /local to \w+/i,
      /\d+\s*(miles?|km|minutes?)\s*(from|to|of)\s+\w+/i,
      /commut(e|ing) to/i,
      /relocation (to|required)/i,
      /within \d+\s*(miles?|km)/i,
      /\w+ area candidates/i,
      /prefer local/i,
      /local candidates only/i,
      /must be able to commute/i,
      /reliable transportation/i,
      /valid driver.?s license/i,
      // Enhanced location-specific patterns
      /candidates that live in [A-Z][a-z]+,?\s*[A-Z]{2}/i,
      /must live in [A-Z][a-z]+,?\s*[A-Z]{2}/i,
      /required to live in [A-Z][a-z]+,?\s*[A-Z]{2}/i,
      /must reside in [A-Z][a-z]+,?\s*[A-Z]{2}/i,
      /candidates who live in [A-Z][a-z]+,?\s*[A-Z]{2}/i,
      /living in [A-Z][a-z]+,?\s*[A-Z]{2}.*required/i,
      /residents of [A-Z][a-z]+,?\s*[A-Z]{2}.*only/i,
      /must be a resident of [A-Z][a-z]+,?\s*[A-Z]{2}/i,
      /candidates.*live.*within.*\d+.*miles/i,
      /must.*live.*within.*\d+.*miles/i,
      /candidates.*reside.*within.*\d+.*miles/i
    ];

    // Address patterns that indicate physical location
    this.addressPatterns = [
      /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr|lane|ln|way|court|ct|circle|cir|place|pl)/i,
      /\w+,\s*[A-Z]{2}\s*\d{5}/i, // City, ST ZIP
      /\d+\s+[A-Z]\w+\s+(Street|Avenue|Road|Boulevard)/i,
      /suite\s+\d+/i,
      /floor\s+\d+/i,
      /building\s+\w+/i
    ];

    // Specific location patterns
    this.specificLocationPatterns = [
      /\w+,\s*[A-Z]{2}(?:\s*,?\s*US)?$/i, // City, State format
      /\w+,\s*\w+,\s*[A-Z]{2}/i, // City, County, State
      /[A-Z]{2},?\s*USA?$/i, // State, USA
      /United States$/i
    ];

    // Work schedule patterns that suggest on-site
    this.onsiteSchedulePatterns = [
      /monday.*friday.*\d+.*am.*pm/i,
      /\d+\s*am\s*-\s*\d+\s*pm/i,
      /business hours/i,
      /office hours/i,
      /8.*5/i, // 8 to 5 schedule
      /9.*5/i  // 9 to 5 schedule
    ];

    // Job titles that are typically on-site
    this.typicallyOnsiteJobTitles = [
      'receptionist',
      'front desk',
      'security',
      'maintenance',
      'custodial',
      'janitor',
      'warehouse',
      'shipping',
      'receiving',
      'driver',
      'delivery',
      'cashier',
      'retail',
      'sales associate',
      'store',
      'clinic',
      'medical assistant',
      'dental assistant',
      'nurse',
      'therapist',
      'technician',
      'lab',
      'kitchen',
      'food service',
      'restaurant'
    ];

    // NEW: Company types that are typically on-site
    this.onsiteCompanyTypes = [
      'healthcare center',
      'medical center',
      'hospital',
      'clinic',
      'school district',
      'independent school',
      'university',
      'government',
      'city of',
      'county of',
      'state of',
      'department of'
    ];

    // NEW: Remote-friendly location indicators
    this.remoteFriendlyLocations = [
      'remote',
      'work from home',
      'anywhere',
      'worldwide',
      'global',
      'distributed',
      'virtual'
    ];
  }

  /**
   * Enhanced validation with more sophisticated scoring
   */
  validateRemoteJob(job) {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    
    const combinedText = `${title} ${description} ${location} ${company}`;

    let remoteScore = 0;
    let onsiteScore = 0;
    let reasons = [];

    // Check for strong remote indicators
    for (const indicator of this.strongRemoteIndicators) {
      const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        remoteScore += matches.length * 5; // Higher weight for strong indicators
        reasons.push(`Strong remote indicator: "${indicator}" (${matches.length} times)`);
      }
    }

    // Check for weak remote indicators
    for (const indicator of this.weakRemoteIndicators) {
      const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        remoteScore += matches.length * 2; // Lower weight for weak indicators
        reasons.push(`Weak remote indicator: "${indicator}" (${matches.length} times)`);
      }
    }

    // NEW: Special handling for title-based remote indicators
    if (title.includes('virtual') || title.includes('remote')) {
      remoteScore += 3; // Bonus for remote indicators in title
      reasons.push('Remote indicator in job title');
    }

    // Check for strong on-site indicators
    for (const indicator of this.strongOnsiteIndicators) {
      const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        onsiteScore += matches.length * 6; // High penalty for strong on-site indicators
        reasons.push(`Strong on-site indicator: "${indicator}" (${matches.length} times)`);
      }
    }

    // Check job title for typically on-site roles
    for (const onsiteTitle of this.typicallyOnsiteJobTitles) {
      if (title.includes(onsiteTitle)) {
        onsiteScore += 4;
        reasons.push(`Typically on-site job title: "${onsiteTitle}"`);
      }
    }

    // NEW: Check company type for typically on-site organizations
    for (const companyType of this.onsiteCompanyTypes) {
      if (company.includes(companyType)) {
        onsiteScore += 5;
        reasons.push(`Typically on-site company type: "${companyType}"`);
      }
    }

    // Check for location requirement patterns
    for (const pattern of this.locationRequiredPatterns) {
      if (pattern.test(combinedText)) {
        onsiteScore += 5;
        reasons.push(`Location requirement pattern: ${pattern.source}`);
      }
    }

    // Check for address patterns
    for (const pattern of this.addressPatterns) {
      if (pattern.test(combinedText)) {
        onsiteScore += 4;
        reasons.push(`Address pattern found: ${pattern.source}`);
      }
    }

    // Check for on-site schedule patterns
    for (const pattern of this.onsiteSchedulePatterns) {
      if (pattern.test(combinedText)) {
        onsiteScore += 3;
        reasons.push(`On-site schedule pattern: ${pattern.source}`);
      }
    }

    // NEW: Enhanced location analysis
    if (location) {
      // Check if location is explicitly remote-friendly
      let isRemoteFriendlyLocation = false;
      for (const remoteLoc of this.remoteFriendlyLocations) {
        if (location.includes(remoteLoc)) {
          remoteScore += 4;
          reasons.push(`Remote-friendly location: "${remoteLoc}"`);
          isRemoteFriendlyLocation = true;
          break;
        }
      }

      // If not remote-friendly, check for specific geographic information
      if (!isRemoteFriendlyLocation && location !== 'remote' && location !== 'work from home') {
        // Check if location contains specific geographic information
        for (const pattern of this.specificLocationPatterns) {
          if (pattern.test(location)) {
            // NEW: Reduced penalty if job has strong remote indicators
            const penalty = remoteScore >= 5 ? 1 : 3; // Lower penalty if strong remote signals
            onsiteScore += penalty;
            reasons.push(`Specific location mentioned: "${location}" (penalty: ${penalty})`);
            break;
          }
        }
      }
    }

    // Special penalty for certain phrases that strongly indicate on-site work
    const strongOnsitePhrases = [
      'work location.*in person',
      'must be able to commute',
      'office based',
      'on-site position',
      'in-person role',
      'physical presence required',
      // Enhanced patterns for explicit onsite/location requirements
      'onsite only',
      'on-site only',
      'in-person only', 
      'office based only',
      'office-based only',
      'candidates that live in.*are required',
      'candidates who live in.*are required',
      'must live in.*TN',
      'must live in.*TX',
      'must live in.*CA',
      'must live in.*NY',
      'must live in.*FL',
      'must live in.*PA',
      'must live in.*IL',
      'must live in.*OH',
      'must live in.*GA',
      'must live in.*NC',
      'must live in.*MI',
      'must live in.*NJ',
      'must live in.*VA',
      'must live in.*WA',
      'must live in.*AZ',
      'must live in.*MA',
      'must live in.*IN',
      'must live in.*MO',
      'must live in.*MD',
      'must live in.*WI',
      'must live in.*CO',
      'must live in.*MN',
      'must live in.*SC',
      'must live in.*AL',
      'must live in.*LA',
      'must live in.*KY',
      'must live in.*OR',
      'must live in.*OK',
      'must live in.*CT',
      'must live in.*UT',
      'must live in.*IA',
      'must live in.*NV',
      'must live in.*AR',
      'must live in.*MS',
      'must live in.*KS',
      'must live in.*NM',
      'must live in.*NE',
      'must live in.*WV',
      'must live in.*ID',
      'must live in.*HI',
      'must live in.*NH',
      'must live in.*ME',
      'must live in.*MT',
      'must live in.*RI',
      'must live in.*DE',
      'must live in.*SD',
      'must live in.*ND',
      'must live in.*AK',
      'must live in.*VT',
      'must live in.*WY',
      'candidates.*must.*live.*in',
      'applicants.*must.*live.*in',
      'only.*candidates.*who.*live.*in',
      'only.*applicants.*who.*live.*in',
      'remote work is not available',
      'remote work not available', 
      'no remote work available',
      'no work from home',
      'work from home not available',
      'work from home is not available',
      'this role is onsite only',
      'this position is onsite only',
      'this job is onsite only',
      'this role is on-site only',
      'this position is on-site only',
      'this job is on-site only'
    ];

    for (const phrase of strongOnsitePhrases) {
      const regex = new RegExp(phrase, 'gi');
      if (regex.test(combinedText)) {
        onsiteScore += 8; // Very high penalty
        reasons.push(`Strong on-site phrase: "${phrase}"`);
      }
    }

    // NEW: Boost confidence for clear cases
    let confidenceBoost = 0;
    if (remoteScore >= 8 && onsiteScore <= 2) {
      confidenceBoost = 0.3; // Boost confidence for clearly remote jobs
    } else if (onsiteScore >= 8 && remoteScore <= 2) {
      confidenceBoost = 0.3; // Boost confidence for clearly on-site jobs
    }

    // Calculate final scores
    const totalScore = remoteScore - onsiteScore;
    const baseConfidence = Math.min(Math.abs(totalScore) / 15, 1);
    const confidence = Math.min(baseConfidence + confidenceBoost, 1);
    const isRemote = totalScore > 0;

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
   * Get recommendation based on score and confidence
   */
  getRecommendation(totalScore, confidence) {
    if (totalScore > 5 && confidence >= 0.7) {
      return 'ACCEPT_HIGH_CONFIDENCE';
    } else if (totalScore > 2 && confidence >= 0.5) {
      return 'ACCEPT_MEDIUM_CONFIDENCE';
    } else if (totalScore > 0 && confidence >= 0.3) {
      return 'ACCEPT_LOW_CONFIDENCE';
    } else if (totalScore <= -5 && confidence >= 0.7) {
      return 'REJECT_HIGH_CONFIDENCE_ONSITE';
    } else if (totalScore <= -2 && confidence >= 0.5) {
      return 'REJECT_MEDIUM_CONFIDENCE_ONSITE';
    } else {
      return 'REVIEW_UNCLEAR';
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
      } else if (validation.recommendation === 'REVIEW_UNCLEAR' && validation.isRemote && validation.confidence >= 0.3) {
        // NEW: Include unclear jobs that lean remote with decent confidence
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
    
    logger.info(`Enhanced remote validation results: ${filteredJobs.length} accepted, ${rejectedJobs.length} rejected`);
    
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

module.exports = new EnhancedRemoteJobValidator(); 