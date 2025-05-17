// Pre-build verification for Vercel deployment
console.log('Verifying build configuration for Vercel deployment...');

const fs = require('fs');
const path = require('path');

// Check if we're in the correct directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('Error: package.json not found in current directory');
  process.exit(1);
}

// Verify package.json contains Next.js
const packageJson = require(packageJsonPath);
if (!packageJson.dependencies.next) {
  console.error('Error: Next.js not found in package.json dependencies');
  process.exit(1);
}

console.log('Next.js version:', packageJson.dependencies.next);
console.log('Build directory:', process.cwd());
console.log('Node.js version:', process.version);

// Verify the vercel.json file is in the correct location
const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  console.log('vercel.json found in current directory');
  console.log(fs.readFileSync(vercelJsonPath, 'utf8'));
} else {
  console.log('Warning: vercel.json not found in current directory');
}

console.log('Build verification completed.');
console.log('Ready to proceed with deployment.'); 