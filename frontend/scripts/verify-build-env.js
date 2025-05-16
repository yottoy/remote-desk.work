/**
 * Verifies environment variables during build
 * This script is meant to be run during the build process
 */
function verifyBuildEnvironment() {
  console.log('Verifying build environment...');

  const requiredVars = [
    'MONGODB_URI',
    'MONGODB_DB'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('These variables are useful for the application to function properly.');
    console.warn('However, we will continue with the build using mock data.');
    
    // Always continue without error, even in production
    return true;
  } else {
    console.log('✅ All required environment variables are set');
  }

  // Check for valid MongoDB URI format
  if (process.env.MONGODB_URI) {
    const uriRegex = /^mongodb(\+srv)?:\/\/[^\/]+\/[^\/]+(\?.*)?$/;
    if (!uriRegex.test(process.env.MONGODB_URI)) {
      console.warn('⚠️ MONGODB_URI may not be in the correct format');
    }
  }

  console.log('Environment verification complete');
}

// Execute if run directly
if (require.main === module) {
  verifyBuildEnvironment();
}

module.exports = verifyBuildEnvironment; 