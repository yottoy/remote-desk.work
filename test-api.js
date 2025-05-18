// Test script for the API endpoints
require('dotenv').config();
const https = require('https');
const http = require('http');

// Function to make HTTP/HTTPS requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: resp.statusCode, data: parsedData });
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testApi() {
  const baseUrl = 'http://localhost:3001';
  console.log(`Testing API at: ${baseUrl}`);
  
  try {
    // Test the jobs list API
    console.log('\nTesting jobs list API...');
    const jobsResponse = await makeRequest(`${baseUrl}/api/jobs?limit=3`);
    
    if (jobsResponse.status === 200 && jobsResponse.data.jobs && jobsResponse.data.jobs.length > 0) {
      console.log(`✅ Jobs list API working - found ${jobsResponse.data.jobs.length} jobs`);
      console.log('Sample jobs:');
      jobsResponse.data.jobs.forEach((job, i) => {
        console.log(`Job ${i+1}: ${job.title} | ID: ${job._id} | URL: ${job.url || 'N/A'}`);
      });
      
      // Test the job detail API with the first job ID
      const jobId = jobsResponse.data.jobs[0]._id;
      console.log(`\nTesting job detail API with ID: ${jobId}...`);
      
      try {
        const jobDetailResponse = await makeRequest(`${baseUrl}/api/jobs/${jobId}`);
        
        if (jobDetailResponse.status === 200) {
          console.log('✅ Job detail API working - found job details');
          console.log(`Title: ${jobDetailResponse.data.title}`);
          console.log(`Company: ${jobDetailResponse.data.company}`);
          console.log(`URL: ${jobDetailResponse.data.url || 'N/A'}`);
        } else {
          console.log(`❌ Job detail API failed - status: ${jobDetailResponse.status}`);
          console.log('Response:', jobDetailResponse.data);
        }
      } catch (detailError) {
        console.error('Error testing job detail API:', detailError.message);
      }
    } else {
      console.log('❌ Jobs list API not working as expected');
      console.log('Status:', jobsResponse.status);
      console.log('Response:', jobsResponse.data);
    }
  } catch (error) {
    console.error('API test error:', error.message);
  }
}

// Run the tests
testApi(); 