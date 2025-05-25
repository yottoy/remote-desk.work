const fs = require('fs');
const path = require('path');

function createEnvFile() {
  const envContent = `# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/clickclickjob
MONGODB_DB=clickclickjob
API_URL=http://localhost:3000/api
`;

  const envPath = path.join(__dirname, 'frontend', '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`Created environment file at ${envPath}`);
    console.log('\nEnvironment configuration:');
    console.log(envContent);
    console.log('\nThis should fix the API endpoint URL for the frontend.');
    console.log('Now restart the frontend server with:');
    console.log('cd frontend && npm run dev');
  } catch (error) {
    console.error(`Error creating environment file: ${error.message}`);
  }
}

createEnvFile(); 