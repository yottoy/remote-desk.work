/**
 * Helper script to format a MongoDB Atlas URI with correct parameters
 * 
 * Run this script with:
 * node update-mongodb-uri.js
 */

const fs = require('fs');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to safely parse and format MongoDB Atlas URI
function formatMongoDBURI(uri) {
  try {
    // Check if it's an Atlas URI
    if (!uri.startsWith('mongodb+srv://')) {
      return { success: false, message: 'Not a MongoDB Atlas URI (should start with mongodb+srv://)' };
    }

    // Parse the URI
    let [prefix, rest] = uri.split('://', 2);
    let authAndHost, options;

    if (rest.includes('?')) {
      [authAndHost, options] = rest.split('?', 2);
    } else {
      authAndHost = rest;
      options = '';
    }

    // Split auth and host
    let auth, host, dbName;
    if (authAndHost.includes('@')) {
      [auth, hostWithDb] = authAndHost.split('@', 2);
      
      // Check if there's a database name
      if (hostWithDb.includes('/')) {
        [host, dbName] = hostWithDb.split('/', 2);
      } else {
        host = hostWithDb;
        dbName = 'admin'; // Default database
      }
    } else {
      return { success: false, message: 'URI missing authentication information' };
    }

    // Ensure username and password
    if (!auth.includes(':')) {
      return { success: false, message: 'URI missing username:password format' };
    }

    // Parse options
    const optionsMap = {};
    if (options) {
      options.split('&').forEach(opt => {
        const [key, value] = opt.split('=', 2);
        optionsMap[key] = value;
      });
    }

    // Ensure necessary options
    optionsMap.retryWrites = 'true';
    optionsMap.w = 'majority';
    optionsMap.ssl = 'true';
    
    // Build options string
    const newOptions = Object.entries(optionsMap)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Build new URI
    const newUri = `${prefix}://${auth}@${host}/${dbName || 'admin'}?${newOptions}`;

    return {
      success: true,
      uri: newUri,
      message: 'URI formatted successfully with required parameters'
    };
  } catch (error) {
    return { success: false, message: `Error processing URI: ${error.message}` };
  }
}

// Ask for the MongoDB URI
rl.question('Enter your MongoDB Atlas URI (mongodb+srv://...): ', (uri) => {
  const result = formatMongoDBURI(uri.trim());
  
  if (result.success) {
    console.log('\n✅ Formatted URI:');
    console.log(result.uri);
    console.log('\nMessage:', result.message);
    
    // Ask if user wants to update .env file
    rl.question('\nDo you want to update your .env file with this URI? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        try {
          let envContent = '';
          
          // Try to read existing .env file
          try {
            envContent = fs.readFileSync('.env', 'utf8');
          } catch (err) {
            // File doesn't exist, will create new one
          }
          
          // Update or add MONGODB_URI
          if (envContent.includes('MONGODB_URI=')) {
            envContent = envContent.replace(/MONGODB_URI=.*(\r?\n|$)/, `MONGODB_URI=${result.uri}$1`);
          } else {
            envContent += `\nMONGODB_URI=${result.uri}\n`;
          }
          
          // Write updated content
          fs.writeFileSync('.env', envContent);
          console.log('\n✅ .env file updated successfully!');
          
          console.log('\n📋 Next steps:');
          console.log('1. Make sure MongoDB Atlas Network Access allows connections from anywhere (0.0.0.0/0)');
          console.log('2. Update the GitHub repository secret with this new URI');
          console.log('   Go to: https://github.com/yottoy/remote-desk.work/settings/secrets/actions');
          console.log('   - Update the MONGODB_URI secret with the formatted URI');
          console.log('3. Re-run the GitHub workflow to test the connection');
        } catch (err) {
          console.error('\n❌ Error updating .env file:', err.message);
        }
      }
      
      rl.close();
    });
  } else {
    console.log('\n❌ Error:', result.message);
    console.log('Please check your MongoDB Atlas URI and try again.');
    rl.close();
  }
}); 