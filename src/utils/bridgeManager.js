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
const MAX_STARTUP_ATTEMPTS = 3;

// Path to bridge PID file
const BRIDGE_PID_FILE = path.join(process.cwd(), 'python-bridge', 'bridge_pid.txt');

// Keep track of bridge process
let bridgeProcess = null;
let startupAttempts = 0;

/**
 * Check if the bridge is running
 * @returns {Promise<boolean>} True if the bridge is running, false otherwise
 */
async function isRunning() {
  try {
    // Check if we have a PID file and process is running
    if (fs.existsSync(BRIDGE_PID_FILE)) {
      const pid = parseInt(fs.readFileSync(BRIDGE_PID_FILE, 'utf8').trim());
      try {
        // Check if process is running - doesn't actually send a signal
        process.kill(pid, 0);
        // Process exists, but also verify API is responding
      } catch (e) {
        // Process doesn't exist
        return false;
      }
    }

    // Always check API response regardless of PID file
    const healthURL = `${BRIDGE_URL}/health`;
    logger.debug(`Checking bridge status at ${healthURL}`);
    
    const response = await axios.get(healthURL, { 
      timeout: 3000,
      validateStatus: false
    });
    
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
      // Reset startup attempts on success
      startupAttempts = 0;
      return true;
    }
    
    // Increment startup attempts
    startupAttempts++;
    if (startupAttempts > MAX_STARTUP_ATTEMPTS) {
      logger.error(`Exceeded maximum bridge startup attempts (${MAX_STARTUP_ATTEMPTS})`);
      startupAttempts = 0;
      return false;
    }
    
    logger.info(`Starting JobSpy bridge (attempt ${startupAttempts}/${MAX_STARTUP_ATTEMPTS})...`);
    
    // Path to the bridge starter script
    const starterScriptPath = path.join(process.cwd(), 'python-bridge', 'start-bridge.js');
    
    // Ensure script exists
    if (!fs.existsSync(starterScriptPath)) {
      logger.error(`Bridge starter script not found at ${starterScriptPath}`);
      return false;
    }
    
    // Start the bridge using the dedicated starter script
    logger.info(`Running bridge starter: ${starterScriptPath}`);
    bridgeProcess = spawn('node', [starterScriptPath], {
      detached: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        JOBSPY_BRIDGE_HOST: BRIDGE_HOST,
        JOBSPY_BRIDGE_PORT: BRIDGE_PORT
      }
    });
    
    // Detach the process so it keeps running independently
    bridgeProcess.unref();
    
    // Wait for bridge to start (up to 20 seconds)
    logger.info('Waiting up to 20 seconds for bridge to start...');
    const startTime = Date.now();
    const timeout = 20000; // 20 seconds
    
    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (await isRunning()) {
        logger.info('JobSpy bridge started successfully');
        // Reset startup attempts on success
        startupAttempts = 0;
        return true;
      }
    }
    
    logger.error('Failed to start JobSpy bridge - timed out waiting for it to respond');
    
    // Try again recursively if within attempt limits
    if (startupAttempts < MAX_STARTUP_ATTEMPTS) {
      logger.info(`Retrying bridge startup (attempt ${startupAttempts}/${MAX_STARTUP_ATTEMPTS})...`);
      return await start();
    }
    
    startupAttempts = 0;
    return false;
  } catch (error) {
    logger.error(`Error starting JobSpy bridge: ${error.message}`);
    
    // Try again recursively if within attempt limits
    if (startupAttempts < MAX_STARTUP_ATTEMPTS) {
      logger.info(`Retrying bridge startup after error (attempt ${startupAttempts}/${MAX_STARTUP_ATTEMPTS})...`);
      return await start();
    }
    
    startupAttempts = 0;
    return false;
  }
}

/**
 * Stop the JobSpy bridge
 * @returns {Promise<boolean>} True if successfully stopped, false otherwise
 */
async function stop() {
  try {
    // Check if we have a PID file
    if (fs.existsSync(BRIDGE_PID_FILE)) {
      const pid = parseInt(fs.readFileSync(BRIDGE_PID_FILE, 'utf8').trim());
      
      try {
        // Try to kill the process
        process.kill(pid);
        logger.info(`Sent termination signal to bridge process with PID ${pid}`);
        
        // Remove PID file
        fs.unlinkSync(BRIDGE_PID_FILE);
        return true;
      } catch (error) {
        logger.warn(`Failed to kill bridge process with PID ${pid}: ${error.message}`);
        // Remove PID file if it exists but process doesn't
        if (error.code === 'ESRCH') {
          fs.unlinkSync(BRIDGE_PID_FILE);
        }
      }
    }
    
    // If we have a reference to the process, try to kill it
    if (bridgeProcess) {
      bridgeProcess.kill();
      bridgeProcess = null;
      logger.info('Stopped bridge process');
      return true;
    }
    
    logger.warn('No running bridge process found to stop');
    return false;
  } catch (error) {
    logger.error(`Error stopping bridge: ${error.message}`);
    return false;
  }
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
  checkStatus
}; 