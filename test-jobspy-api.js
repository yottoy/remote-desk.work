const axios = require('axios');

/**
 * Simple test for JobSpy Bridge API
 */
async function testJobSpyAPI() {
  console.log('Testing JobSpy Bridge API');
  
  const bridgeUrl = 'http://localhost:8000';
  
  try {
    // Check if bridge is running
    console.log('Checking if bridge is running...');
    const statusResponse = await axios.get(bridgeUrl, { timeout: 5000 });
    
    if (statusResponse.status !== 200) {
      console.error('JobSpy bridge is not running properly');
      process.exit(1);
    }
    
    console.log('JobSpy bridge is running!');
    console.log(statusResponse.data);
    
    // Test a simple job search
    console.log('\nSending test search request...');
    
    const requestData = {
      search_terms: ['remote data entry'],
      location: 'Remote',
      results_wanted: 3,
      hours_old: 72,
      country_indeed: 'USA',
      is_remote: true
    };
    
    const searchResponse = await axios.post(`${bridgeUrl}/scrape-indeed`, requestData, {
      timeout: 300000 // 5 minutes timeout
    });
    
    const { jobs, count, metadata } = searchResponse.data;
    
    console.log(`\nFound ${count} jobs in ${metadata.duration_seconds.toFixed(2)} seconds`);
    
    if (count > 0) {
      console.log('\nSample job:');
      const sampleJob = jobs[0];
      console.log(`Title: ${sampleJob.title}`);
      console.log(`Company: ${sampleJob.company}`);
      console.log(`Location: ${sampleJob.location}`);
      console.log(`URL: ${sampleJob.job_url}`);
      
      // Save results to a file
      const fs = require('fs').promises;
      const path = require('path');
      
      const outputDir = path.join(process.cwd(), 'test-results');
      await fs.mkdir(outputDir, { recursive: true });
      
      const outputPath = path.join(outputDir, 'jobspy-api-test.json');
      await fs.writeFile(outputPath, JSON.stringify(jobs, null, 2));
      
      console.log(`\nResults saved to ${outputPath}`);
    } else {
      console.warn('No jobs found in the test search');
    }
    
  } catch (error) {
    console.error(`Error testing JobSpy API: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    process.exit(1);
  }
}

// Run the test
testJobSpyAPI().catch(console.error); 