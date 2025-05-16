// Test script for the direct Python scraper
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting direct scraper test...');

// Create directories if they don't exist
const dirs = ['logs', 'results'];
for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Execute the Python script directly for testing
const pythonProcess = spawn('python3', ['direct_scraper.py'], {
  stdio: 'inherit',
  env: { ...process.env, PYTHONUNBUFFERED: '1' }
});

pythonProcess.on('close', (code) => {
  console.log(`Python process exited with code ${code}`);
  
  // Check if we have results
  const resultsPath = path.join(__dirname, 'results', 'combined-results.json');
  if (fs.existsSync(resultsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      const jobCount = data.total_jobs || 0;
      console.log(`Found ${jobCount} jobs`);
      
      if (jobCount > 0) {
        console.log('TEST PASSED: Jobs were found!');
      } else {
        console.log('TEST WARNING: No jobs found, but file was created');
      }
    } catch (error) {
      console.error(`Error reading results: ${error.message}`);
      console.log('TEST FAILED: Error reading results file');
    }
  } else {
    console.error('Results file not found');
    console.log('TEST FAILED: No results file was created');
  }
  
  // List all log files for debugging
  console.log('\nLog files:');
  if (fs.existsSync('logs')) {
    const logFiles = fs.readdirSync('logs');
    console.log(logFiles);
  }
  
  // List all result files
  console.log('\nResult files:');
  if (fs.existsSync('results')) {
    const resultFiles = fs.readdirSync('results');
    console.log(resultFiles);
  }
  
  process.exit(code);
});

pythonProcess.on('error', (error) => {
  console.error(`Failed to start Python process: ${error.message}`);
  console.log('TEST FAILED: Could not start Python process');
  process.exit(1);
}); 