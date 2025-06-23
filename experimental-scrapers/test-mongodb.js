const MongoDBIntegration = require('./src/database/MongoDBIntegration');
const logger = require('./src/utils/logger');

/**
 * Test MongoDB integration
 */
async function testMongoDB() {
  try {
    logger.info('🧪 Testing MongoDB Integration');
    
    // Initialize MongoDB integration
    const mongodb = new MongoDBIntegration({
      connectionString: 'mongodb+srv://yotamt:***REMOVED***@cluster0.mjemntb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      databaseName: 'remote-desk-work',
      collectionName: 'jobs'
    });
    
    // Test connection
    logger.info('🔌 Testing connection...');
    const connected = await mongodb.testConnection();
    
    if (!connected) {
      logger.error('❌ Connection test failed');
      return false;
    }
    
    // Test saving sample jobs
    logger.info('💾 Testing job saving...');
    const sampleJobs = [
      {
        title: 'Test Virtual Assistant',
        company: 'Test Company',
        location: 'Remote',
        description: 'This is a test job for MongoDB integration',
        salary: '$15-20/hour',
        url: 'https://test.com/job/1',
        postedDate: new Date(),
        isRemote: true,
        credibilityScore: 8
      },
      {
        title: 'Test Data Entry Specialist',
        company: 'Another Test Company',
        location: 'Work from Home',
        description: 'Another test job for verification',
        salary: '$12-18/hour',
        url: 'https://test.com/job/2',
        postedDate: new Date(),
        isRemote: true,
        credibilityScore: 9
      }
    ];
    
    const saveResults = await mongodb.saveJobs(sampleJobs, 'test-integration');
    
    logger.info('📊 Save Results:');
    logger.info(`   Saved: ${saveResults.saved}`);
    logger.info(`   Duplicates: ${saveResults.duplicates}`);
    logger.info(`   Errors: ${saveResults.errors}`);
    
    // Get updated stats
    logger.info('📈 Getting database stats...');
    const stats = await mongodb.getStats();
    
    if (stats) {
      logger.info('📊 Database Statistics:');
      logger.info(`   Total jobs: ${stats.totalJobs}`);
      logger.info(`   Experimental jobs: ${stats.experimentalJobs}`);
      logger.info(`   Recent jobs (24h): ${stats.recentJobs}`);
      logger.info('   Source breakdown:');
      stats.sourceBreakdown.forEach(source => {
        logger.info(`     ${source._id}: ${source.count} jobs`);
      });
    }
    
    // Clean up test data
    logger.info('🧹 Cleaning up test data...');
    await mongodb.collection.deleteMany({ source: 'test-integration' });
    logger.info('✅ Test data cleaned up');
    
    // Disconnect
    await mongodb.disconnect();
    
    logger.info('🎉 MongoDB integration test completed successfully!');
    return true;
    
  } catch (error) {
    logger.error(`❌ MongoDB test failed: ${error.message}`);
    return false;
  }
}

// Run test if called directly
if (require.main === module) {
  testMongoDB()
    .then((success) => {
      if (success) {
        logger.info('✅ All tests passed!');
        process.exit(0);
      } else {
        logger.error('❌ Tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error(`Test error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = testMongoDB; 