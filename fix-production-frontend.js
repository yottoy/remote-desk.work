const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('Starting production frontend fix script...');

// Path to index page
const indexPath = path.join(__dirname, 'frontend', 'src', 'pages', 'index.tsx');

// Read the current content
console.log(`Reading file: ${indexPath}`);
fs.readFile(indexPath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading index.tsx: ${err.message}`);
    process.exit(1);
  }

  // Change getStaticProps to getServerSideProps to ensure fresh data on each request
  console.log('Updating index.tsx to use getServerSideProps instead of getStaticProps');
  let updatedContent = data.replace(/export const getStaticProps.*?revalidate: \d+\s*\}\s*\};/s, 
  `export const getServerSideProps = async () => {
  try {
    // Use absolute API URL with environment variable fallbacks
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                   process.env.API_URL || 
                   process.env.VERCEL_URL ? \`https://\${process.env.VERCEL_URL}\` : 
                   'http://localhost:3000';
    
    // Fetch featured jobs from API with a clear API path
    const apiUrl = \`\${baseUrl}/api/jobs/\`;
    console.log('Fetching jobs from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'ClickClickJob/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(\`API request failed with status \${response.status}\`);
    }
    
    const result = await response.json();
    console.log('API Response structure:', Object.keys(result));
    
    // Extract jobs from the response, handling both array and object formats
    let jobs = [];
    if (Array.isArray(result)) {
      console.log('Result is an array with length:', result.length);
      jobs = result;
    } else if (result.jobs && Array.isArray(result.jobs)) {
      console.log('Result contains jobs array with length:', result.jobs.length);
      jobs = result.jobs;
    } else {
      console.warn('Unexpected API response format:', result);
      jobs = [];
    }
    
    console.log(\`Processed \${jobs.length} jobs for display\`);
    if (jobs.length > 0) {
      console.log('First job sample:', {
        id: jobs[0]._id,
        title: jobs[0].title,
        company: jobs[0].company,
        fields: Object.keys(jobs[0])
      });
    }
    
    return {
      props: {
        featuredJobs: jobs.slice(0, 6) // Ensure we only get at most 6 jobs
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        featuredJobs: [],
        error: error instanceof Error ? error.message : 'Failed to load jobs'
      }
    };
  }
};`);

  // Update Next.js config to disable static generation for API routes
  console.log('Writing updated content to index.tsx');
  fs.writeFile(indexPath, updatedContent, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing to index.tsx: ${err.message}`);
      process.exit(1);
    }
    
    // Now update the Next.js config to ensure proper API handling
    const nextConfigPath = path.join(__dirname, 'frontend', 'next.config.js');
    console.log(`Reading file: ${nextConfigPath}`);
    
    fs.readFile(nextConfigPath, 'utf8', (err, configData) => {
      if (err) {
        console.error(`Error reading next.config.js: ${err.message}`);
        process.exit(1);
      }
      
      // Update the API_URL to ensure it's properly set
      let updatedConfig = configData.replace(
        /API_URL: process\.env\.API_URL \|\| ['"]http:\/\/localhost:3000\/api['"]/,
        `API_URL: process.env.API_URL || process.env.VERCEL_URL ? \`https://\${process.env.VERCEL_URL}/api\` : 'http://localhost:3000/api'`
      );
      
      // Make sure cache headers don't prevent fresh data
      updatedConfig = updatedConfig.replace(
        /'Cache-Control',\s*value: ['"]public, max-age=\d+, s-maxage=\d+, stale-while-revalidate=\d+['"]/,
        `'Cache-Control', value: 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'`
      );
      
      console.log('Writing updated content to next.config.js');
      fs.writeFile(nextConfigPath, updatedConfig, 'utf8', (err) => {
        if (err) {
          console.error(`Error writing to next.config.js: ${err.message}`);
          process.exit(1);
        }
        
        console.log('Frontend files have been updated successfully.');
        console.log('To apply changes to production, run:');
        console.log('  cd frontend && npm run build && npx vercel --prod');
      });
    });
  });
}); 