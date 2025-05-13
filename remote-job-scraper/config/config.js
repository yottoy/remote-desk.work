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
      credibilityScore: 9
    },
    remoteco: {
      baseUrl: 'https://remote.co',
      categories: ['data-entry-jobs', 'virtual-assistant-jobs', 'customer-service-jobs'],
      credibilityScore: 8
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
        'data entry',
        'administrative assistant',
        'admin assistant',
        'customer service',
        'virtual assistant',
        'remote admin'
      ],
      medium: [
        'clerk',
        'secretary',
        'receptionist',
        'typist',
        'transcription',
        'support'
      ]
    }
  },
  database: {
    ttlDays: parseInt(process.env.TTL_DAYS) || 30
  },
  scraping: {
    maxRetries: 3,
    retryDelay: 5000,
    timeout: 30000,
    concurrency: 2
  },
  filtering: {
    minQualityScore: 6,
    maxJobAgeDays: 30,
    exclusionKeywords: [
      'scam', 'mlm', 'pyramid', 'investment required', 'work from home scam',
      'pay to work', 'no experience necessary', 'make money fast'
    ],
    inclusionKeywords: [
      'remote', 'data entry', 'virtual assistant', 'admin', 'administrative',
      'customer service', 'support', 'work from home'
    ]
  }
}; 