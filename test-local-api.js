// Use dynamic import for fetch
async function testLocalApiEndpoint() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    // Test both local and production endpoints
    const endpoints = [
      'http://localhost:3002/api/jobs/',
      'https://clickclickjob.vercel.app/api/jobs/'
    ];
    
    for (const apiUrl of endpoints) {
      console.log(`\nTesting API endpoint: ${apiUrl}`);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'ClickClickJob/1.0'
          }
        });
        
        if (!response.ok) {
          console.error(`API request failed with status ${response.status}`);
          continue;
        }
        
        const result = await response.json();
        
        // Check response format
        console.log('Response structure:', Object.keys(result));
        
        // Check if jobs array exists and has content
        if (result.jobs && Array.isArray(result.jobs)) {
          console.log('Number of jobs returned:', result.jobs.length);
          if (result.jobs.length > 0) {
            console.log('First job title:', result.jobs[0].title);
            console.log('Job fields:', Object.keys(result.jobs[0]));
          } else {
            console.log('WARNING: Jobs array is empty!');
          }
        } else if (Array.isArray(result)) {
          console.log('Response is an array with length:', result.length);
          if (result.length > 0) {
            console.log('First job title:', result[0].title);
            console.log('Job fields:', Object.keys(result[0]));
          } else {
            console.log('WARNING: Jobs array is empty!');
          }
        } else {
          console.log('WARNING: Response does not contain a jobs array!');
          console.log('Full response:', JSON.stringify(result, null, 2));
        }
        
        // Check pagination data if available
        if (result.pagination) {
          console.log('Pagination data:', result.pagination);
        }
      } catch (error) {
        console.error(`Error testing ${apiUrl}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error testing API endpoints:', error);
  }
}

testLocalApiEndpoint(); 