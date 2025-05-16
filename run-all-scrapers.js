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

// Execute Python code to verify numpy.rec is available
function verifyNumpyRec() {
  const verifyScript = `
import numpy
try:
    import numpy.rec
    print("SUCCESS: numpy.rec module is available in version", numpy.__version__)
    exit(0)
except ImportError:
    print("ERROR: numpy.rec module NOT available in version", numpy.__version__)
    exit(1)
`;
  
  fs.writeFileSync('verify_numpy_rec.py', verifyScript);
  return runCommand('python3', ['verify_numpy_rec.py']);
}

// Main function
async function main() {
  try {
    log('Starting job scraper script');
    
    // First completely uninstall both packages to ensure a clean state
    log('Completely removing existing packages...');
    try {
      await runCommand('pip3', ['uninstall', '-y', 'numpy', 'jobspy', 'python-jobspy']);
    } catch (error) {
      log(`Failed to uninstall with pip3, trying pip: ${error.message}`);
      await runCommand('pip', ['uninstall', '-y', 'numpy', 'jobspy', 'python-jobspy']);
    }
    
    // Then install numpy 1.26.3 which specifically includes the numpy.rec module
    log('Installing numpy 1.26.3 which includes the numpy.rec module...');
    try {
      await runCommand('pip3', ['install', '--upgrade', 'numpy==1.26.3']);
      log('Successfully installed numpy 1.26.3');
    } catch (error) {
      log(`Failed to install numpy with pip3, trying pip: ${error.message}`);
      await runCommand('pip', ['install', '--upgrade', 'numpy==1.26.3']);
      log('Successfully installed numpy 1.26.3 using pip');
    }
    
    // Verify numpy.rec module is available before proceeding
    log('Verifying numpy.rec module is available...');
    try {
      await verifyNumpyRec();
      log('✅ Verification successful: numpy.rec module is available');
    } catch (error) {
      log(`⚠️ Verification failed: numpy.rec module not available in numpy 1.26.3`);
      log('Attempting to reinstall with a different version...');
      
      // Try installing numpy 1.24.3 as fallback
      try {
        await runCommand('pip3', ['install', '--force-reinstall', 'numpy==1.24.3']);
        await verifyNumpyRec();
        log('✅ Verification successful after installing numpy 1.24.3');
      } catch (err) {
        log(`⚠️ Falling back to numpy 1.22.4 which has numpy.rec module...`);
        await runCommand('pip3', ['install', '--force-reinstall', 'numpy==1.22.4']);
        try {
          await verifyNumpyRec();
          log('✅ Verification successful after installing numpy 1.22.4');
        } catch (finalError) {
          log(`⚠️ All attempts to install numpy with rec module failed. This will likely cause issues.`);
        }
      }
    }
    
    // Now install jobspy with compatibility settings
    log('Installing jobspy...');
    try {
      await runCommand('pip3', ['install', 'jobspy==0.29.0', '--no-dependencies']);
      log('Successfully installed jobspy 0.29.0 without extra dependencies');
      
      // Install additional dependencies that jobspy needs (but not numpy)
      await runCommand('pip3', ['install', 'redis>=3.0.0', 'beautifulsoup4>=4.12.2', 'pandas>=2.1.0']);
    } catch (error) {
      log(`Failed to install jobspy with pip3, trying pip: ${error.message}`);
      await runCommand('pip', ['install', 'jobspy==0.29.0', '--no-dependencies']);
      await runCommand('pip', ['install', 'redis>=3.0.0', 'beautifulsoup4>=4.12.2', 'pandas>=2.1.0']);
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
