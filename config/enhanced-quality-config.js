module.exports = {
  // Enhanced remote job validation settings
  remoteValidation: {
    // Minimum confidence score to accept a job (0.0 - 1.0)
    minConfidence: 0.6,
    
    // Whether to allow low confidence remote jobs
    allowLowConfidence: false,
    
    // Additional scoring weights
    scoring: {
      // Boost score for jobs with these remote-specific terms
      remoteBoostTerms: [
        'work from anywhere',
        'location independent',
        'distributed team',
        'remote-first',
        'no office required',
        'home office',
        'digital nomad'
      ],
      
      // Penalty for jobs with these location-specific terms
      locationPenaltyTerms: [
        'must be based in',
        'local candidates only',
        'within driving distance',
        'prefer local',
        'on-site training',
        'office culture',
        'team lunches',
        'parking provided'
      ]
    }
  },
  
  // Enhanced search terms for better remote job targeting
  searchTerms: {
    // Primary search terms - highest priority
    primary: [
      '"remote data entry" -onsite -office',
      '"work from home data entry" -commute',
      '"virtual administrative assistant" -office',
      '"remote administrative assistant" -onsite',
      '"telecommute data entry" -office'
    ],
    
    // Secondary search terms - good quality
    secondary: [
      '"data entry" "work from home" -office',
      '"administrative assistant" "remote" -onsite',
      '"virtual assistant" "data entry"',
      '"remote office assistant" -commute',
      '"work from home administrative" -office'
    ],
    
    // Tertiary search terms - use sparingly
    tertiary: [
      '"remote clerical" -office',
      '"virtual receptionist" -onsite',
      '"remote transcription" -office',
      '"work from home clerk" -commute'
    ]
  },
  
  // Quality scoring improvements
  qualityScoring: {
    // Increase threshold to be more selective
    threshold: 6, // Increased from 5
    featuredThreshold: 8,
    
    // Enhanced red flags
    redFlags: [
      'mlm',
      'multi level marketing',
      'pyramid',
      'upfront fee',
      'pay to work',
      'investment required',
      '$1000/day',
      'get rich quick',
      'no experience necessary but high pay',
      'must be local',
      'office location',
      'commute required',
      'in-person interview required',
      'relocation package'
    ],
    
    // Enhanced relevance keywords
    relevanceKeywords: {
      high: [
        'data entry',
        'administrative assistant',
        'admin assistant',
        'customer service',
        'virtual assistant',
        'remote admin',
        'work from home',
        'telecommute',
        'remote work',
        'virtual work'
      ],
      medium: [
        'clerk',
        'secretary',
        'receptionist',
        'typist',
        'transcription',
        'support',
        'coordinator',
        'specialist'
      ]
    },
    
    // Location quality scoring
    locationScoring: {
      // Boost for these location indicators
      remoteLocationBoost: [
        'remote',
        'work from home',
        'anywhere',
        'virtual',
        'telecommute'
      ],
      
      // Penalty for specific locations
      specificLocationPenalty: [
        /\w+,\s*[A-Z]{2}/i, // City, State
        /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|blvd|boulevard)/i, // Street addresses
        /suite \d+/i,
        /floor \d+/i
      ]
    }
  },
  
  // Daily job targets
  dailyTargets: {
    // Target number of jobs to add per day
    targetJobsPerDay: 15,
    
    // Minimum quality jobs to maintain
    minQualityJobs: 10,
    
    // Maximum jobs to process to reach targets
    maxJobsToProcess: 100
  },
  
  // Monitoring and alerts
  monitoring: {
    // Alert if acceptance rate drops below this percentage
    minAcceptanceRate: 15, // 15% of scraped jobs should pass validation
    
    // Alert if daily job count drops below this
    minDailyJobs: 8,
    
    // Log detailed rejection reasons for analysis
    logRejectionReasons: true,
    
    // Sample size for quality analysis
    qualityAnalysisSampleSize: 50
  }
}; 