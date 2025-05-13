// Temporary config file for testing
module.exports = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/remote-jobs',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  sources: {
    upwork: {
      baseUrl: 'https://www.upwork.com',
      searches: [
        'data entry remote',
        'administrative assistant remote'
      ],
      filters: {
        hourlyRate: 'hourly',
        jobType: 'fixed',
        experience: 'entry',
        duration: 'ongoing'
      },
      credibilityScore: 7,
      enabled: true
    }
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