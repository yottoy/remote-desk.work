// Script to debug the API jobs endpoint
async function debugApiJobs() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    console.log('Debugging API jobs endpoint...');
    console.log('--------------------------------------------------------');
    
    // 1. Check the direct API endpoint
    const apiUrl = 'https://clickclickjob.vercel.app/api/jobs';
    console.log('1. Checking API endpoint:', apiUrl);
    
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
      console.error(`API request failed with status ${response.status}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    
    // Log response structure
    console.log('API response keys:', Object.keys(result));
    
    // Check if we have a jobs array
    if (result.jobs && Array.isArray(result.jobs)) {
      console.log(`✅ API returned ${result.jobs.length} jobs`);
      console.log('First 3 jobs:');
      result.jobs.slice(0, 3).forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.title} at ${job.company}`);
      });
      
      // Check if we have pagination info
      if (result.pagination) {
        console.log('Pagination info:');
        console.log(`  Total jobs: ${result.pagination.totalJobs}`);
        console.log(`  Total pages: ${result.pagination.totalPages}`);
        console.log(`  Current page: ${result.pagination.currentPage}`);
        console.log(`  Limit: ${result.pagination.limit}`);
      }
    } else {
      console.log('❌ API response does not contain a jobs array');
    }
    
    // 2. Check the API with the isRemote filter explicitly set to true
    const apiUrlWithFilter = 'https://clickclickjob.vercel.app/api/jobs?isRemote=true';
    console.log('\n2. Checking API with explicit isRemote filter:', apiUrlWithFilter);
    
    const filterResponse = await fetch(apiUrlWithFilter, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'ClickClickJob/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!filterResponse.ok) {
      console.error(`Filter API request failed with status ${filterResponse.status}`);
    } else {
      const filterResult = await filterResponse.json();
      
      if (filterResult.jobs && Array.isArray(filterResult.jobs)) {
        console.log(`✅ Filter API returned ${filterResult.jobs.length} jobs`);
      } else {
        console.log('❌ Filter API response does not contain a jobs array');
      }
    }
    
    // 3. Check the API with a higher limit
    const apiUrlWithLimit = 'https://clickclickjob.vercel.app/api/jobs?limit=100';
    console.log('\n3. Checking API with higher limit:', apiUrlWithLimit);
    
    const limitResponse = await fetch(apiUrlWithLimit, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'ClickClickJob/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!limitResponse.ok) {
      console.error(`Limit API request failed with status ${limitResponse.status}`);
    } else {
      const limitResult = await limitResponse.json();
      
      if (limitResult.jobs && Array.isArray(limitResult.jobs)) {
        console.log(`✅ Limit API returned ${limitResult.jobs.length} jobs`);
      } else {
        console.log('❌ Limit API response does not contain a jobs array');
      }
    }
    
    console.log('\n--------------------------------------------------------');
    console.log('Debug complete.');
    
  } catch (error) {
    console.error('Error during debugging:', error.message);
  }
}

debugApiJobs(); 