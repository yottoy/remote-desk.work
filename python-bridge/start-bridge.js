/**
 * Start the JobSpy Python bridge
 * 
 * This script starts the JobSpy Python bridge, which handles communication with the JobSpy library.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the bridge configuration from environment
require('dotenv').config();
const BRIDGE_HOST = process.env.JOBSPY_BRIDGE_HOST || '127.0.0.1';
const BRIDGE_PORT = process.env.JOBSPY_BRIDGE_PORT || 8000;

// Check if we're running in GitHub Actions
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

// Function to start the bridge
function startBridge() {
  console.log(`Starting JobSpy bridge on http://${BRIDGE_HOST}:${BRIDGE_PORT}...`);
  
  // Ensure log directory exists
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Create log file stream
  const logFile = path.join(logDir, 'jobspy_bridge.log');
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });
  
  // Set up environment for the bridge
  const env = {
    ...process.env,
    PYTHONUNBUFFERED: '1', // Make Python output unbuffered for real-time logs
    JOBSPY_BRIDGE_HOST: BRIDGE_HOST,
    JOBSPY_BRIDGE_PORT: BRIDGE_PORT,
    DISABLE_PYDANTIC_VALIDATION_WARNINGS: 'true', // Disable the pydantic v1 warnings
  };
  
  // Set up the command to run the bridge
  let bridgeCmd;
  let bridgeArgs;
  
  // In GitHub Actions, use specific command for better compatibility
  if (isGitHubActions) {
    bridgeCmd = 'python';
    bridgeArgs = [
      '-m', 'uvicorn', 
      'jobspy_bridge:app', 
      '--host', '0.0.0.0', // Bind to all interfaces, not just localhost
      '--port', BRIDGE_PORT.toString(),
      '--log-level', 'info'
    ];
  } else {
    // For local development
    bridgeCmd = 'uvicorn';
    bridgeArgs = [
      'jobspy_bridge:app', 
      '--host', BRIDGE_HOST,
      '--port', BRIDGE_PORT.toString(),
      '--reload',
      '--log-level', 'info'
    ];
  }
  
  // Start the bridge process
  const bridgeProcess = spawn(bridgeCmd, bridgeArgs, {
    cwd: __dirname,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Handle bridge output
  bridgeProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Bridge] ${output.trim()}`);
    logStream.write(`${output}`);
  });
  
  bridgeProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.error(`[Bridge Error] ${output.trim()}`);
    logStream.write(`ERROR: ${output}`);
  });
  
  // Handle bridge exit
  bridgeProcess.on('close', (code) => {
    console.log(`JobSpy bridge exited with code ${code}`);
    logStream.end();
  });
  
  // Return the bridge process
  return bridgeProcess;
}

// Start the bridge if this script is run directly
if (require.main === module) {
  const bridge = startBridge();
  
  // Handle termination signals
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down bridge...');
    bridge.kill();
  });
  
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down bridge...');
    bridge.kill();
  });
} 