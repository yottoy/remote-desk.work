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
    
    // First install a compatible numpy version that includes numpy.rec
    log('Installing compatible numpy version...');
    
    try {
      await runCommand('pip3', ['install', 'numpy==1.24.3', '-U', '--force-reinstall']);
      log('Successfully installed numpy 1.24.3');
    } catch (error) {
      log(`Failed to install numpy with pip3, trying pip: ${error.message}`);
      await runCommand('pip', ['install', 'numpy==1.24.3', '-U', '--force-reinstall']);
      log('Successfully installed numpy 1.24.3 using pip');
    }
    
    // Then install jobspy to ensure it's available
    log('Installing jobspy...');
    try {
      await runCommand('pip3', ['install', 'jobspy==0.29.0', '-U']);
    } catch (error) {
      log(`Failed to install jobspy with pip3, trying pip: ${error.message}`);
      await runCommand('pip', ['install', 'jobspy==0.29.0', '-U']);
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
