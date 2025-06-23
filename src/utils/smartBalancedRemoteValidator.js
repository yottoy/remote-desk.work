const logger = require('./logger');

/**
 * Smart Balanced Remote Job Validator
 * 
 * This validator strikes a balance between being conservative enough to filter out
 * clearly onsite jobs while not being so strict that it rejects legitimate remote jobs.
 * 
 * Philosophy: Remove obvious onsite jobs, keep ambiguous ones that lean remote
 */
class SmartBalancedRemoteValidator {
  constructor() {
    // Patterns that immediately disqualify a job (very high confidence onsite)
    this.highConfidenceOnsitePatterns = [
      // Explicit onsite-only statements
      /onsite\s+only/i,
      /on-site\s+only/i,
      /in-person\s+only/i,
      /office\s+based\s+only/i,
      /office-based\s+only/i,
      
      // Explicit work schedule indicating physical presence
      /work\s+will\s+be\s+onsite/i,
      /monday\s+through\s+friday.*\d+\s*am.*\d+\s*pm.*onsite/i,
      /\d+\s*am\s*-\s*\d+\s*pm.*onsite/i,
      
      // Specific location requirements with explicit restrictions
      /candidates\s+that\s+live\s+in\s+[A-Z][a-z]+,?\s*[A-Z]{2}.*required/i,
      /candidates\s+who\s+live\s+in\s+[A-Z][a-z]+,?\s*[A-Z]{2}.*required/i,
      /must\s+live\s+in\s+[A-Z][a-z]+,?\s*[A-Z]{2}.*required/i,
      /only.*candidates.*who.*live.*in\s+[A-Z][a-z]+,?\s*[A-Z]{2}/i,
      
      // No remote work statements
      /remote\s+work\s+is\s+not\s+available/i,
      /remote\s+work\s+not\s+available/i,
      /no\s+remote\s+work/i,
      /work\s+from\s+home\s+not\s+available/i,
      
      // Physical presence requirements
      /physical\s+presence\s+required/i,
      /must\s+be\s+able\s+to\s+commute/i,
      /within\s+\d+\s*miles.*required/i,
      
      // Specific addresses (usually indicate onsite)
      /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr),?\s*[A-Z][a-z]+,?\s*[A-Z]{2}/i
    ];
    
    // Job titles that are typically onsite (aggressive filtering)
    this.typicallyOnsiteJobTitles = [
      'receptionist',
      'front desk',
      'security guard',
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
      'store manager',
      'medical assistant',
      'dental assistant',
      'nurse',
      'therapist',
      'lab technician',
      'kitchen',
      'food service',
      'restaurant',
      'server',
      'bartender'
    ];
    
    // Company types that are typically onsite
    this.typicallyOnsiteCompanies = [
      'healthcare center',
      'medical center',
      'hospital',
      'clinic',
      'school district',
      'government',
      'city of',
      'county of',
      'state of',
      'department of'
    ];
    
    // Strong remote indicators (high positive score)
    this.strongRemoteIndicators = [
      'fully remote',
      '100% remote',
      'remote-first',
      'remote only',
      'work from anywhere',
      'location independent',
      'distributed team',
      'no office required',
      'telecommute',
      'work-from-home'
    ];
    
    // Medium remote indicators
    this.mediumRemoteIndicators = [
      'remote',
      'virtual',
      'work from home',
      'wfh',
      'home office'
    ];
    
