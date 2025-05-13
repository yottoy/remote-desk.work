require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');

async function testConnection() {
  try {
    logger.info('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Successfully connected to MongoDB!');
    return mongoose.connection;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('MongoDB connection closed');
  }
}

testConnection()
  .then(() => {
    console.log('Connection test completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Connection test failed:', error);
    process.exit(1);
  });
