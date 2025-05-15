// Configuration
const API_HOST = process.env.JOBSPY_BRIDGE_URL || 'http://127.0.0.1:8000'; // Always use explicit IPv4
const DELAY_BETWEEN_REQUESTS = process.env.DELAY_BETWEEN_REQUESTS ? parseInt(process.env.DELAY_BETWEEN_REQUESTS) : 3000; // ms
const RETRY_DELAY = process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY) : 30000; // ms
const MAX_RETRIES = process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3;
const BRIDGE_CHECK_RETRIES = 5;
const BRIDGE_CHECK_DELAY = 3000; // ms
const RESULTS_FILE = path.join(__dirname, 'scrape-results.json');
const PROXIES_FILE = path.join(__dirname, 'proxies.txt');
const KEYWORDS_FILE = path.join(__dirname, 'admin-data-entry-keywords.json');
const USE_PROXIES = process.env.USE_PROXIES === 'true' || false;

// Configure axios to use IPv4
const originalCreate = axios.create;
axios.create = function(config) {
  config = config || {};
  // Force IPv4
  config.family = 4;  
  // Set explicit timeout
  config.timeout = config.timeout || 120000;
  return originalCreate.call(this, config);
};

// Create a properly configured axios instance
const axiosClient = axios.create({
  family: 4, // Force IPv4
  timeout: 120000, // 2 minute timeout
  // Add additional headers
  headers: {
    'Accept': 'application/json',
    'Connection': 'keep-alive'
  }
});

// Check if the bridge is running
async function checkBridgeStatus(retryCount = 0) {
  try {
    // Always use explicit IPv4 address
    const url = `${API_HOST}/health`;
    logger.debug(`Checking bridge status at ${url}`);
    
    // First try direct curl request for debugging
    if (retryCount === 0) {
      try {
        const { execSync } = require('child_process');
        logger.debug(`Testing direct connection with curl`);
        execSync(`curl -s -v ${url} || echo "Curl failed"`, { encoding: 'utf8', timeout: 5000 });
      } catch (e) {
        logger.debug(`Curl check failed: ${e.message}`);
      }
    }
    
    // Get hostname from URL for DNS resolution test
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    logger.debug(`Checking connection to ${hostname}:${urlObj.port}`);
    
    // Try both methods to check bridge status
    let success = false;
    
    // Method 1: Standard axios request
    try {
      const response = await axiosClient.get(url, { 
        timeout: 5000,
        validateStatus: () => true // Accept any status code as response
      });
      
      logger.debug(`Bridge health check HTTP status: ${response.status}`);
      
      if (response.status === 200) {
        logger.info(`Bridge is running at ${url}`);
        return true;
      } else {
        logger.warn(`Bridge returned non-200 status: ${response.status}`);
      }
    } catch (err) {
      logger.warn(`Axios check failed: ${err.message}`);
    }
    
    // Method 2: Try with net.connect
    try {
      const net = require('net');
      const parts = hostname.split(':');
      const host = parts[0];
      const port = parseInt(urlObj.port || 8000);
      
      return new Promise((resolve) => {
        const socket = net.connect({
          host: host,
          port: port,
          family: 4, // Force IPv4
          timeout: 2000
        });
        
        socket.on('connect', () => {
          logger.debug(`Socket connection to ${host}:${port} successful`);
          socket.end();
          resolve(true);
        });
        
        socket.on('error', (err) => {
          logger.debug(`Socket connection failed: ${err.message}`);
          resolve(false);
        });
        
        socket.on('timeout', () => {
          logger.debug(`Socket connection timed out`);
          socket.destroy();
          resolve(false);
        });
      });
    } catch (err) {
      logger.warn(`Socket check failed: ${err.message}`);
    }
    
    // If we get here, both methods failed
    logger.error(`Bridge check failed at ${url}`);
    
    if (retryCount < BRIDGE_CHECK_RETRIES) {
      logger.info(`Retrying bridge health check in ${BRIDGE_CHECK_DELAY/1000} seconds (attempt ${retryCount + 1}/${BRIDGE_CHECK_RETRIES})...`);
      await delay(BRIDGE_CHECK_DELAY);
      return checkBridgeStatus(retryCount + 1);
    }
    
    return false;
  } catch (error) {
    logger.error(`Bridge health check error: ${error.message}`);
    
    if (retryCount < BRIDGE_CHECK_RETRIES) {
      logger.info(`Retrying bridge health check in ${BRIDGE_CHECK_DELAY/1000} seconds (attempt ${retryCount + 1}/${BRIDGE_CHECK_RETRIES})...`);
      await delay(BRIDGE_CHECK_DELAY);
      return checkBridgeStatus(retryCount + 1);
    }
    
    return false;
  }
} 