const testRemoteJobsScraper = require('./test-remote-jobs');
const testOnlineJobsPhScraper = require('./test-online-jobs');
const logger = require('../src/utils/logger');

async function runAllTests() {
  logger.info('Starting comprehensive scraper tests');
  
  const results = {
    remotejobs: { success: false, jobs: 0, error: null },
    onlinejobs: { success: false, jobs: 0, error: null }
  };

  // Test RemoteJobs.com scraper
  try {
    logger.info('\n=== Testing RemoteJobs.com Scraper ===');
    const remoteJobsResults = await testRemoteJobsScraper();
    results.remotejobs.success = true;
    results.remotejobs.jobs = remoteJobsResults?.length || 0;
  } catch (error) {
    logger.error(`RemoteJobs.com test failed: ${error.message}`);
    results.remotejobs.error = error.message;
  }

  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test OnlineJobs.ph scraper
  try {
    logger.info('\n=== Testing OnlineJobs.ph Scraper ===');
    const onlineJobsResults = await testOnlineJobsPhScraper();
    results.onlinejobs.success = true;
    results.onlinejobs.jobs = onlineJobsResults?.length || 0;
  } catch (error) {
    logger.error(`OnlineJobs.ph test failed: ${error.message}`);
    results.onlinejobs.error = error.message;
  }

  // Summary
  logger.info('\n=== Test Summary ===');
  logger.info(`RemoteJobs.com: ${results.remotejobs.success ? 'SUCCESS' : 'FAILED'} - ${results.remotejobs.jobs} jobs`);
  if (results.remotejobs.error) {
    logger.error(`  Error: ${results.remotejobs.error}`);
  }
  
  logger.info(`OnlineJobs.ph: ${results.onlinejobs.success ? 'SUCCESS' : 'FAILED'} - ${results.onlinejobs.jobs} jobs`);
  if (results.onlinejobs.error) {
    logger.error(`  Error: ${results.onlinejobs.error}`);
  }

  const totalJobs = results.remotejobs.jobs + results.onlinejobs.jobs;
  const successCount = (results.remotejobs.success ? 1 : 0) + (results.onlinejobs.success ? 1 : 0);
  
  logger.info(`\nOverall: ${successCount}/2 scrapers successful, ${totalJobs} total jobs found`);

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then((results) => {
      const hasFailures = !results.remotejobs.success || !results.onlinejobs.success;
      process.exit(hasFailures ? 1 : 0);
    })
    .catch((error) => {
      logger.error(`Test suite failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = runAllTests; 