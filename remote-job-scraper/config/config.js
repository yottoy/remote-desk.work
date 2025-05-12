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
    indeed: {
      baseUrl: 'https://api.indeed.com/v2',
      apiKey: process.env.INDEED_API_KEY,
      queries: ['remote data entry', 'remote administrative assistant', 'remote customer service'],
      credibilityScore: 7
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
    concurrency: 3,
    rateLimitMs: 2000,
    retries: 3,
    timeout: 30000
  }
}; 