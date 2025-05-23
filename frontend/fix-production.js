// Fix production environment variables
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Fixing production environment variables...');

// Update next.config.js to ensure correct API URL handling
const nextConfigPath = path.join(__dirname, 'next.config.js');
let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

// Replace or add the environment variables
nextConfig = nextConfig.replace(
  /env: {[^}]*}/s,
  `env: {
    // Environment variables that will be available on the client side
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://www.clickclickjob.com',
    NEXT_PUBLIC_SITE_URL: 'https://www.clickclickjob.com',
    SITE_NAME: 'ClickClickJob.com',
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB || 'clickclickjob'
  }`
);

// Write the updated config
fs.writeFileSync(nextConfigPath, nextConfig);
console.log('Updated next.config.js with correct API URL');

// Update vercel.json to ensure proper routes and environment
const vercelJsonPath = path.join(__dirname, 'vercel.json');
const vercelConfig = {
  "version": 2,
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://www.clickclickjob.com",
    "NEXT_PUBLIC_SITE_URL": "https://www.clickclickjob.com",
    "MONGODB_DB": "clickclickjob"
  },
  "routes": [
    {
      "src": "/api/jobs/?(.*)", 
      "dest": "/api/jobs/$1",
      "headers": {
        "cache-control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
        "Access-Control-Allow-Origin": "*"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
};

fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2));
console.log('Updated vercel.json with correct configuration');

// Now build the project
console.log('Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

console.log('Fix completed. Now deploy with: vercel deploy --prod'); 