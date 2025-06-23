const logger = require('./logger');

/**
 * Ultra-Conservative Remote Job Validator
 * 
 * This validator uses a VERY conservative approach:
 * - Only keeps jobs that are CLEARLY remote with HIGH confidence
 * - Aggressively removes anything that might be onsite
 * - Ensures all jobs have proper descriptions for SEO
 * 
 * Philosophy: Better to lose some remote jobs than keep onsite ones
 */
class UltraConservativeRemoteValidator {
  constructor() {
    // EXPLICIT onsite rejection patterns - if ANY of these match, REJECT immediately
    this.instantRejectPatterns = [
      // Explicit onsite requirements
      /onsite\s+only/i,
      /on-site\s+only/i,
      /in-person\s+only/i,
      /office\s+based\s+only/i,
      /office-based\s+only/i,
      
      // Work schedule that indicates physical presence
      /work\s+will\s+be\s+onsite/i,
      /work\s+onsite/i,
      /monday\s+through\s+friday.*\d+\s*am.*\d+\s*pm/i,
      /\d+\s*am\s*-\s*\d+\s*pm.*onsite/i,
      /office\s+hours.*\d+.*am.*pm/i,
      
      // Location requirements
      /candidates\s+that\s+live\s+in/i,
      /candidates\s+who\s+live\s+in/i,
      /must\s+live\s+in\s+[A-Z][a-z]+,?\s*[A-Z]{2}/i,
      /must\s+reside\s+in\s+[A-Z][a-z]+,?\s*[A-Z]{2}/i,
      /required\s+to\s+live\s+in/i,
      /applicants.*must.*live.*in/i,
      /only.*candidates.*who.*live.*in/i,
      
      // Physical presence requirements
      /physical\s+presence\s+required/i,
      /must\s+be\s+able\s+to\s+commute/i,
      /commuting\s+distance/i,
      /within\s+\d+\s*(miles?|km)/i,
      /reliable\s+transportation/i,
      
      // No remote work statements
      /remote\s+work\s+is\s+not\s+available/i,
      /remote\s+work\s+not\s+available/i,
      /no\s+remote\s+work/i,
      /work\s+from\s+home\s+not\s+available/i,
      /no\s+work\s+from\s+home/i,
      
      // Address patterns - specific addresses usually mean onsite
      /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr)\b/i,
      /suite\s+\d+/i,
      /floor\s+\d+/i,
      
      // Company-specific onsite indicators
      /report\s+to\s+office/i,
      /come\s+into\s+the\s+office/i,
      /at\s+our\s+office/i,
      /in\s+our\s+office/i,
      /office\s+environment/i,
      /office\s+culture/i,
      /team\s+lunches/i,
      /parking\s+provided/i
    ];
    
    // Job titles that are typically onsite (be very aggressive here)
    this.onsiteJobTitles = [
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
      'lab tech',
      'kitchen',
      'food service',
      'restaurant',
      'server',
      'bartender',
      'housekeeping',
      'cleaning'
    ];
    
