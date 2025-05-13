/**
 * Script to run the entire job scraping pipeline:
 * 1. Start the Python bridge
 * 2. Wait for it to initialize
 * 3. Run the job scraper
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Simple logger
const logger = {
  info: (message) => console.log(`INFO: ${message}`),
  error: (message) => console.error(`ERROR: ${message}`),
  warn: (message) => console.warn(`WARNING: ${message}`)
};

// Configuration
const BRIDGE_PORT = process.env.JOBSPY_BRIDGE_PORT || 8000;
const BRIDGE_HOST = process.env.JOBSPY_BRIDGE_HOST || '127.0.0.1';
const TIMEOUT_MS = 30000; // 30 seconds timeout for bridge startup
const RETRY_INTERVAL_MS = 1000; // 1 second between retry attempts

// Store child processes for cleanup
const childProcesses = [];

// Wait for a specific amount of time
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if a port is in use
async function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const net = require('net');
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.close();
        resolve(false);
      })
      .listen(port, host);
  });
}

// Check if bridge is responding to HTTP requests
async function isBridgeResponding(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const req = http.get(`http://${host}:${port}/`, {
      timeout: 5000,
    }, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            // Check for expected response format
            if (response && response.message && response.message.includes('JobSpy Bridge API')) {
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (e) {
            resolve(false);
          }
        });
      } else {
        resolve(false);
      }
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Wait for the bridge to be ready
async function waitForBridge(maxWaitTimeMs = TIMEOUT_MS) {
  logger.info('Waiting for Python bridge to start...');
  
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTimeMs) {
    // First check if port is in use
    const portInUse = await isPortInUse(BRIDGE_PORT, BRIDGE_HOST);
    
    if (portInUse) {
      // Then check if it's responding properly
      const isResponding = await isBridgeResponding(BRIDGE_PORT, BRIDGE_HOST);
      
      if (isResponding) {
        logger.info('Bridge is running and responding properly!');
        return true;
      }
      
      logger.info('Port is in use but bridge is not responding yet...');
    }
    
    logger.info(`Waiting... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
    await delay(RETRY_INTERVAL_MS);
  }
  
  logger.error(`Bridge failed to start within the expected time (${maxWaitTimeMs/1000}s)`);
  return false;
}

// Cleanup function for child processes
function cleanup() {
  logger.info('Cleaning up child processes...');
  childProcesses.forEach(process => {
    try {
      if (process.pid) {
        process.kill();
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
}

// Main function
async function run() {
  try {
    // Get user's HOME directory for Python path
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const pythonBinPath = path.join(homeDir, 'Library/Python/3.12/bin');
    const pythonEnv = {
      ...process.env,
      PATH: `${process.env.PATH}:${pythonBinPath}`
    };

    // Check if bridge is already running
    const bridgeAlreadyRunning = await isBridgeResponding(BRIDGE_PORT, BRIDGE_HOST);
    
    if (bridgeAlreadyRunning) {
      logger.info('Bridge is already running and responding on port 8000');
    } else {
      const portInUse = await isPortInUse(BRIDGE_PORT, BRIDGE_HOST);
      
      if (portInUse) {
        logger.warn(`Port ${BRIDGE_PORT} is already in use but not responding as a bridge.`);
        logger.warn('This could be a stuck bridge process. You may need to kill it manually.');
        logger.warn(`Try running: lsof -i :${BRIDGE_PORT}`);
        return;
      }
      
      logger.info('Starting Python bridge...');
      
      // Start the bridge in a separate process
      const bridgeProcess = spawn('python3', ['jobspy_bridge.py'], {
        cwd: __dirname,
        env: pythonEnv,
        stdio: 'inherit'
      });
      
      childProcesses.push(bridgeProcess);
      
      bridgeProcess.on('error', (error) => {
        logger.error(`Failed to start bridge: ${error.message}`);
        process.exit(1);
      });
      
      // Wait for the bridge to be ready
      const bridgeReady = await waitForBridge();
      if (!bridgeReady) {
        logger.error('Failed to start bridge. Exiting...');
        cleanup();
        process.exit(1);
      }
    }
    
    // Start the job scraper
    logger.info('Starting job scraper...');
    
    const scraperProcess = spawn('node', ['scrape-all-jobs.js'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: process.env
    });
    
    childProcesses.push(scraperProcess);
    
    // Handle scraper process events
    scraperProcess.on('close', (code) => {
      logger.info(`Job scraper finished with code ${code}`);
      // Only exit if we're not in an already running bridge situation
      if (!bridgeAlreadyRunning) {
        cleanup();
      }
      process.exit(code);
    });
    
    scraperProcess.on('error', (error) => {
      logger.error(`Job scraper error: ${error.message}`);
      if (!bridgeAlreadyRunning) {
        cleanup();
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error(`Unexpected error: ${error.message}`);
    cleanup();
    process.exit(1);
  }
}

// Register cleanup handlers
process.on('SIGINT', () => {
  logger.info('Received SIGINT. Cleaning up...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Cleaning up...');
  cleanup();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  logger.error(error.stack);
  cleanup();
  process.exit(1);
});

// Run the script
run().catch(error => {
  logger.error(`Error: ${error.message}`);
  cleanup();
  process.exit(1);
}); 