/**
 * Simple script to test if the JobSpy bridge is running and functioning
 * Run this with: node test-bridge.js
 */

const axios = require('axios');

// Configuration
const BRIDGE_URL = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';

async function testBridge() {
  console.log('=== TESTING JOBSPY BRIDGE ===');
  console.log(`Using bridge URL: ${BRIDGE_URL}`);
  console.log(`Current time: ${new Date().toUTCString()}`);
  console.log(`Node version: ${process.version}`);
  
  try {
    // Step 1: Test health endpoint
    console.log('\n1. Testing /health endpoint...');
    try {
      const healthResponse = await axios.get(`${BRIDGE_URL}/health`, { timeout: 5000 });
      console.log(`Status: ${healthResponse.status}`);
      console.log(`Response: ${JSON.stringify(healthResponse.data)}`);
      console.log('✅ Health check PASSED');
    } catch (healthError) {
      console.error(`❌ Health check FAILED: ${healthError.message}`);
      console.error('Make sure the bridge is running with: python3 jobspy_bridge.py');
      throw healthError;
    }
    
    // Step 2: Test a simple scrape call without actually scraping
    console.log('\n2. Testing API structure...');
    try {
      const testResponse = await axios.post(`${BRIDGE_URL}/test`, {}, { timeout: 5000 });
      console.log(`Status: ${testResponse.status}`);
      console.log(`Response: ${JSON.stringify(testResponse.data)}`);
      console.log('✅ API structure test PASSED');
    } catch (testError) {
      console.warn(`⚠️ API structure test WARNING: ${testError.message}`);
      console.warn('The /test endpoint might not be implemented, but this is not critical');
    }
    
    // Step 3: Test if we can get available sites
    console.log('\n3. Testing available sites...');
    try {
      const sitesResponse = await axios.get(`${BRIDGE_URL}/sites`, { timeout: 5000 });
      console.log(`Status: ${sitesResponse.status}`);
      console.log(`Available sites: ${JSON.stringify(sitesResponse.data || [])}`);
      console.log('✅ Sites check PASSED');
    } catch (sitesError) {
      console.warn(`⚠️ Sites check WARNING: ${sitesError.message}`);
      console.warn('The /sites endpoint might not be implemented, but this is not critical');
    }
    
    // Step 4: Attempt a minimal scrape request to see if it's working
    console.log('\n4. Testing a minimal scrape request (this will not actually scrape)...');
    try {
      const scrapeResponse = await axios.post(`${BRIDGE_URL}/check-config`, {
        site_name: 'indeed',
        search_term: 'test',
        location: 'remote',
        results_wanted: 1
      }, { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000 
      });
      console.log(`Status: ${scrapeResponse.status}`);
      console.log(`Response: ${JSON.stringify(scrapeResponse.data || {})}`);
      console.log('✅ Scrape check PASSED');
    } catch (scrapeError) {
      console.warn(`⚠️ Scrape check WARNING: ${scrapeError.message}`);
      console.warn('The /check-config endpoint might not be implemented, but this is not critical');
      
      // Attempt real scrape as a fallback test
      console.log('\nAttempting a real scrape test (limited to 1 job)...');
      try {
        const realScrapeResponse = await axios.post(`${BRIDGE_URL}/scrape-jobs`, {
          site_name: 'indeed',
          search_term: 'data entry',
          location: 'remote',
          results_wanted: 1,
          hours_old: 24,
          is_remote: true
        }, { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000 // Give more time for actual scraping
        });
        
        if (realScrapeResponse.status === 200) {
          console.log(`Scrape received ${realScrapeResponse.data?.length || 0} jobs`);
          console.log('✅ Real scrape test PASSED');
        } else {
          console.error(`❌ Real scrape test FAILED with status: ${realScrapeResponse.status}`);
        }
      } catch (realScrapeError) {
        console.error(`❌ Real scrape test FAILED: ${realScrapeError.message}`);
      }
    }
    
    // Step 5: Check Python dependencies (if we can access this info)
    console.log('\n5. Checking for Python dependency information...');
    try {
      const depsResponse = await axios.get(`${BRIDGE_URL}/dependencies`, { timeout: 5000 });
      console.log(`Status: ${depsResponse.status}`);
      console.log(`Dependencies: ${JSON.stringify(depsResponse.data || {})}`);
      console.log('✅ Dependencies check PASSED');
    } catch (depsError) {
      console.warn(`⚠️ Dependencies check WARNING: ${depsError.message}`);
      console.warn('The /dependencies endpoint might not be implemented, but this is not critical');
    }
    
    console.log('\n=== BRIDGE TEST SUMMARY ===');
    console.log('✅ JobSpy bridge appears to be running and responding to requests');
    console.log('You can now try running the scraper scripts');
    
  } catch (error) {
    console.error('\n=== BRIDGE TEST FAILED ===');
    console.error(`Error: ${error.message}`);
    console.error('\nPossible solutions:');
    console.error('1. Make sure the JobSpy bridge is running with: python3 jobspy_bridge.py');
    console.error('2. Check if port 8000 is already in use by another application');
    console.error('3. Verify that you have all required Python packages installed:');
    console.error('   pip install jobspy fastapi uvicorn');
    console.error('4. Check if your firewall is blocking connections to port 8000');
    process.exit(1);
  }
}

// Run the test
testBridge(); 