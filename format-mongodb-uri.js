/**
 * Script to format a MongoDB Atlas URI with correct parameters
 * Usage: node format-mongodb-uri.js "your-mongodb-uri-here"
 */

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
        dbName = 'remote-jobs'; // Default database for this project
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
    optionsMap.tls = 'true';
    
    // Remove any TLS version restrictions
    delete optionsMap.tlsInsecure;
    delete optionsMap.tlsAllowInvalidCertificates;
    delete optionsMap.tlsAllowInvalidHostnames;
    delete optionsMap.tlsCAFile;
    delete optionsMap.tlsCertificateKeyFile;
    delete optionsMap.tlsCertificateKeyFilePassword;
    
    // Build options string
    const newOptions = Object.entries(optionsMap)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Build new URI
    const newUri = `${prefix}://${auth}@${host}/${dbName || 'remote-jobs'}?${newOptions}`;

    return {
      success: true,
      uri: newUri,
      message: 'URI formatted successfully with required parameters'
    };
  } catch (error) {
    return { success: false, message: `Error processing URI: ${error.message}` };
  }
}

// Get URI from command line argument
const uri = process.argv[2];

if (!uri) {
  console.error('Please provide a MongoDB Atlas URI as an argument');
  console.error('Usage: node format-mongodb-uri.js "mongodb+srv://username:password@cluster.mongodb.net"');
  process.exit(1);
}

const result = formatMongoDBURI(uri);

if (result.success) {
  console.log('\n✅ Formatted URI:');
  console.log(result.uri);
  console.log('\nMessage:', result.message);
  
  console.log('\n📋 Next steps:');
  console.log('1. Make sure MongoDB Atlas Network Access allows connections from anywhere (0.0.0.0/0)');
  console.log('2. Update the GitHub repository secret with this formatted URI');
  console.log('   Go to: https://github.com/yottoy/remote-desk.work/settings/secrets/actions');
  console.log('   - Update the MONGODB_URI secret with the formatted URI above');
  console.log('3. Re-run the GitHub workflow to test the connection');
} else {
  console.log('\n❌ Error:', result.message);
  console.log('Please check your MongoDB Atlas URI and try again.');
} 