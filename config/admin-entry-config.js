/**
 * ClickClickJob.com Admin/Data Entry JobSpy Configuration
 * 
 * This file contains specialized configuration for JobSpy to effectively
 * scrape admin and data entry remote positions from various job boards.
 */

module.exports = {
  // General scraping configuration
  general: {
    resultsWanted: 100,      // Number of results to fetch per query
    hoursOld: 168,           // 7 days - only fetch jobs posted in the last week
    isRemote: true,          // Always target remote positions
    descriptionFormat: 'markdown',  // Store descriptions as markdown for better display
    jobType: null            // All job types (full-time, part-time, contract)
  },
  
  // Primary search terms for administrative positions
  adminSearchTerms: [
    'administrative assistant remote',
    'virtual assistant remote',
    'remote administrative support',
    'remote office assistant',
    'remote executive assistant',
    'remote administrative coordinator',
    'remote admin specialist',
    'remote admin assistant',
    'remote secretary',
    'remote receptionist',
    'remote office coordinator',
    'remote office manager',
    'remote administrative clerk',
    'remote executive support',
  ],
  
  // Primary search terms for data entry positions
  dataEntrySearchTerms: [
    'remote data entry',
    'work from home data entry',
    'remote data processor',
    'remote data specialist',
    'remote data clerk',
    'remote data analyst',
    'remote transcriptionist',
    'remote data processing',
    'remote data management',
    'remote data administrator',
    'work from home transcription',
    'remote typing jobs',
    'remote data conversion',
    'remote data input specialist',
  ],
  
  // Related customer service terms (often overlap with admin work)
  customerServiceSearchTerms: [
    'remote customer service',
    'work from home customer support',
    'remote customer service representative',
    'remote call center',
    'remote help desk',
    'remote client services',
    'remote support specialist',
    'remote account coordinator',
  ],
  
  // Source-specific configuration
  sources: {
    indeed: {
      enabled: true,
      countryCode: "USA", // Default country
      distance: 100,     // Search radius in miles
      credibilityScore: 8,
      excludeTerms: ['senior', 'manager', 'director', 'lead', 'supervisor'], // Filter out higher-level positions
    },
    
    linkedin: {
      enabled: true,
      fetchDescription: true,  // Get full job descriptions
      credibilityScore: 8.5,
      excludeTerms: ['senior', 'manager', 'director', 'lead', 'supervisor'],
    },
    
    naukri: {
      enabled: true,
      location: 'Remote',
      credibilityScore: 7,
    },
    
    ziprecruiter: {
      enabled: true,
      credibilityScore: 7.5,
    },
    
    glassdoor: {
      enabled: false,  // Often has issues with JobSpy, disabled by default
      credibilityScore: 7,
    },
    
    bayt: {
      enabled: true,
      location: 'Remote',
      credibilityScore: 6.5,
    }
  },
  
  // Location variations to try (for sites that need location parameters)
  locations: [
    '',           // No location (fully remote)
    'Remote',
    'USA',
    'UK',
    'Canada',
    'Australia',
  ],
  
  // Job quality scoring weights
  qualityScoring: {
    // Keywords that indicate high-quality listings
    positiveKeywords: [
      'remote',
      'work from home',
      'virtual',
      'flexible schedule',
      'flexible hours',
      'part-time',
      'full-time',
      'entry level',
      'beginner friendly',
      'no experience',
      'training provided',
      'paid training',
    ],
    
    // Keywords that might indicate low-quality or scam listings
    negativeKeywords: [
      'MLM',
      'multi-level',
      'commission only',
      'unpaid',
      'upfront fee',
      'investment required',
      'buy',
      'purchase',
      'training fee',
      'certification required',
    ],
    
    // Weights for each component of the quality score
    weights: {
      relevanceScore: 0.35,      // How relevant to admin/data entry
      qualityIndicatorScore: 0.3, // Based on listing content quality
      credibilityScore: 0.25,     // Based on source reputation
      recencyScore: 0.1,          // How recently posted
    },
    
    // Minimum threshold to be considered a valid listing
    minQualityScore: 5.0,
    
    // Threshold for featured job status
    featuredThreshold: 7.5
  },
  
  // Regular expression patterns for identifying genuine admin/data entry roles
  patterns: {
    // Regex patterns for identifying admin jobs in titles/descriptions
    adminPatterns: [
      /\badministrative\s+assistant\b/i,
      /\badmin\s+assistant\b/i,
      /\bvirtual\s+assistant\b/i,
      /\bexecutive\s+assistant\b/i,
      /\boffice\s+assistant\b/i,
      /\breceptionist\b/i,
      /\bsecretary\b/i,
      /\boffice\s+coordinator\b/i,
      /\badmin\s+support\b/i,
      /\boffice\s+manager\b/i,
    ],
    
    // Regex patterns for identifying data entry jobs in titles/descriptions
    dataEntryPatterns: [
      /\bdata\s+entry\b/i,
      /\bdata\s+input\b/i,
      /\bdata\s+processor\b/i,
      /\bdata\s+clerk\b/i,
      /\btypist\b/i,
      /\btranscription\b/i,
      /\btranscriptionist\b/i,
      /\bdata\s+processing\b/i,
      /\btyping\b/i,
      /\bdata\s+specialist\b/i,
    ],
    
    // Regex patterns for identifying customer service jobs in titles/descriptions
    customerServicePatterns: [
      /\bcustomer\s+service\b/i,
      /\bcustomer\s+support\b/i,
      /\bclient\s+service\b/i,
      /\bcall\s+center\b/i,
      /\bhelp\s+desk\b/i,
      /\bcustomer\s+care\b/i,
      /\bsupport\s+specialist\b/i,
      /\bclient\s+coordinator\b/i,
    ],
    
    // Regex patterns for identifying remote status in titles/descriptions
    remotePatterns: [
      /\bremote\b/i,
      /\bwork\s+from\s+home\b/i,
      /\bwfh\b/i,
      /\bvirtual\b/i,
      /\btelecommute\b/i,
      /\bonline\b/i,
      /\banywhere\b/i,
    ]
  },
  
  // Filters for job processing
  filters: {
    // Min word count in the description to be considered valid
    minDescriptionLength: 100,
    
    // Exclude jobs with these terms in the title (case insensitive)
    excludeTitleTerms: [
      'senior',
      'sr.',
      'lead',
      'manager',
      'director',
      'head of',
      'chief',
      'principal',
      'consultant',
    ],
    
    // Exclude jobs with salaries outside these ranges
    salaryRange: {
      min: 10, // Minimum hourly rate or equivalent
      max: 35  // Maximum hourly rate or equivalent
    }
  },
  
  // Deduplication settings
  deduplication: {
    // Methods to use for deduplication
    methods: [
      'url',                 // Exact URL match
      'title_company',       // Same title and company
      'fuzzy_title_company', // Similar title and company (using Levenshtein distance)
      'content_similarity'   // Content similarity threshold
    ],
    
    // Threshold for fuzzy matching (0-1, where 1 is exact match)
    fuzzyMatchThreshold: 0.85,
    
    // Threshold for content similarity (0-1, where 1 is exact match)
    contentSimilarityThreshold: 0.8,
    
    // Fields to compare when checking for duplicates
    fieldsToCompare: [
      'title',
      'company',
      'location',
      'descriptionText'
    ]
  },
  
  // Scraping schedule
  schedule: {
    // How often to run the full scraper
    fullScrapeInterval: '0 */8 * * *',  // Every 8 hours
    
    // How often to run quick updates for the most important sources
    quickUpdateInterval: '0 */4 * * *', // Every 4 hours
    
    // Sources to include in quick updates
    quickUpdateSources: ['indeed', 'linkedin'],
    
    // Maximum concurrent scraping jobs
    concurrentScrapers: 2
  }
}; 