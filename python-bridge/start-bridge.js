const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define a local logger instead of importing from an external module
const logger = {
  info: (message) => console.log(`INFO: ${message}`),
  error: (message) => console.error(`ERROR: ${message}`),
  warn: (message) => console.warn(`WARNING: ${message}`),
  debug: (message) => console.debug(`DEBUG: ${message}`)
};

/**
 * Simple logging function
 */
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  logger.info(message);
}

/**
 * Get the Python executable path
 */
function getPythonExecutable() {
  // Check common Python executable names
  const pythonCommands = ['python3', 'python'];
  
  for (const cmd of pythonCommands) {
    try {
      const result = require('child_process').execSync(`${cmd} --version`);
      log(`Found Python: ${result.toString().trim()}`);
      return cmd;
    } catch (error) {
      log(`Command ${cmd} not found or failed`);
    }
  }
  
  log('Python executable not found');
  return null;
}

/**
 * Start the Python JobSpy bridge server
 */
function startJobSpyBridge() {
  log('Starting JobSpy bridge server...');
  
  // Get Python executable
  const pythonCmd = getPythonExecutable();
  
  if (!pythonCmd) {
    log('Please make sure Python 3.10+ is installed and in your PATH');
    process.exit(1);
  }
  
  // Check if the bridge script exists
  const bridgeScriptPath = path.join(__dirname, 'jobspy_bridge.py');
  
  if (!fs.existsSync(bridgeScriptPath)) {
    log(`Bridge script not found at ${bridgeScriptPath}`);
    process.exit(1);
  }
  
  // Check if the requirements.txt exists
  const requirementsPath = path.join(__dirname, 'requirements.txt');
  
  if (!fs.existsSync(requirementsPath)) {
    log(`Requirements file not found at ${requirementsPath}`);
    process.exit(1);
  }
  
  // Install requirements
  log('Installing Python dependencies...');
  
  // Construct PATH environment
  const userPath = process.env.HOME ? 
    `${process.env.PATH}:${process.env.HOME}/Library/Python/3.12/bin:${process.env.HOME}/.local/bin` : 
    process.env.PATH;
  
  const pipProcess = spawn(pythonCmd, ['-m', 'pip', 'install', '-r', requirementsPath], {
    env: {
      ...process.env,
      PATH: userPath
    }
  });
  
  pipProcess.stdout.on('data', (data) => {
    log(`pip: ${data.toString().trim()}`);
  });
  
  pipProcess.stderr.on('data', (data) => {
    log(`pip error: ${data.toString().trim()}`);
  });
  
  pipProcess.on('error', (error) => {
    log(`Failed to install dependencies: ${error.message}`);
    process.exit(1);
  });
  
  pipProcess.on('close', (code) => {
    if (code !== 0) {
      log(`pip install failed with code ${code}`);
      process.exit(1);
    }
    
    // Start the bridge server
    log('Starting JobSpy bridge server...');
    
    const port = process.env.JOBSPY_BRIDGE_PORT || 8000;
    const host = process.env.JOBSPY_BRIDGE_HOST || '127.0.0.1';
    
    const bridgeProcess = spawn(pythonCmd, [bridgeScriptPath], {
      env: {
        ...process.env,
        JOBSPY_BRIDGE_PORT: port,
        JOBSPY_BRIDGE_HOST: host,
        PATH: userPath
      },
      detached: true
    });
    
    bridgeProcess.stdout.on('data', (data) => {
      log(`JobSpy bridge: ${data.toString().trim()}`);
    });
    
    bridgeProcess.stderr.on('data', (data) => {
      log(`JobSpy bridge error: ${data.toString().trim()}`);
    });
    
    bridgeProcess.on('error', (error) => {
      log(`Failed to start JobSpy bridge: ${error.message}`);
      process.exit(1);
    });
    
    bridgeProcess.on('close', (code) => {
      log(`JobSpy bridge exited with code ${code}`);
      process.exit(1);
    });
    
    // Detach the process so it keeps running
    bridgeProcess.unref();
    
    log(`JobSpy bridge server started on http://${host}:${port}`);
    log('Press Ctrl+C to stop the server');
    
    // Keep the script running
    process.stdin.resume();
    
    // Handle process termination
    process.on('SIGINT', () => {
      log('Stopping JobSpy bridge server...');
      process.kill(-bridgeProcess.pid, 'SIGINT');
      process.exit(0);
    });
  });
}

startJobSpyBridge(); 