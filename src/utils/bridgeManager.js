const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const logger = require('./logger');

class BridgeManager {
  constructor() {
    this.bridgeProcess = null;
    this.bridgeUrl = process.env.JOBSPY_BRIDGE_URL || 'http://localhost:8000';
    this.bridgePort = process.env.JOBSPY_BRIDGE_PORT || 8000;
    this.bridgeHost = process.env.JOBSPY_BRIDGE_HOST || '127.0.0.1';
    this.monitorInterval = null;
    this.restartAttempts = 0;
    this.maxRestartAttempts = 3;
    this.isRunning = false;
  }

  /**
   * Start the Python bridge process
   * @returns {Promise<boolean>} - Success status
   */
  async start() {
    if (this.bridgeProcess) {
      logger.info('Bridge process already running');
      return true;
    }

    logger.info('Starting JobSpy bridge...');
    
    // Check if Python is installed
    try {
      const pythonPath = await this._getPythonPath();
      
      // Check bridge script and requirements existence
      const bridgeScriptPath = path.join(process.cwd(), 'python-bridge', 'jobspy_bridge.py');
      const requirementsPath = path.join(process.cwd(), 'python-bridge', 'requirements.txt');
      
      if (!fs.existsSync(bridgeScriptPath)) {
        throw new Error(`Bridge script not found at ${bridgeScriptPath}`);
      }
      
      if (!fs.existsSync(requirementsPath)) {
        throw new Error(`Requirements file not found at ${requirementsPath}`);
      }
      
      // Try to install requirements
      try {
        await this._installDependencies(pythonPath, requirementsPath);
      } catch (error) {
        logger.warn(`Failed to install dependencies: ${error.message}`);
        logger.warn('Continuing with bridge startup anyway...');
      }
      
      // Start the bridge process
      this.bridgeProcess = spawn(pythonPath, [bridgeScriptPath], {
        env: {
          ...process.env,
          JOBSPY_BRIDGE_PORT: this.bridgePort,
          JOBSPY_BRIDGE_HOST: this.bridgeHost,
          PATH: `${process.env.PATH}:${process.env.HOME}/Library/Python/3.12/bin`
        },
        detached: true
      });
      
      this.bridgeProcess.stdout.on('data', (data) => {
        logger.info(`JobSpy bridge: ${data.toString().trim()}`);
      });
      
      this.bridgeProcess.stderr.on('data', (data) => {
        logger.error(`JobSpy bridge error: ${data.toString().trim()}`);
      });
      
      this.bridgeProcess.on('error', (error) => {
        logger.error(`Bridge process error: ${error.message}`);
        this.isRunning = false;
      });
      
      this.bridgeProcess.on('close', (code) => {
        logger.warn(`Bridge process exited with code ${code}`);
        this.bridgeProcess = null;
        this.isRunning = false;
        
        if (this.monitorInterval) {
          this._tryRestart();
        }
      });
      
      // Wait for bridge to start
      const isRunning = await this._waitForBridgeStart();
      this.isRunning = isRunning;
      
      if (isRunning) {
        logger.info(`JobSpy bridge started successfully on ${this.bridgeUrl}`);
        this.restartAttempts = 0;
        return true;
      } else {
        logger.error('Failed to start JobSpy bridge');
        this._killProcess();
        return false;
      }
      
    } catch (error) {
      logger.error(`Failed to start JobSpy bridge: ${error.message}`);
      return false;
    }
  }

