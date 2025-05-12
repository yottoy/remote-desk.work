require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    // Log the connection string (mask part of the password)
    const hiddenUri = process.env.MONGODB_URI.replace(/(?<=:)([^:]+)(?=@)/, '****');
    console.log(`MongoDB URI: ${hiddenUri}`);
    
    logger.info('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB!');
    logger.info('✅ Successfully connected to MongoDB!');
    
    // Get database stats
    const db = mongoose.connection.db;
    console.log('Connected to database:', db.databaseName);
    const stats = await db.stats();
    console.log('Collections:', stats.collections);
    console.log('Documents:', stats.objects);
    
    return mongoose.connection;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    logger.error(`❌ MongoDB connection error: ${error.message}`);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
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