    // Company types that are typically onsite
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
      'department of',
      'restaurant',
      'retail',
      'store'
    ];
    
    // REQUIRED remote indicators - job MUST have at least one of these
    this.requiredRemoteIndicators = [
      'remote',
      'work from home',
      'work-from-home',
      'wfh',
      'telecommute',
      'virtual',
      'distributed',
      'home office',
      'anywhere',
      'location independent'
    ];
    
    // Strong positive remote indicators
    this.strongRemoteIndicators = [
      'fully remote',
      '100% remote',
      'remote-first',
      'remote only',
      'work from anywhere',
      'location independent',
      'distributed team',
      'no office required',
      'home office'
    ];
  }

  /**
   * Ultra-conservative validation
   * Returns true only if we're VERY confident the job is remote
   */
  validateRemoteJob(job) {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    
    const combinedText = `${title} ${description} ${location} ${company}`;
    
    let score = 0;
    let reasons = [];
    
    // STEP 1: Check for instant rejection patterns
    for (const pattern of this.instantRejectPatterns) {
      if (pattern.test(combinedText)) {
        return {
          isRemote: false,
          confidence: 1.0,
          score: -100,
          reasons: [`INSTANT REJECT: ${pattern.source}`],
          recommendation: 'REJECT_ONSITE'
        };
      }
    }
    
    // STEP 2: Check for onsite job titles
    for (const onsiteTitle of this.onsiteJobTitles) {
      if (title.includes(onsiteTitle)) {
        return {
          isRemote: false,
          confidence: 0.9,
          score: -50,
          reasons: [`Typically onsite job title: ${onsiteTitle}`],
          recommendation: 'REJECT_ONSITE'
        };
      }
    }
    
    // STEP 3: Check for onsite company types
    for (const companyType of this.onsiteCompanyTypes) {
      if (company.includes(companyType)) {
        return {
          isRemote: false,
          confidence: 0.8,
          score: -30,
          reasons: [`Typically onsite company: ${companyType}`],
          recommendation: 'REJECT_ONSITE'
        };
      }
    }
    
    // STEP 4: Must have at least one remote indicator
    let hasRemoteIndicator = false;
    for (const indicator of this.requiredRemoteIndicators) {
      if (combinedText.includes(indicator)) {
        hasRemoteIndicator = true;
        score += 5;
        reasons.push(`Required remote indicator: ${indicator}`);
        break;
      }
    }
    
    if (!hasRemoteIndicator) {
      return {
        isRemote: false,
        confidence: 0.8,
        score: -20,
        reasons: ['No explicit remote indicators found'],
        recommendation: 'REJECT_NO_REMOTE_INDICATORS'
      };
    }
    
    // STEP 5: Check for strong remote indicators
    for (const indicator of this.strongRemoteIndicators) {
      if (combinedText.includes(indicator)) {
        score += 10;
        reasons.push(`Strong remote indicator: ${indicator}`);
      }
    }
    
    // STEP 6: Location analysis
    if (location) {
      const remoteLocationTerms = ['remote', 'work from home', 'anywhere', 'worldwide', 'global', 'virtual'];
      let isRemoteLocation = false;
      
      for (const term of remoteLocationTerms) {
        if (location.includes(term)) {
          score += 8;
          reasons.push(`Remote location: ${term}`);
          isRemoteLocation = true;
          break;
        }
      }
      
      // If location is specific (City, State format) and no strong remote indicators, be suspicious
      if (!isRemoteLocation && /\w+,\s*[A-Z]{2}/.test(location) && score < 15) {
        score -= 5;
        reasons.push(`Specific location without strong remote indicators: ${location}`);
      }
    }
    
    // STEP 7: Final scoring
    const confidence = Math.min(Math.abs(score) / 20, 1);
    const isRemote = score >= 10; // Higher threshold for acceptance
    
    let recommendation;
    if (score >= 20) {
      recommendation = 'ACCEPT_HIGH_CONFIDENCE';
    } else if (score >= 15) {
      recommendation = 'ACCEPT_MEDIUM_CONFIDENCE';
    } else if (score >= 10) {
      recommendation = 'ACCEPT_LOW_CONFIDENCE';
    } else {
      recommendation = 'REJECT_INSUFFICIENT_EVIDENCE';
    }
    
    return {
      isRemote,
      confidence,
      score,
      reasons,
      recommendation
    };
  }

  /**
   * Ensure job has a proper description for SEO
   */
  ensureJobHasDescription(job) {
    // If job already has both description and descriptionText, return as is
    if (job.description && job.descriptionText) {
      return job;
    }
    
    // Generate description if missing
    let generatedDescription = '';
    
    if (job.description && !job.descriptionText) {
      // Convert HTML description to text
      generatedDescription = job.description
        .replace(/<[^>]*>/g, ' ') // Remove HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      job.descriptionText = generatedDescription;
    } else if (job.descriptionText && !job.description) {
      // Use descriptionText as description
      job.description = job.descriptionText;
    } else {
      // Generate a basic description
      const title = job.title || 'Remote Position';
      const company = job.company || 'Company';
      const location = job.location || 'Remote';
      
      generatedDescription = `${title} at ${company}. This is a remote position based in ${location}. ` +
        `We are seeking a qualified candidate for this remote administrative/data entry role. ` +
        `This position offers the flexibility of working from home with competitive compensation. ` +
        `Apply now to join our team in this remote opportunity.`;
      
      job.description = generatedDescription;
      job.descriptionText = generatedDescription;
    }
    
    return job;
  }

  /**
   * Ultra-conservative filter that only accepts clearly remote jobs
   */
  filterRemoteJobs(jobs) {
    if (!Array.isArray(jobs)) {
      logger.error('Expected jobs array but received:', typeof jobs);
      return [];
    }

    logger.info(`🔍 Ultra-conservative filtering of ${jobs.length} jobs`);
    
    const results = {
      accepted: [],
      rejected: []
    };
    
    for (const job of jobs) {
      const validation = this.validateRemoteJob(job);
      
      // Only accept jobs with strong evidence of being remote
      if (validation.recommendation.startsWith('ACCEPT')) {
        // Ensure job has description before accepting
        const jobWithDescription = this.ensureJobHasDescription({ ...job });
        
        // Add validation info
        jobWithDescription.remoteValidation = validation;
        
        results.accepted.push(jobWithDescription);
      } else {
        results.rejected.push({
          title: job.title,
          company: job.company,
          location: job.location,
          reason: validation.recommendation,
          confidence: validation.confidence,
          score: validation.score,
          mainReason: validation.reasons[0] || 'Unknown'
        });
      }
    }
    
    logger.info(`✅ Ultra-conservative results: ${results.accepted.length} accepted, ${results.rejected.length} rejected`);
    
    // Log rejection statistics
    const rejectionReasons = {};
    results.rejected.forEach(job => {
      rejectionReasons[job.reason] = (rejectionReasons[job.reason] || 0) + 1;
    });
    
    logger.info('📊 Rejection breakdown:');
    Object.entries(rejectionReasons).forEach(([reason, count]) => {
      logger.info(`  ${reason}: ${count} jobs`);
    });
    
    // Log sample rejections for each category
    logger.info('🔍 Sample rejections:');
    Object.keys(rejectionReasons).forEach(reason => {
      const samples = results.rejected.filter(job => job.reason === reason).slice(0, 2);
      samples.forEach(job => {
        logger.info(`  ${reason}: "${job.title}" at ${job.company} - ${job.mainReason}`);
      });
    });
    
    return results.accepted;
  }

  /**
   * Analyze current job database for onsite patterns
   */
  async analyzeJobDatabase(collection) {
    logger.info('🔍 Analyzing job database for onsite patterns...');
    
    const jobs = await collection.find({}).limit(100).toArray();
    const patterns = {};
    
    jobs.forEach(job => {
      const validation = this.validateRemoteJob(job);
      
      if (!validation.isRemote) {
        const mainReason = validation.reasons[0] || 'Unknown';
        patterns[mainReason] = (patterns[mainReason] || 0) + 1;
      }
    });
    
    logger.info('📊 Onsite patterns found in sample:');
    Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .forEach(([pattern, count]) => {
        logger.info(`  ${pattern}: ${count} jobs`);
      });
    
    return patterns;
  }
}

module.exports = new UltraConservativeRemoteValidator(); 