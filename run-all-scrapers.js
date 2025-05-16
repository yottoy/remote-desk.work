#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Log with timestamp
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Run a command and return the promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running command: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, { 
      stdio: 'inherit',
      ...options 
    });
    
    process.on('error', (error) => {
      log(`Error executing command: ${error.message}`);
      reject(error);
    });
    
    process.on('close', (code) => {
      if (code !== 0) {
        log(`Command exited with code ${code}`);
        reject(new Error(`Command exited with code ${code}`));
      } else {
        log(`Command completed successfully`);
        resolve();
      }
    });
  });
}

// Main function
async function main() {
  try {
    log('Starting job scraper script');
    
    // First uninstall any existing numpy and jobspy installations
    log('Removing existing numpy and jobspy installations...');
    try {
      await runCommand('pip3', ['uninstall', 'numpy', 'jobspy', '-y']);
    } catch (error) {
      log(`Failed to uninstall with pip3, trying pip: ${error.message}`);
      await runCommand('pip', ['uninstall', 'numpy', 'jobspy', '-y']);
    }
    
    // Install a compatible numpy version that includes numpy.rec
    log('Installing compatible numpy version 1.24.3...');
    try {
      await runCommand('pip3', ['install', 'numpy==1.24.3']);
      log('Successfully installed numpy 1.24.3');
    } catch (error) {
      log(`Failed to install numpy with pip3, trying pip: ${error.message}`);
      await runCommand('pip', ['install', 'numpy==1.24.3']);
      log('Successfully installed numpy 1.24.3 using pip');
    }
    
    // Then install jobspy
    log('Installing jobspy...');
    try {
      await runCommand('pip3', ['install', 'jobspy==0.29.0']);
    } catch (error) {
      log(`Failed to install jobspy with pip3, trying pip: ${error.message}`);
      await runCommand('pip', ['install', 'jobspy==0.29.0']);
    }
    
    // Verify numpy installation has numpy.rec module
    log('Verifying numpy.rec module is available...');
    const verifyScript = `
import numpy
try:
    import numpy.rec
    print("numpy.rec module is available in numpy version", numpy.__version__)
    exit(0)
except ImportError:
    print("numpy.rec module NOT available in numpy version", numpy.__version__)
    exit(1)
`;
    
    fs.writeFileSync('verify_numpy_rec.py', verifyScript);
    
    try {
      await runCommand('python3', ['verify_numpy_rec.py']);
    } catch (error) {
      log(`ERROR: numpy.rec module verification failed! ${error.message}`);
      throw new Error('numpy.rec module not available after installation');
    }
    
    // Run the Python scraper
    log('Running direct_scraper.py...');
    await runCommand('python3', ['direct_scraper.py']);
    
    log('Job scraping completed successfully');
    process.exit(0);
  } catch (error) {
    log(`Error in job scraper: ${error.message}`);
    
    // Even if there's an error, try to create the results directory if needed
    try {
      if (!fs.existsSync('results')) {
        fs.mkdirSync('results', { recursive: true });
      }
      
      // Create a simple error report
      fs.writeFileSync('results/error-report.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      }, null, 2));
      
      log('Created error report at results/error-report.json');
    } catch (err) {
      log(`Failed to create error report: ${err.message}`);
    }
    
    process.exit(1);
  }
}

// Run the main function
main();
