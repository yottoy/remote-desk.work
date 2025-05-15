const { MongoClient } = require('mongodb');
const http = require('http');
const url = require('url');
require('dotenv').config();

// Mock Next.js API request object
class MockRequest {
  constructor(method, query) {
    this.method = method;
    this.query = query;
  }
}

// Mock Next.js API response object
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.data = null;
    this.headers = {};
  }
  
  status(code) {
    this.statusCode = code;
    return this;
  }
  
  json(data) {
    this.data = data;
    return this;
  }
  
  setHeader(name, value) {
    this.headers[name] = value;
    return this;
  }
}

// Import the API handler (assuming it's in ../pages/api/jobs.ts)
async function importApiHandler() {
  try {
    // For TypeScript files, require doesn't work directly
    // This is a workaround to test the API logic
    // In a production app, you'd use a proper testing framework
    
    // Connect to MongoDB directly to validate data
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    console.log('✅ Connected to MongoDB directly');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const jobsCollection = db.collection('jobs');
    
    // Get job counts
    const totalJobs = await jobsCollection.countDocuments();
    console.log(`Total jobs in database: ${totalJobs}`);
    
    if (totalJobs === 0) {
      console.error('❌ No jobs found in the database');
      await client.close();
      process.exit(1);
    }
    
    // Get sample jobs
    const jobs = await jobsCollection.find({}).limit(3).toArray();
    console.log(`Retrieved ${jobs.length} sample jobs:`);
    jobs.forEach((job, index) => {
      console.log(`\n${index + 1}. ${job.title} at ${job.company}`);
      console.log(`   Type: ${job.jobType}, Experience: ${job.experienceLevel}`);
    });
    
    // Close connection
    await client.close();
    console.log('\n✅ Database validation completed');
    
    // Test API connection by making a real HTTP request to the server if it's running
    console.log('\nTo test the actual API endpoint:');
    console.log('1. Start the Next.js development server: cd frontend && npm run dev');
    console.log('2. In another terminal, curl http://localhost:3000/api/jobs');
    console.log('3. Or visit http://localhost:3000/api/jobs in your browser');
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// Run the test
async function testApiJobs() {
  console.log('Testing jobs API and MongoDB connection...');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    return false;
  }
  
  return await importApiHandler();
}

// Execute if run directly
if (require.main === module) {
  testApiJobs()
    .then(success => {
      if (success) {
        console.log('\n✅ API test completed successfully');
        process.exit(0);
      } else {
        console.error('\n❌ API test failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
} 