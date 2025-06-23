const RemoteJobsNewsletterMonitor = require('../src/newsletter/RemoteJobsNewsletterMonitor');
const logger = require('../src/utils/logger');

async function testNewsletterMonitor() {
  logger.info('Starting RemoteJobs.com Newsletter Monitor test');
  
  const monitor = new RemoteJobsNewsletterMonitor({
    emailProvider: 'gmail',
    checkInterval: 3600000, // 1 hour
    maxEmailsToCheck: 10
  });

  try {
    // Test newsletter subscription information
    logger.info('\n=== Testing Newsletter Subscription ===');
    const subscriptionInfo = await monitor.subscribeToNewsletter('test@example.com');
    
    // Test email parsing with sample content
    logger.info('\n=== Testing Email Parsing ===');
    const sampleEmailContent = `
      Subject: The Week's Latest Remote Jobs - RemoteJobs.com

      Hi there!

      Here are this week's latest remote job opportunities:

      Hypermode—Senior/Staff Front-end Engineer North America 1 hour ago $100k+,Full-time,Development

      Altium—Senior Product Marketing Manager North America 6 hours ago $100k+,Full-time,Marketing

      GR0—Freelance Ad Designer North America 2 days ago $50k-$75k,Freelance,Design

      Rula—Director of Finance Systems North America 2 days ago $100k+,Full-time,Finance

      Carrot Fertility—Director of Communications North America 5 days ago $100k+,Full-time,Marketing

      View all jobs: https://remotejobs.com

      Best regards,
      The RemoteJobs.com Team
    `;
    
    const parsedJobs = monitor.parseNewsletterJobs(sampleEmailContent);
    
    logger.info(`Parsed ${parsedJobs.length} jobs from sample newsletter email`);
    
    if (parsedJobs.length > 0) {
      logger.info('\n=== Parsed Newsletter Jobs ===');
      parsedJobs.forEach((job, index) => {
        logger.info(`\n--- Newsletter Job ${index + 1} ---`);
        logger.info(`Title: ${job.title}`);
        logger.info(`Company: ${job.company}`);
        logger.info(`Location: ${job.location}`);
        logger.info(`Salary: ${job.salary || 'Not specified'}`);
        logger.info(`Source: ${job.source}`);
        logger.info(`Credibility Score: ${job.credibilityScore}`);
        logger.info(`Is Remote: ${job.isRemote}`);
      });
    }
    
    // Test monitoring setup
    logger.info('\n=== Testing Monitoring Setup ===');
    const monitoringInfo = await monitor.startMonitoring({
      email: 'test@example.com',
      provider: 'gmail'
    });
    
    // Test status
    logger.info('\n=== Testing Status Check ===');
    const status = monitor.getStatus();
    logger.info(`Monitoring Status: ${JSON.stringify(status, null, 2)}`);
    
    // Stop monitoring
    monitor.stopMonitoring();
    
    // Test with different email patterns
    logger.info('\n=== Testing Different Email Patterns ===');
    const alternativeEmailContent = `
      **Senior Developer** at TechCorp (Remote) - $120k-150k
      **Marketing Manager** at StartupXYZ (North America) - $80k-100k
      **Designer** at CreativeAgency (Europe) - €60k-80k
      
      More jobs at: https://remotejobs.com/jobs/techcorp-senior-developer
    `;
    
    const alternativeParsedJobs = monitor.parseNewsletterJobs(alternativeEmailContent);
    logger.info(`Parsed ${alternativeParsedJobs.length} jobs from alternative email format`);
    
    if (alternativeParsedJobs.length > 0) {
      logger.info('\n=== Alternative Format Jobs ===');
      alternativeParsedJobs.forEach((job, index) => {
        logger.info(`\n--- Alt Job ${index + 1} ---`);
        logger.info(`Title: ${job.title}`);
        logger.info(`Company: ${job.company}`);
        logger.info(`Location: ${job.location}`);
        logger.info(`Salary: ${job.salary || 'Not specified'}`);
        logger.info(`URL: ${job.url || 'No URL'}`);
      });
    }
    
    // Save results
    const fs = require('fs');
    const path = require('path');
    
    const resultsDir = path.join(__dirname, '../results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `newsletter-monitor-test-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);
    
    const testResults = {
      metadata: {
        testDate: new Date().toISOString(),
        testType: 'newsletter-monitor',
        version: '1.0'
      },
      subscriptionInfo: subscriptionInfo,
      monitoringInfo: monitoringInfo,
      sampleParsing: {
        originalFormat: {
          emailContent: sampleEmailContent,
          parsedJobs: parsedJobs,
          jobCount: parsedJobs.length
        },
        alternativeFormat: {
          emailContent: alternativeEmailContent,
          parsedJobs: alternativeParsedJobs,
          jobCount: alternativeParsedJobs.length
        }
      },
      status: status
    };
    
    fs.writeFileSync(filepath, JSON.stringify(testResults, null, 2));
    logger.info(`\nNewsletter monitor test results saved to: ${filepath}`);
    
    return testResults;
    
  } catch (error) {
    logger.error(`Newsletter monitor test failed: ${error.message}`);
    logger.error(error.stack);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testNewsletterMonitor()
    .then((results) => {
      logger.info(`Newsletter monitor test completed successfully`);
      logger.info(`Total jobs parsed: ${results.sampleParsing.originalFormat.jobCount + results.sampleParsing.alternativeFormat.jobCount}`);
      process.exit(0);
    })
    .catch((error) => {
      logger.error(`Newsletter monitor test failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = testNewsletterMonitor; 