    // Location patterns that suggest onsite (but not definitive)
    this.suspiciousLocationPatterns = [
      /must\s+be\s+located\s+in/i,
      /local\s+candidates\s+only/i,
      /prefer\s+local/i,
      /commut(e|ing)\s+to/i,
      /reliable\s+transportation/i
    ];
  }

  /**
   * Smart balanced validation
   */
  validateRemoteJob(job) {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    
    const combinedText = `${title} ${description} ${location} ${company}`;
    
    let score = 0;
    let reasons = [];
    
    // INSTANT REJECTION: High confidence onsite patterns
    for (const pattern of this.highConfidenceOnsitePatterns) {
      if (pattern.test(combinedText)) {
        return {
          isRemote: false,
          confidence: 0.95,
          score: -100,
          reasons: [`HIGH CONFIDENCE ONSITE: ${pattern.source}`],
          recommendation: 'REJECT_HIGH_CONFIDENCE_ONSITE'
        };
      }
    }
    
    // Check for typically onsite job titles
    for (const onsiteTitle of this.typicallyOnsiteJobTitles) {
      if (title.includes(onsiteTitle)) {
        // Unless job has strong remote indicators, reject it
        let hasStrongRemote = false;
        for (const remoteIndicator of this.strongRemoteIndicators) {
          if (combinedText.includes(remoteIndicator)) {
            hasStrongRemote = true;
            break;
          }
        }
        
        if (!hasStrongRemote) {
          return {
            isRemote: false,
            confidence: 0.8,
            score: -50,
            reasons: [`Typically onsite job title: ${onsiteTitle}`],
            recommendation: 'REJECT_ONSITE_JOB_TITLE'
          };
        } else {
          score -= 5; // Small penalty but don't reject
          reasons.push(`Onsite job title but has remote indicators: ${onsiteTitle}`);
        }
      }
    }
    
    // Check for typically onsite companies
    for (const companyType of this.typicallyOnsiteCompanies) {
      if (company.includes(companyType)) {
        score -= 10;
        reasons.push(`Typically onsite company: ${companyType}`);
      }
    }
    
    // Positive scoring for remote indicators
    for (const indicator of this.strongRemoteIndicators) {
      if (combinedText.includes(indicator)) {
        score += 15;
        reasons.push(`Strong remote indicator: ${indicator}`);
      }
    }
    
    for (const indicator of this.mediumRemoteIndicators) {
      if (combinedText.includes(indicator)) {
        score += 8;
        reasons.push(`Remote indicator: ${indicator}`);
      }
    }
    
    // Location analysis
    if (location) {
      if (['remote', 'work from home', 'anywhere', 'worldwide', 'global', 'virtual'].some(term => location.includes(term))) {
        score += 12;
        reasons.push(`Remote-friendly location: ${location}`);
      } else if (/\w+,\s*[A-Z]{2}/.test(location)) {
        // Specific location - penalty increases based on lack of remote indicators
        const penalty = score > 5 ? -3 : -8; // Higher penalty if no strong remote signals
        score += penalty;
        reasons.push(`Specific location: ${location} (penalty: ${penalty})`);
      }
    }
    
    // Check for suspicious location requirements
    for (const pattern of this.suspiciousLocationPatterns) {
      if (pattern.test(combinedText)) {
        score -= 8;
        reasons.push(`Suspicious location requirement: ${pattern.source}`);
      }
    }
    
    // NEW: Jobs without any remote indicators get penalized more heavily
    const hasAnyRemoteIndicator = [...this.strongRemoteIndicators, ...this.mediumRemoteIndicators]
      .some(indicator => combinedText.includes(indicator));
    
    if (!hasAnyRemoteIndicator) {
      score -= 5;
      reasons.push('No explicit remote indicators found');
    }
    
    // Final scoring and recommendation
    const confidence = Math.min(Math.abs(score) / 25, 1);
    const isRemote = score > 0;
    
    let recommendation;
    if (score >= 15) {
      recommendation = 'ACCEPT_HIGH_CONFIDENCE';
    } else if (score >= 8) {
      recommendation = 'ACCEPT_MEDIUM_CONFIDENCE';
    } else if (score >= 3) {
      recommendation = 'ACCEPT_LOW_CONFIDENCE';
    } else if (score <= -15) {
      recommendation = 'REJECT_HIGH_CONFIDENCE_ONSITE';
    } else if (score <= -8) {
      recommendation = 'REJECT_MEDIUM_CONFIDENCE_ONSITE';
    } else {
      recommendation = 'REVIEW_UNCLEAR';
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
   * Smart balanced filter with adjustable ambiguous job handling
   */
  filterRemoteJobs(jobs, keepAmbiguous = false) { // Changed default to false
    if (!Array.isArray(jobs)) {
      logger.error('Expected jobs array but received:', typeof jobs);
      return [];
    }

    logger.info(`🎯 Smart balanced filtering of ${jobs.length} jobs`);
    
    const results = {
      accepted: [],
      rejected: []
    };
    
    for (const job of jobs) {
      const validation = this.validateRemoteJob(job);
      
      let shouldAccept = false;
      
      // Accept clear remote jobs
      if (validation.recommendation.startsWith('ACCEPT')) {
        shouldAccept = true;
      }
      // Keep ambiguous jobs only if they have a positive score AND keepAmbiguous is true
      else if (keepAmbiguous && validation.recommendation === 'REVIEW_UNCLEAR' && validation.score >= 0) {
        shouldAccept = true;
      }
      
      if (shouldAccept) {
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
    
    logger.info(`✅ Smart balanced results: ${results.accepted.length} accepted, ${results.rejected.length} rejected`);
    
    return results.accepted;
  }
}

module.exports = new SmartBalancedRemoteValidator(); 