/**
 * JobSpy Bridge Manager
 * 
 * This module handles starting, stopping, and checking the status of the JobSpy Python bridge.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const logger = require('./logger');

// Get bridge configuration from environment
require('dotenv').config();
const BRIDGE_URL = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000';
const BRIDGE_HOST = process.env.JOBSPY_BRIDGE_HOST || '127.0.0.1';
const BRIDGE_PORT = process.env.JOBSPY_BRIDGE_PORT || 8000;

// Check if we're running in GitHub Actions
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

// Keep track of bridge process
let bridgeProcess = null;

/**
 * Check if the bridge is running
 * @returns {Promise<boolean>} True if the bridge is running, false otherwise
 */
async function isRunning() {
  try {
    // In GitHub Actions environment, need to use different URL format
    const healthURL = isGitHubActions 
      ? `http://0.0.0.0:${BRIDGE_PORT}/health` 
      : `${BRIDGE_URL}/health`;
    
    logger.debug(`Checking bridge status at ${healthURL}`);
    const response = await axios.get(healthURL, { timeout: 2000 });
    return response.status === 200;
  } catch (error) {
    logger.debug(`Bridge status check failed: ${error.message}`);
    return false;
  }
}

/**
 * Start the JobSpy bridge
 * @returns {Promise<boolean>} True if the bridge was started successfully, false otherwise
 */
async function start() {
  try {
    // Check if bridge is already running
    if (await isRunning()) {
      logger.info('JobSpy bridge is already running');
      return true;
    }
    
    logger.info('Starting JobSpy bridge...');
    
    // Install Python dependencies
    logger.info('Installing Python dependencies...');
    const pythonBridgeDir = path.join(process.cwd(), 'python-bridge');
    const requirementsPath = path.join(pythonBridgeDir, 'requirements.txt');
    
    // Check if requirements file exists
    if (!fs.existsSync(requirementsPath)) {
      logger.error(`Requirements file not found at ${requirementsPath}`);
      return false;
    }
    
    // Install dependencies with pip
    try {
      const pipProcess = spawn('pip', ['install', '-r', requirementsPath], {
        stdio: 'pipe'
      });
      
      // Wait for pip to finish
      await new Promise((resolve, reject) => {
        pipProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`pip exited with code ${code}`));
          }
        });
        
        pipProcess.on('error', reject);
      });
      
      logger.info('Python dependencies installed successfully');
    } catch (error) {
      logger.error(`Failed to install Python dependencies: ${error.message}`);
      // Continue anyway - dependencies might already be installed
    }
    
    // Start the bridge
    const startBridgePath = path.join(pythonBridgeDir, 'start-bridge.js');
    
    // If start-bridge.js doesn't exist or can't be accessed, create a simple version
    if (!fs.existsSync(startBridgePath)) {
      logger.warn(`Bridge starter not found at ${startBridgePath}, using direct start method`);
      
      // Use uvicorn directly if in GitHub Actions environment
      if (isGitHubActions) {
        const bridgeFile = path.join(pythonBridgeDir, 'jobspy_bridge.py');
        
        // Ensure bridge file exists
        if (!fs.existsSync(bridgeFile)) {
          logger.error(`Bridge file not found at ${bridgeFile}`);
          return false;
        }
        
        // Start uvicorn directly
        bridgeProcess = spawn('python', [
          '-m', 'uvicorn',
          'jobspy_bridge:app',
          '--host', '0.0.0.0',
          '--port', BRIDGE_PORT.toString()
        ], {
          cwd: pythonBridgeDir,
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1',
            DISABLE_PYDANTIC_VALIDATION_WARNINGS: 'true'
          },
          stdio: 'pipe'
        });
      } else {
        // Start the bridge using Node's spawn
        bridgeProcess = spawn('node', [path.join(__dirname, '../../python-bridge/start-bridge.js')], {
          detached: true,
          stdio: 'pipe'
        });
      }
    } else {
      // Use the start-bridge.js script
      bridgeProcess = spawn('node', [startBridgePath], {
        detached: true,
        stdio: 'pipe'
      });
    }
    
    // Handle bridge output
    bridgeProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      logger.debug(`Bridge output: ${output}`);
    });
    
    bridgeProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      logger.error(`JobSpy bridge error: ${output}`);
    });
    
    // Handle bridge exit
    bridgeProcess.on('close', (code) => {
      logger.warn(`Bridge process exited with code ${code}`);
      bridgeProcess = null;
    });
    
    // Wait for bridge to start (up to 30 seconds)
    logger.info('Waiting up to 30 seconds for bridge to start...');
    const start = Date.now();
    const timeout = 30000; // 30 seconds
    
    while (Date.now() - start < timeout) {
      if (await isRunning()) {
        logger.info('JobSpy bridge started successfully');
        return true;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.error('Failed to start JobSpy bridge');
    return false;
  } catch (error) {
    logger.error(`Error starting JobSpy bridge: ${error.message}`);
    return false;
  }
}

/**
 * Stop the JobSpy bridge
 */
async function stop() {
  if (bridgeProcess) {
    logger.info('Stopping JobSpy bridge...');
    bridgeProcess.kill();
    bridgeProcess = null;
  }
}

/**
 * Legacy function stub for startMonitoring
 * @deprecated This function is deprecated and does nothing.
 */
function startMonitoring() {
  logger.warn('bridgeManager.startMonitoring() was called, but this function is deprecated and does nothing.');
  logger.warn('The monitoring functionality is now built into the bridge manager.');
  return true;
}

/**
 * Legacy function to check bridge status
 * @deprecated Use isRunning instead
 * @returns {Promise<boolean>} True if the bridge is running
 */
async function checkStatus() {
  return await isRunning();
}

module.exports = {
  isRunning,
  start,
  stop,
  startMonitoring,
  checkStatus
}; 