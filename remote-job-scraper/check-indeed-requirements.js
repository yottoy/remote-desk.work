const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const logger = require('./src/utils/logger');
const { chromium } = require('playwright');

// Load environment variables
dotenv.config();

/**
 * Check system requirements for Indeed scraper
 */
async function checkIndeedRequirements() {
  console.log('🔍 Checking system requirements for Indeed scraper...\n');
  
  // Results object
  const results = {
    playwright: false,
    browser: false,
    apiKey: false,
    configEnabled: false,
    overall: false
  };
  
  // Check for Playwright
  try {
    console.log('Checking for Playwright installation...');
    const { chromium } = require('playwright');
    console.log('✅ Playwright is installed');
    results.playwright = true;
  } catch (error) {
    console.log(`❌ Playwright is not installed: ${error.message}`);
    console.log('   Run: npm install playwright');
    results.playwright = false;
  }
  
  // Check for browser
  try {
    console.log('\nChecking if browser can be launched...');
    const browser = await chromium.launch({ headless: true }).catch(e => null);
    
    if (browser) {
      console.log('✅ Browser launched successfully');
      results.browser = true;
      await browser.close();
    } else {
      console.log('❌ Browser could not be launched');
      console.log('   Run: npx playwright install chromium');
      results.browser = false;
    }
  } catch (error) {
    console.log(`❌ Browser launch error: ${error.message}`);
    console.log('   Run: npx playwright install');
    results.browser = false;
  }
  
  // Check for API key
  try {
    console.log('\nChecking for Indeed API key...');
    const apiKey = process.env.INDEED_API_KEY;
    
    if (apiKey && apiKey.length > 0 && apiKey !== 'your_indeed_publisher_id_here') {
      console.log('✅ Indeed API key found in .env file');
      results.apiKey = true;
    } else {
      console.log('❌ Indeed API key not found or not set');
      console.log('   Add INDEED_API_KEY=your_key to your .env file');
      console.log('   Get an API key at https://www.indeed.com/publisher');
      results.apiKey = false;
    }
  } catch (error) {
    console.log(`❌ Error checking API key: ${error.message}`);
    results.apiKey = false;
  }
  
  // Check if enabled in config
  try {
    console.log('\nChecking if Indeed scraper is enabled in config...');
    const config = require('./config/config');
    const enabled = config.sources.indeed?.enabled === true;
    
    if (enabled) {
      console.log('✅ Indeed scraper is enabled in config');
      results.configEnabled = true;
    } else {
      console.log('❌ Indeed scraper is disabled in config');
      console.log('   Add ENABLE_INDEED_SCRAPER=true to your .env file');
      console.log('   or update config.js to enable it');
      results.configEnabled = false;
    }
  } catch (error) {
    console.log(`❌ Error checking config: ${error.message}`);
    results.configEnabled = false;
  }
  
  // Calculate overall status
  results.overall = results.playwright && results.browser && 
                    (results.apiKey || results.configEnabled);
  
  // Print summary
  console.log('\n=== Indeed Scraper Requirements Summary ===');
  console.log(`Playwright installed:    ${results.playwright ? '✅' : '❌'}`);
  console.log(`Browser available:       ${results.browser ? '✅' : '❌'}`);
  console.log(`API key configured:      ${results.apiKey ? '✅' : '❌'}`);
  console.log(`Enabled in config:       ${results.configEnabled ? '✅' : '❌'}`);
  console.log(`Overall status:          ${results.overall ? '✅ READY' : '❌ NOT READY'}`);
  
  if (!results.overall) {
    console.log('\n⚠️  The Indeed scraper may not function correctly.');
    console.log('   See INDEED-SCRAPING-REPORT.md for more information.');
  } else {
    console.log('\n✅ Your system meets the requirements for the Indeed scraper.');
    console.log('   However, note that Indeed uses strong anti-bot measures');
    console.log('   that may still prevent successful scraping.');
  }
  
  return results;
}

// Run the check
checkIndeedRequirements().catch(console.error); 