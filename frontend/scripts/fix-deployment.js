#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Running deployment fixes...');

// 1. Clean build artifacts
function cleanBuildArtifacts() {
  console.log('📁 Cleaning build artifacts...');
  const buildDirs = ['.next', 'dist', 'build'];
  
  buildDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Cleaned ${dir}/`);
    }
  });
}

// 2. Verify environment variables
function verifyEnvironment() {
  console.log('🌍 Verifying environment variables...');
  
  const requiredEnvs = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_SITE_URL',
    'MONGODB_URI'
  ];
  
  const missing = requiredEnvs.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
  } else {
    console.log('✅ Environment variables verified');
  }
}

// 3. Generate build manifest
function generateBuildManifest() {
  console.log('📝 Generating build manifest...');
  
  const buildId = process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString();
  const manifestPath = path.join(process.cwd(), 'public', '_buildManifest.json');
  
  const manifest = {
    buildId,
    timestamp: new Date().toISOString(),
    version: require('../package.json').version
  };
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Build manifest created with ID: ${buildId}`);
}

// 4. Fix static asset paths
function fixStaticAssets() {
  console.log('🔗 Fixing static asset paths...');
  
  // Ensure public directory structure is correct
  const publicDirs = ['images', 'icons', 'robots.txt', 'sitemap.xml'];
  
  publicDirs.forEach(item => {
    const itemPath = path.join(process.cwd(), 'public', item);
    if (item.includes('.')) {
      // It's a file
      if (!fs.existsSync(itemPath)) {
        console.log(`⚠️  Missing public file: ${item}`);
      }
    } else {
      // It's a directory
      if (!fs.existsSync(itemPath)) {
        fs.mkdirSync(itemPath, { recursive: true });
        console.log(`✅ Created public directory: ${item}/`);
      }
    }
  });
}

// Main execution
async function main() {
  try {
    cleanBuildArtifacts();
    verifyEnvironment();
    generateBuildManifest();
    fixStaticAssets();
    
    console.log('🎉 Deployment fixes completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Run: npm run build');
    console.log('   2. Run: npm run start');
    console.log('   3. Test the deployment');
    
  } catch (error) {
    console.error('❌ Deployment fix failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanBuildArtifacts, verifyEnvironment, generateBuildManifest, fixStaticAssets }; 