  /**
   * Stop the bridge process
   */
  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this._killProcess();
    this.isRunning = false;
    logger.info('JobSpy bridge stopped');
  }

  /**
   * Check if the bridge is running
   * @returns {Promise<boolean>} - Running status
   */
  async checkStatus() {
    try {
      const response = await axios.get(this.bridgeUrl, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      logger.error(`Bridge status check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Start monitoring the bridge process
   * @param {number} intervalMs - Check interval in milliseconds
   */
  startMonitoring(intervalMs = 60000) {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    this.monitorInterval = setInterval(async () => {
      const isRunning = await this.checkStatus();
      
      if (!isRunning) {
        logger.warn('Bridge is not responding, attempting to restart...');
        this._tryRestart();
      } else {
        logger.debug('Bridge health check passed');
      }
    }, intervalMs);
    
    logger.info(`Bridge monitoring started with ${intervalMs}ms interval`);
  }

  /**
   * Try to restart the bridge process
   * @private
   */
  async _tryRestart() {
    if (this.restartAttempts >= this.maxRestartAttempts) {
      logger.error(`Maximum restart attempts (${this.maxRestartAttempts}) reached. Manual intervention required.`);
      this.stop();
      return;
    }
    
    this.restartAttempts++;
    logger.info(`Attempting to restart bridge (attempt ${this.restartAttempts}/${this.maxRestartAttempts})...`);
    
    // Kill any existing process first
    this._killProcess();
    
    // Wait a bit before restarting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to start again
    const success = await this.start();
    
    if (!success && this.restartAttempts < this.maxRestartAttempts) {
      // Exponential backoff for retries
      const backoff = Math.pow(2, this.restartAttempts) * 5000;
      logger.info(`Will retry in ${backoff/1000} seconds...`);
      
      setTimeout(() => {
        this._tryRestart();
      }, backoff);
    }
  }

  /**
   * Wait for the bridge to start responding
   * @returns {Promise<boolean>} - Success status
   * @private
   */
  async _waitForBridgeStart() {
    const maxWaitTime = 30000; // 30 seconds
    const interval = 1000; // 1 second
    const maxAttempts = maxWaitTime / interval;
    
    logger.info(`Waiting up to ${maxWaitTime/1000} seconds for bridge to start...`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(this.bridgeUrl, { timeout: 2000 });
        if (response.status === 200) {
          return true;
        }
      } catch (error) {
        // Continue trying
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    return false;
  }

  /**
   * Kill the bridge process if it exists
   * @private
   */
  _killProcess() {
    if (this.bridgeProcess) {
      try {
        process.kill(-this.bridgeProcess.pid, 'SIGINT');
      } catch (error) {
        // Process may already be gone
      }
      this.bridgeProcess = null;
    }
  }

  /**
   * Install Python dependencies
   * @param {string} pythonPath - Path to Python executable
   * @param {string} requirementsPath - Path to requirements.txt
   * @returns {Promise<void>}
   * @private
   */
  async _installDependencies(pythonPath, requirementsPath) {
    return new Promise((resolve, reject) => {
      logger.info('Installing Python dependencies...');
      
      const pipProcess = spawn(pythonPath, ['-m', 'pip', 'install', '-r', requirementsPath]);
      
      let output = '';
      let error = '';
      
      pipProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pipProcess.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      pipProcess.on('error', (err) => {
        reject(new Error(`Failed to run pip: ${err.message}`));
      });
      
      pipProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`pip install failed with code ${code}: ${error}`));
        } else {
          logger.info('Python dependencies installed successfully');
          resolve();
        }
      });
    });
  }

  /**
   * Get the Python executable path
   * @returns {Promise<string>} - Path to Python executable
   * @private
   */
  async _getPythonPath() {
    const pythonCommands = ['python3', 'python'];
    
    for (const cmd of pythonCommands) {
      try {
        await new Promise((resolve, reject) => {
          const process = spawn(cmd, ['--version']);
          
          process.on('error', reject);
          
          process.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`${cmd} check failed with code ${code}`));
            }
          });
        });
        
        return cmd;
      } catch (error) {
        // Try next command
      }
    }
    
    throw new Error('Python not found. Please install Python 3.10+ and make sure it is in your PATH');
  }
}

// Create and export a singleton instance
const bridgeManager = new BridgeManager();
module.exports = bridgeManager; 