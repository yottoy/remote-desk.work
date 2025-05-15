/**
 * Proxy Validator
 * 
 * This script tests and validates proxies to ensure they work properly for scraping.
 * It helps identify and remove non-working proxies and provides insights into proxy performance.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

// Configure logger
const logger = {
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Configuration
const PROXIES_FILE = path.join(__dirname, 'proxies.txt');
const TEST_URLS = [
  'https://httpbin.org/ip',
  'https://api.ipify.org?format=json',
  'https://www.indeed.com/robots.txt',
  'https://www.linkedin.com/robots.txt'
];
const TEST_TIMEOUT = 10000; // 10 seconds
const CONCURRENCY_LIMIT = 5; // Number of proxies to test simultaneously
const CLEANED_PROXIES_FILE = path.join(__dirname, 'validated-proxies.txt');
const REPORT_FILE = path.join(__dirname, 'proxy-validation-report.json');

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Load proxies from file
function loadProxies() {
  try {
    if (!fs.existsSync(PROXIES_FILE)) {
      logger.error(`Proxies file not found: ${PROXIES_FILE}`);
      return [];
    }
    
    const content = fs.readFileSync(PROXIES_FILE, 'utf8');
    const proxies = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    logger.info(`Loaded ${proxies.length} proxies from ${PROXIES_FILE}`);
    return proxies;
  } catch (error) {
    logger.error(`Error loading proxies: ${error.message}`);
    return [];
  }
}

// Parse proxy string into URL format
function parseProxy(proxyString) {
  try {
    // Standard format: protocol://user:pass@host:port
    if (proxyString.includes('://')) {
      return proxyString;
    }
    
    // Handle host:port format
    if (proxyString.includes(':')) {
      const [host, port] = proxyString.split(':');
      return `http://${host}:${port}`;
    }
    
    // Handle user:pass@host:port format
    if (proxyString.includes('@')) {
      return `http://${proxyString}`;
    }
    
    // Default to http if no protocol specified
    return `http://${proxyString}`;
  } catch (error) {
    logger.error(`Error parsing proxy ${proxyString}: ${error.message}`);
    return null;
  }
}

// Create appropriate agent for proxy
function createProxyAgent(proxyUrl) {
  try {
    if (proxyUrl.startsWith('socks')) {
      return new SocksProxyAgent(proxyUrl);
    } else {
      return new HttpsProxyAgent(proxyUrl);
    }
  } catch (error) {
    logger.error(`Error creating agent for ${proxyUrl}: ${error.message}`);
    return null;
  }
}

// Test a single proxy against a URL
async function testProxy(proxy, url) {
  const proxyUrl = parseProxy(proxy);
  if (!proxyUrl) {
    return { success: false, error: 'Invalid proxy format' };
  }
  
  const agent = createProxyAgent(proxyUrl);
  if (!agent) {
    return { success: false, error: 'Failed to create proxy agent' };
  }
  
  try {
    const startTime = Date.now();
    
    const response = await axios.get(url, {
      httpsAgent: agent,
      timeout: TEST_TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      statusCode: response.status,
      responseTime: responseTime,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    };
  }
}

// Test a proxy against all test URLs
async function validateProxy(proxy) {
  logger.info(`Testing proxy: ${proxy}`);
  
  const results = {
    proxy: proxy,
    testResults: {},
    overallSuccess: false,
    successRate: 0,
    averageResponseTime: 0
  };
  
  let successfulTests = 0;
  let totalResponseTime = 0;
  
  for (const url of TEST_URLS) {
    const result = await testProxy(proxy, url);
    results.testResults[url] = result;
    
    if (result.success) {
      successfulTests++;
      totalResponseTime += result.responseTime;
    }
    
    // Add a small delay between tests
    await delay(500);
  }
  
  results.successRate = successfulTests / TEST_URLS.length;
  results.averageResponseTime = successfulTests > 0 ? totalResponseTime / successfulTests : 0;
  results.overallSuccess = results.successRate >= 0.5; // Success if at least half of the tests pass
  
  logger.info(`Proxy ${proxy} - Success rate: ${(results.successRate * 100).toFixed(0)}%, Average response time: ${results.averageResponseTime.toFixed(0)}ms`);
  
  return results;
}

// Process proxies in batches to limit concurrency
async function processBatch(proxies, batchSize) {
  const results = [];
  
  for (let i = 0; i < proxies.length; i += batchSize) {
    const batch = proxies.slice(i, i + batchSize);
    logger.info(`Processing batch ${i/batchSize + 1} of ${Math.ceil(proxies.length/batchSize)}`);
    
    const batchPromises = batch.map(proxy => validateProxy(proxy));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    if (i + batchSize < proxies.length) {
      logger.info(`Waiting between batches...`);
      await delay(5000); // 5 seconds between batches
    }
  }
  
  return results;
}

// Generate report
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    totalProxies: results.length,
    validProxies: results.filter(r => r.overallSuccess).length,
    invalidProxies: results.filter(r => !r.overallSuccess).length,
    averageSuccessRate: results.reduce((acc, r) => acc + r.successRate, 0) / results.length,
    averageResponseTime: results.filter(r => r.overallSuccess).reduce((acc, r) => acc + r.averageResponseTime, 0) / 
                         (results.filter(r => r.overallSuccess).length || 1),
    testUrls: TEST_URLS,
    proxyResults: results
  };
  
  // Save report to file
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  logger.info(`Report saved to ${REPORT_FILE}`);
  
  // Print summary
  logger.info('=== Proxy Validation Summary ===');
  logger.info(`Total proxies tested: ${report.totalProxies}`);
  logger.info(`Valid proxies: ${report.validProxies} (${(report.validProxies/report.totalProxies*100).toFixed(1)}%)`);
  logger.info(`Invalid proxies: ${report.invalidProxies} (${(report.invalidProxies/report.totalProxies*100).toFixed(1)}%)`);
  logger.info(`Average success rate: ${(report.averageSuccessRate*100).toFixed(1)}%`);
  logger.info(`Average response time: ${report.averageResponseTime.toFixed(0)}ms`);
  
  return report;
}

// Save valid proxies to a new file
function saveValidProxies(results) {
  const validProxies = results.filter(r => r.overallSuccess).map(r => r.proxy);
  
  const content = validProxies.join('\n');
  fs.writeFileSync(CLEANED_PROXIES_FILE, content);
  
  logger.info(`${validProxies.length} valid proxies saved to ${CLEANED_PROXIES_FILE}`);
}

// Main function
async function main() {
  try {
    logger.info('=== Starting Proxy Validation ===');
    logger.info(`Testing proxies against ${TEST_URLS.length} URLs with ${CONCURRENCY_LIMIT} concurrent tests`);
    
    // Load proxies
    const proxies = loadProxies();
    if (proxies.length === 0) {
      logger.error('No proxies to validate');
      return;
    }
    
    // Validate proxies
    const results = await processBatch(proxies, CONCURRENCY_LIMIT);
    
    // Generate report
    const report = generateReport(results);
    
    // Save valid proxies
    saveValidProxies(results);
    
    logger.info('=== Proxy Validation Complete ===');
  } catch (error) {
    logger.error(`Error in proxy validation: ${error.message}`);
    logger.error(error.stack);
  }
}

// Run main function
main(); 