#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing website fixes...');

// Test 1: Check if InternalLinking component is imported in job detail page
function testInternalLinkingImport() {
  console.log('📋 Testing InternalLinking component import...');
  
  const jobDetailPath = path.join(process.cwd(), 'src', 'pages', 'jobs', '[id].tsx');
  
  if (!fs.existsSync(jobDetailPath)) {
    console.error('❌ Job detail page not found');
    return false;
  }
  
  const content = fs.readFileSync(jobDetailPath, 'utf8');
  
  if (content.includes("import InternalLinking from '../../components/seo/InternalLinking';")) {
    console.log('✅ InternalLinking component is imported');
  } else {
    console.error('❌ InternalLinking component is not imported');
    return false;
  }
  
  if (content.includes('<InternalLinking')) {
    console.log('✅ InternalLinking component is used in the page');
  } else {
    console.error('❌ InternalLinking component is not used in the page');
    return false;
  }
  
  return true;
}

// Test 2: Check if job detail page redirects on missing jobs
function testJobNotFoundRedirect() {
  console.log('📋 Testing Job Not Found redirect logic...');
  
  const jobDetailPath = path.join(process.cwd(), 'src', 'pages', 'jobs', '[id].tsx');
  const content = fs.readFileSync(jobDetailPath, 'utf8');
  
  if (content.includes('redirect: {') && content.includes("destination: '/jobs'")) {
    console.log('✅ Job Not Found redirects to /jobs');
    return true;
  } else {
    console.error('❌ Job Not Found does not redirect properly');
    return false;
  }
}

// Test 3: Check if deployment fix script exists
function testDeploymentFixScript() {
  console.log('📋 Testing deployment fix script...');
  
  const scriptPath = path.join(process.cwd(), 'scripts', 'fix-deployment.js');
  
  if (fs.existsSync(scriptPath)) {
    console.log('✅ Deployment fix script exists');
    return true;
  } else {
    console.error('❌ Deployment fix script not found');
    return false;
  }
}

// Test 4: Check package.json scripts
function testPackageJsonScripts() {
  console.log('📋 Testing package.json scripts...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const requiredScripts = ['fix-deployment', 'clean-build', 'rebuild'];
  let allPresent = true;
  
  requiredScripts.forEach(script => {
    if (scripts[script]) {
      console.log(`✅ Script "${script}" is present`);
    } else {
      console.error(`❌ Script "${script}" is missing`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// Test 5: Check InternalLinking component types
function testInternalLinkingTypes() {
  console.log('📋 Testing InternalLinking component types...');
  
  const componentPath = path.join(process.cwd(), 'src', 'components', 'seo', 'InternalLinking.tsx');
  
  if (!fs.existsSync(componentPath)) {
    console.error('❌ InternalLinking component not found');
    return false;
  }
  
  const content = fs.readFileSync(componentPath, 'utf8');
  
  if (content.includes('Job | EnhancedJobListing')) {
    console.log('✅ InternalLinking component accepts both Job and EnhancedJobListing types');
    return true;
  } else {
    console.error('❌ InternalLinking component type definitions need updating');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting website fixes test suite...\n');
  
  const tests = [
    { name: 'InternalLinking Import', test: testInternalLinkingImport },
    { name: 'Job Not Found Redirect', test: testJobNotFoundRedirect },
    { name: 'Deployment Fix Script', test: testDeploymentFixScript },
    { name: 'Package.json Scripts', test: testPackageJsonScripts },
    { name: 'InternalLinking Types', test: testInternalLinkingTypes }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    try {
      if (test()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test "${name}" failed with error:`, error.message);
      failed++;
    }
    console.log(''); // Add spacing between tests
  }
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Website fixes are working correctly.');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    return false;
  }
}

// Run tests if this is the main module
runTests().then(success => {
  process.exit(success ? 0 : 1);
});

export { runTests }; 