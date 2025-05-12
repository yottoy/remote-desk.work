require('dotenv').config();
const axios = require('axios');
const logger = require('../src/utils/logger');

/**
 * Test proxy configuration
 */
async function testProxy() {
  // Check if proxy is enabled in env
  const proxyEnabled = process.env.PROXY_ENABLED === 'true';
  const proxyUrl = process.env.PROXY_URL;
  const proxyUrls = process.env.PROXY_URLS ? process.env.PROXY_URLS.split(',') : [];
  
  console.log('Proxy Test Utility');
  console.log('==================');
  console.log(`Proxy Enabled: ${proxyEnabled}`);
  
  if (!proxyEnabled) {
    console.log('Proxy is not enabled. Set PROXY_ENABLED=true in .env to test proxies.');
    return;
  }
  
  // Test individual proxy if provided
  if (proxyUrl) {
    console.log(`Testing Single Proxy: ${maskProxy(proxyUrl)}`);
    await testSingleProxy(proxyUrl);
  }
  
  // Test multiple proxies if provided
  if (proxyUrls.length > 0) {
    console.log(`\nTesting ${proxyUrls.length} Proxies from PROXY_URLS:`);
    for (let i = 0; i < proxyUrls.length; i++) {
      console.log(`\nProxy ${i+1}: ${maskProxy(proxyUrls[i])}`);
      await testSingleProxy(proxyUrls[i]);
    }
  }
  
  if (!proxyUrl && proxyUrls.length === 0) {
    console.log('No proxies configured. Add PROXY_URL or PROXY_URLS to your .env file.');
  }
}

/**
 * Test a single proxy
 * @param {string} proxyUrl - The proxy URL to test
 */
async function testSingleProxy(proxyUrl) {
  try {
    console.log('Testing connection...');
    
    // Extract proxy parts
    const proxyParts = new URL(proxyUrl);
    const proxyConfig = {
      host: proxyParts.hostname,
      port: proxyParts.port,
      auth: proxyParts.username ? {
        username: proxyParts.username,
        password: proxyParts.password
      } : undefined
    };
    
    // Make request through proxy
    const startTime = Date.now();
    const response = await axios.get('https://httpbin.org/ip', { 
      proxy: proxyConfig,
      timeout: 10000
    });
    const endTime = Date.now();
    
    console.log('✅ Success! Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log(`Response time: ${endTime - startTime}ms`);
    
    // Test website that's giving 403 errors
    console.log('\nTesting access to We Work Remotely...');
    const wwrStartTime = Date.now();
    const wwrResponse = await axios.get('https://weworkremotely.com/', { 
      proxy: proxyConfig,
      timeout: 10000
    });
    const wwrEndTime = Date.now();
    
    console.log(`✅ Success! Status: ${wwrResponse.status}`);
    console.log(`Response time: ${wwrEndTime - wwrStartTime}ms`);
    
  } catch (error) {
    console.log('❌ Error testing proxy:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Headers: ${JSON.stringify(error.response.headers)}`);
    } else if (error.request) {
      console.log('No response received. Likely a connection error.');
    } else {
      console.log(`Error message: ${error.message}`);
    }
  }
}

/**
 * Mask sensitive parts of proxy URL for logging
 * @param {string} proxyUrl - The proxy URL to mask
 * @returns {string} - Masked proxy URL
 */
function maskProxy(proxyUrl) {
  try {
    // Replace password with asterisks
    return proxyUrl.replace(/(:\/\/)([^:]+):([^@]+)@/, '$1$2:****@');
  } catch (error) {
    return proxyUrl;
  }
}

// Run the test
testProxy().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 