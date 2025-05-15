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
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('These variables are necessary for the application to function properly.');
    
    if (process.env.NODE_ENV === 'production') {
      console.error('In production, these should be set in your Vercel project settings.');
      // Exit with error in production to prevent broken deployments
      process.exit(1);
    } else {
      console.warn('⚠️ Development mode: continuing despite missing variables');
    }
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