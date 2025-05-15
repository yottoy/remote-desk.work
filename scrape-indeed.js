// Ultra-minimal indeed scraper for debugging
console.log('=== STARTING INDEED SCRAPER MINIMAL DIAGNOSTIC ===');
console.log(`Current time: ${new Date().toUTCString()}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform} ${process.arch}`);

// Try to require only core modules
try {
  console.log('Loading core modules...');
  const path = require('path');
  const fs = require('fs');
  console.log('Core modules loaded successfully');
  
  // List files in current directory
  console.log('Files in current directory:');
  const files = fs.readdirSync(process.cwd());
  console.log(files.join(', '));
  
} catch (error) {
  console.error(`Error loading core modules: ${error.message}`);
  console.error(error.stack);
}

// Try to load external modules separately to identify any issues
try {
  console.log('Attempting to load axios...');
  const axios = require('axios');
  console.log('Axios loaded successfully');
} catch (error) {
  console.error(`Error loading axios: ${error.message}`);
}

// End script normally
console.log('=== INDEED SCRAPER DIAGNOSTIC COMPLETED ==='); 