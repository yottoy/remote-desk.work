// Simple test script for GitHub Actions environment
console.log('=== TESTING GITHUB ACTIONS ENVIRONMENT ===');
console.log(`Current time: ${new Date().toUTCString()}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);
console.log(`Operating system: ${process.platform}`);

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Bridge URL
const BRIDGE_URL = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';

// Check Python environment
try {
  console.log('\n=== CHECKING PYTHON ENVIRONMENT ===');
  const pythonVersion = execSync('python --version', { encoding: 'utf8' }).trim();
  console.log(`Python version: ${pythonVersion}`);
  
  // List installed packages
  console.log('\n=== PYTHON PACKAGES ===');
  const packages = execSync('pip list', { encoding: 'utf8' });
  console.log(packages);
  
  // Check for critical packages
  const requiredPackages = ['uvicorn', 'fastapi', 'jobspy', 'pandas'];
  let missingPackages = [];
  
  for (const pkg of requiredPackages) {
    if (!packages.includes(pkg)) {
      missingPackages.push(pkg);
    }
  }
  
  if (missingPackages.length > 0) {
    console.error(`Missing required packages: ${missingPackages.join(', ')}`);
    // Try to install them
    console.log(`Installing missing packages: ${missingPackages.join(' ')}`);
    execSync(`pip install ${missingPackages.join(' ')}`, { encoding: 'utf8' });
  } else {
    console.log('All required Python packages are installed');
  }
} catch (error) {
  console.error(`Error checking Python environment: ${error.message}`);
}

// Try to start the bridge
async function startBridge() {
  console.log('\n=== STARTING JOBSPY BRIDGE ===');
  
  try {
    // Check if bridge is already running
    try {
      const response = await axios.get(`${BRIDGE_URL}/health`, { timeout: 2000 });
      if (response.status === 200) {
        console.log('Bridge is already running');
        return true;
      }
    } catch (error) {
      console.log('Bridge is not running, attempting to start...');
    }
    
    // Start the bridge in background
    const bridgeProcess = spawn('python', ['jobspy_bridge.py'], {
      detached: true,
      stdio: 'pipe'
    });
    
    bridgeProcess.stdout.on('data', (data) => {
      console.log(`Bridge output: ${data}`);
    });
    
    bridgeProcess.stderr.on('data', (data) => {
      console.error(`Bridge error: ${data}`);
    });
    
    // Unref the process to allow it to run independently
    bridgeProcess.unref();
    
    // Wait a bit for the bridge to start
    console.log('Waiting 5 seconds for bridge to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if bridge is running now
    try {
      const response = await axios.get(`${BRIDGE_URL}/health`, { timeout: 2000 });
      if (response.status === 200) {
        console.log('Bridge started successfully');
        console.log(`Response: ${JSON.stringify(response.data)}`);
        return true;
      }
    } catch (error) {
      console.error(`Bridge health check failed: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error starting bridge: ${error.message}`);
    return false;
  }
}

// Test a basic scrape request
async function testScrape() {
  console.log('\n=== TESTING BASIC SCRAPE ===');
  
  try {
    const response = await axios.post(`${BRIDGE_URL}/scrape-jobs`, {
      site_name: 'indeed',
      search_term: 'remote data entry',
      location: 'Remote',
      results_wanted: 1,
      hours_old: 24,
      is_remote: true
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log(`Scrape response status: ${response.status}`);
    console.log(`Found ${response.data.length || 0} jobs`);
    
    if (response.data && response.data.length > 0) {
      // Save the result to a file
      fs.writeFileSync('github-test-result.json', JSON.stringify(response.data, null, 2));
      console.log('Saved test result to github-test-result.json');
    }
    
    return true;
  } catch (error) {
    console.error(`Scrape test failed: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  let success = false;
  
  // Start the bridge
  const bridgeStarted = await startBridge();
  
  if (bridgeStarted) {
    // Test a basic scrape
    success = await testScrape();
  } else {
    console.error('Failed to start JobSpy bridge');
  }
  
  // Exit with appropriate code
  if (success) {
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    process.exit(0);
  } else {
    console.error('\n=== TEST FAILED ===');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 