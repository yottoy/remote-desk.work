const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const logger = require('./src/utils/logger');

// Load environment variables
dotenv.config();

/**
 * Check system requirements for Monster scraper
 */
async function checkMonsterRequirements() {
  console.log('🔍 Checking system requirements for Monster scraper...\n');
  
  // Results object
  const results = {
    axios: false,
    apiKey: false,
    configEnabled: false,
    overall: false
  };
  
  // Check for Axios
  try {
    console.log('Checking for Axios installation...');
    const axios = require('axios');
    console.log('✅ Axios is installed');
    results.axios = true;
  } catch (error) {
    console.log(`❌ Axios is not installed: ${error.message}`);
    console.log('   Run: npm install axios');
    results.axios = false;
  }
  
  // Check for API key
  try {
    console.log('\nChecking for Monster API key...');
    const apiKey = process.env.MONSTER_API_KEY;
    
    if (apiKey && apiKey.length > 0 && apiKey !== 'your_monster_api_key_here') {
      console.log('✅ Monster API key found in .env file');
      results.apiKey = true;
    } else {
      console.log('❌ Monster API key not found or not set');
      console.log('   Add MONSTER_API_KEY=your_key to your .env file');
      console.log('   Get an API key by registering as a Monster API partner at https://partner.monster.com/developers');
      results.apiKey = false;
    }
  } catch (error) {
    console.log(`❌ Error checking API key: ${error.message}`);
    results.apiKey = false;
  }
  
  // Check if enabled in config
  try {
    console.log('\nChecking if Monster scraper is enabled in config...');
    const config = require('./config/config');
    const enabled = config.sources.monster?.enabled === true;
    
    if (enabled) {
      console.log('✅ Monster scraper is enabled in config');
      results.configEnabled = true;
    } else {
      console.log('❌ Monster scraper is disabled in config');
      console.log('   Add ENABLE_MONSTER_SCRAPER=true to your .env file');
      console.log('   or update config.js to enable it');
      results.configEnabled = false;
    }
  } catch (error) {
    console.log(`❌ Error checking config: ${error.message}`);
    results.configEnabled = false;
  }
  
  // Calculate overall status
  results.overall = results.axios && (results.apiKey || results.configEnabled);
  
  // Print summary
  console.log('\n=== Monster Scraper Requirements Summary ===');
  console.log(`Axios installed:         ${results.axios ? '✅' : '❌'}`);
  console.log(`API key configured:      ${results.apiKey ? '✅' : '❌'}`);
  console.log(`Enabled in config:       ${results.configEnabled ? '✅' : '❌'}`);
  console.log(`Overall status:          ${results.overall ? '✅ READY' : '❌ NOT READY'}`);
  
  if (!results.overall) {
    console.log('\n⚠️  The Monster scraper may not function correctly.');
    console.log('   Please address the issues above before using it.');
  } else {
    console.log('\n✅ Your system meets the requirements for the Monster scraper.');
    console.log('   Please note that you will need a valid API key from Monster');
    console.log('   to use their official API for job data.');
  }
  
  return results;
}

// Run the check
checkMonsterRequirements().catch(console.error); 