require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB!');
    
    // Get connection stats
    const db = mongoose.connection.db;
    const stats = await db.stats();
    console.log('Database stats:', JSON.stringify(stats, null, 2));
    
    return mongoose.connection;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
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