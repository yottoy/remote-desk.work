/**
 * JobSpy Python Bridge Starter
 * 
 * This script starts the JobSpy Python bridge service and handles errors.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const BRIDGE_HOST = process.env.JOBSPY_BRIDGE_HOST || '127.0.0.1'; // Force IPv4
const BRIDGE_PORT = process.env.JOBSPY_BRIDGE_PORT || 8000;
const PID_FILE = path.join(__dirname, 'bridge_pid.txt');
const LOG_FILE = path.join(__dirname, 'logs', 'bridge.log');

// Ensure logs directory exists
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
}

// Simple logger that writes to console and file
const logger = {
  info: (message) => {
    const logMessage = `[INFO] ${new Date().toISOString()} - ${message}`;
    console.log(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  },
  error: (message) => {
    const logMessage = `[ERROR] ${new Date().toISOString()} - ${message}`;
    console.error(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  },
  warn: (message) => {
    const logMessage = `[WARN] ${new Date().toISOString()} - ${message}`;
    console.warn(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  }
};

// Check if bridge is already running
function isBridgeRunning() {
  if (fs.existsSync(PID_FILE)) {
    try {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));
      
      // Check if process is running
      try {
        process.kill(pid, 0); // This doesn't actually kill the process, just checks if it exists
        return true;
      } catch (e) {
        // Process doesn't exist, clean up PID file
        fs.unlinkSync(PID_FILE);
        return false;
      }
    } catch (error) {
      logger.warn(`Error checking bridge PID: ${error.message}`);
      return false;
    }
  }
  
  return false;
}

// Kill any existing bridge process
function killExistingBridge() {
  if (fs.existsSync(PID_FILE)) {
    try {
      const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));
      
      // Try to kill the process
      try {
        process.kill(pid);
        logger.info(`Killed existing bridge process with PID ${pid}`);
      } catch (e) {
        logger.warn(`Failed to kill process ${pid}: ${e.message}`);
      }
      
      // Remove PID file
      fs.unlinkSync(PID_FILE);
    } catch (error) {
      logger.error(`Error killing existing bridge: ${error.message}`);
    }
  }
}

// Start the bridge
function startBridge() {
  try {
    // Check if bridge is already running
    if (isBridgeRunning()) {
      logger.info('Bridge is already running');
      return;
    }
    
    // Find Python executable
    const isPythonInstalled = (cmd) => {
      try {
        require('child_process').execSync(`${cmd} --version`, { stdio: 'ignore' });
        return true;
      } catch (e) {
        return false;
      }
    };
    
    let pythonCmd = 'python3';
    if (!isPythonInstalled(pythonCmd)) {
      pythonCmd = 'python';
      if (!isPythonInstalled(pythonCmd)) {
        throw new Error('Python not found. Please install Python 3.');
      }
    }
    
    logger.info(`Starting JobSpy bridge on ${BRIDGE_HOST}:${BRIDGE_PORT}`);
    
    // Determine platform-specific command
    const args = [
      '-m', 'uvicorn',
      'jobspy_bridge:app',
      '--host', BRIDGE_HOST,
      '--port', BRIDGE_PORT.toString()
    ];
    
    const options = {
      cwd: __dirname,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1', // Force unbuffered output
        JOBSPY_BRIDGE_HOST: BRIDGE_HOST,
        JOBSPY_BRIDGE_PORT: BRIDGE_PORT.toString()
      }
    };
    
    // Start the bridge process
    const bridgeProcess = spawn(pythonCmd, args, options);
    
    // Write PID to file
    fs.writeFileSync(PID_FILE, bridgeProcess.pid.toString());
    
    logger.info(`Started JobSpy bridge with PID ${bridgeProcess.pid}`);
    
    // Handle process events
    bridgeProcess.stdout.on('data', (data) => {
      logger.info(`Bridge output: ${data.toString().trim()}`);
    });
    
    bridgeProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message.includes('ERROR')) {
        logger.error(`Bridge error: ${message}`);
      } else {
        logger.info(`Bridge log: ${message}`);
      }
    });
    
    bridgeProcess.on('error', (error) => {
      logger.error(`Failed to start bridge: ${error.message}`);
    });
    
    bridgeProcess.on('close', (code) => {
      logger.warn(`Bridge process exited with code ${code}`);
      // Remove PID file when process exits
      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
      }
    });
    
    // Detach process so it stays running when this script exits
    bridgeProcess.unref();
    
  } catch (error) {
    logger.error(`Error starting bridge: ${error.message}`);
    throw error;
  }
}

// Main function
function main() {
  try {
    logger.info('Starting JobSpy bridge service');
    killExistingBridge(); // Always kill existing bridge to ensure clean startup
    startBridge();
  } catch (error) {
    logger.error(`Failed to start bridge: ${error.message}`);
    process.exit(1);
  }
}

// Run main function
main(); 