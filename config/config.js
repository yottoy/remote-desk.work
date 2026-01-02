require('dotenv').config();

module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/remote-jobs',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || 'logs'
  },
  sources: {
    weworkremotely: {
      baseUrl: 'https://weworkremotely.com',
      categories: ['customer-service', 'administrative', 'virtual-admin'],
      credibilityScore: 9,
      enabled: true
    },
    remoteco: {
      baseUrl: 'https://remote.co',
      categories: ['data-entry-jobs', 'virtual-assistant-jobs', 'customer-service-jobs'],
      credibilityScore: 8,
      enabled: true
    },
    remoteio: {
      baseUrl: 'https://www.remote.io',
      categories: ['Admin and Assistants', 'Customer Service', 'Data'],
      credibilityScore: 8
    },
    workew: {
      baseUrl: 'https://workew.com',
      categories: ['Support', 'Others', 'Operations'],
      credibilityScore: 7.5
    },
    virtualvocations: {
      baseUrl: 'https://www.virtualvocations.com',
      categories: ['Data Entry', 'Administrative Assistant', 'Virtual Assistant'],
      credibilityScore: 9
    },
    indeed: {
      enabled: process.env.ENABLE_INDEED_SCRAPER === 'true' || false,
      baseUrl: 'https://api.indeed.com/ads',
      apiKey: process.env.INDEED_API_KEY || '',
      queries: [
        'data entry remote',
        'administrative assistant remote',
        'virtual assistant remote',
        'customer service representative remote'
      ],
      credibilityScore: 8
    },
    monster: {
      enabled: process.env.ENABLE_MONSTER_SCRAPER === 'true' || false,
      baseUrl: 'https://api.jobs.com/v3',
      apiKey: process.env.MONSTER_API_KEY || '',
      queries: [
        'remote data entry',
        'remote administrative assistant',
        'remote virtual assistant',
        'remote customer service representative'
      ],
      maxJobsPerQuery: 100,
      jobType: 'FullTime',
      credibilityScore: 8
    },
    jobspy_indeed: {
      enabled: process.env.ENABLE_JOBSPY_INDEED === 'true' || false,
      queries: [
        // PRIORITY 1: High-value categories with proven search demand
        'data processing remote',
        'data processing jobs from home',
        'remote data processing jobs',
        'captioning jobs',
        'captioning jobs remote',
        'transcription jobs remote',
        // Standard queries
        'data entry remote',
        'administrative assistant remote', 
        'virtual assistant remote',
        'customer service representative remote'
      ],
      location: 'Remote',
      country: 'USA',
      resultsWanted: 50,
      hoursOld: 72,
      isRemote: true,
      distance: 50,
      credibilityScore: 9,
      // Optional proxies for bypassing rate limits
      proxies: process.env.JOBSPY_PROXIES ? process.env.JOBSPY_PROXIES.split(',') : null
    },
    jobspy_linkedin: {
      enabled: process.env.ENABLE_JOBSPY_LINKEDIN === 'true' || false,
      queries: [
        // PRIORITY 1: High-value categories
        'data processing remote',
        'captioning jobs remote',
        'closed captioning remote',
        'transcription remote',
        // Standard queries
        'data entry remote',
        'administrative assistant remote', 
        'virtual assistant remote',
        'customer service representative remote'
      ],
      location: 'Remote',
      resultsWanted: 50,
      hoursOld: 72,
      isRemote: true,
      distance: 50,
      credibilityScore: 9,
      fetchDescription: true,
      descriptionFormat: 'markdown',
      // Optional proxies for bypassing rate limits
      proxies: process.env.JOBSPY_PROXIES ? process.env.JOBSPY_PROXIES.split(',') : null
    },
    jobspy_glassdoor: {
      enabled: process.env.ENABLE_JOBSPY_GLASSDOOR === 'true' || false,
      queries: [
        'data entry remote',
        'administrative assistant remote', 
        'virtual assistant remote',
        'customer service representative remote'
      ],
      location: 'Remote',
      resultsWanted: 50,
      hoursOld: 72,
      isRemote: true,
      distance: 50,
      credibilityScore: 8,
      descriptionFormat: 'markdown',
      // Optional proxies for bypassing rate limits
      proxies: process.env.JOBSPY_PROXIES ? process.env.JOBSPY_PROXIES.split(',') : null
    },
    jobspy_google: {
      enabled: process.env.ENABLE_JOBSPY_GOOGLE === 'true' || false,
      queries: [
        'data entry remote',
        'administrative assistant remote', 
        'virtual assistant remote',
        'customer service representative remote'
      ],
      location: 'Remote',
      resultsWanted: 50,
      hoursOld: 72,
      isRemote: true,
      distance: 50,
      credibilityScore: 8,
      descriptionFormat: 'markdown',
      // Optional proxies for bypassing rate limits
      proxies: process.env.JOBSPY_PROXIES ? process.env.JOBSPY_PROXIES.split(',') : null
    },
    jobspy_ziprecruiter: {
      enabled: process.env.ENABLE_JOBSPY_ZIPRECRUITER === 'true' || false,
      queries: [
        'data entry remote',
        'administrative assistant remote', 
        'virtual assistant remote',
        'customer service representative remote'
      ],
      location: 'Remote',
      resultsWanted: 50,
      hoursOld: 72,
      isRemote: true,
      distance: 50,
      credibilityScore: 7,
      descriptionFormat: 'markdown',
      // Optional proxies for bypassing rate limits
      proxies: process.env.JOBSPY_PROXIES ? process.env.JOBSPY_PROXIES.split(',') : null
    },
    jobspy_bayt: {
      enabled: process.env.ENABLE_JOBSPY_BAYT === 'true' || false,
      queries: [
        'data entry remote',
        'administrative assistant remote', 
        'virtual assistant remote',
        'customer service representative remote'
      ],
      location: 'Remote',
      resultsWanted: 50,
      hoursOld: 72,
      isRemote: true,
      distance: 50,
      credibilityScore: 7,
      descriptionFormat: 'markdown',
      // Optional proxies for bypassing rate limits
      proxies: process.env.JOBSPY_PROXIES ? process.env.JOBSPY_PROXIES.split(',') : null
    },
    jobspy_naukri: {
      enabled: process.env.ENABLE_JOBSPY_NAUKRI === 'true' || false,
      queries: [
        'data entry remote',
        'administrative assistant remote', 
        'virtual assistant remote',
        'customer service representative remote'
      ],
      location: 'Remote, India',
      resultsWanted: 50,
      hoursOld: 72,
      isRemote: true,
      distance: 50,
      credibilityScore: 7,
      descriptionFormat: 'markdown',
      // Optional proxies for bypassing rate limits
      proxies: process.env.JOBSPY_PROXIES ? process.env.JOBSPY_PROXIES.split(',') : null
    },
    upwork: {
      baseUrl: 'https://www.upwork.com',
      searches: [
        'data entry remote',
        'administrative assistant remote',
        'virtual assistant',
        'customer service remote'
      ],
      filters: {
        hourlyRate: 'hourly',
        jobType: 'fixed',
        experience: 'entry',
        duration: 'ongoing'
      },
      credibilityScore: 7,
      enabled: true
    },
    careerjet: {
      baseUrl: 'https://www.careerjet.com',
      searches: [
        'remote data entry',
        'remote administrative assistant',
        'remote virtual assistant',
        'remote customer service'
      ],
      credibilityScore: 6,
      enabled: true
    },
    companySites: {
      sites: [
        {
          name: 'Belay',
          url: 'https://belaysolutions.com/jobs/',
          credibilityScore: 9,
          enabled: true
        },
        {
          name: 'Boldly',
          url: 'https://boldly.com/jobs/',
          credibilityScore: 9,
          enabled: true
        },
        {
          name: 'VirtualVocations',
          url: 'https://www.virtualvocations.com/jobs',
          credibilityScore: 8,
          enabled: true
        }
      ]
    }
  },
  qualityScoring: {
    threshold: parseInt(process.env.QUALITY_THRESHOLD) || 5,
    featuredThreshold: parseInt(process.env.FEATURED_THRESHOLD) || 8,
    weights: {
      relevance: 0.4,
      quality: 0.3,
      credibility: 0.2,
      recency: 0.1
    },
    redFlags: [
      'mlm',
      'multi level marketing',
      'pyramid',
      'upfront fee',
      'pay to work',
      'investment required',
      '$1000/day'
    ],
    relevanceKeywords: {
      high: [
        // PRIORITY 1: High-value keywords (561+ impressions)
        'data processing',
        'data processor',
        'data analyst remote',
        'captioning',
        'captioner',
        'closed captioning',
        'subtitling',
        // Standard high-value keywords
        'data entry',
        'administrative assistant',
        'admin assistant',
        'customer service',
        'virtual assistant',
        'remote admin',
        'transcription',
        'transcriptionist'
      ],
      medium: [
        'clerk',
        'secretary',
        'receptionist',
        'typist',
        'support',
        'data specialist',
        'entry level remote'
      ]
    },
    // Exclude hyper-local and mis-targeted job sources
    excludedCompanyPatterns: [
      // Local businesses (Tony's Plumbing pattern)
      /\b(tony's?|joe's?|mike's?|bob's?)\s+(plumbing|restaurant|cafe|diner|pizza|bar|grill)/i,
      // Location + service type patterns
      /\b(modesto|henderson|miami|dallas|austin)\s+(plumbing|hvac|roofing|electrical|landscaping)/i,
      // Specific companies generating mis-targeted traffic
      /indulge\s+travels?/i,
      /talentify/i,
      // Generic local business patterns
      /\b(local|hometown)\s+(business|shop|store)/i,
      // Hyper-local indicators
      /must\s+(live|be\s+located)\s+(in|within|near)/i,
      // On-site only positions
      /\bon-?site\s+only/i,
      /no\s+remote\s+option/i
    ],
    // Exclude specific search queries (for filtering scraped results)
    excludedQueryPatterns: [
      'careers', // Filters out "[Company] careers" searches
      'reviews', // Filters out job board review searches
      'gsi umich', // Specific institutional searches
      'ccboe jobs', // School district jobs
      'plumbing modesto', // Hyper-local service searches
      'travels data entry' // Specific company searches like "indulge travels"
    ]
  },
  database: {
    ttlDays: parseInt(process.env.TTL_DAYS) || 30
  },
  scraping: {
    concurrency: 1,
    rateLimitMs: 15000,
    retries: 3,
    timeout: 60000,
    headless: false,
    slowMo: 150
  }
}; 