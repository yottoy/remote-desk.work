// Use dynamic import for fetch
async function verifyFrontendJobDisplay() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    console.log('Verifying frontend job display on production...');
    console.log('----------------------------------------');
    
    // Step 1: Check API endpoint
    const apiUrl = 'https://clickclickjob.vercel.app/api/jobs/';
    console.log('1. Checking production API endpoint:', apiUrl);
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'ClickClickJob/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API request failed with status ${apiResponse.status}`);
    }
    
    const apiResult = await apiResponse.json();
    
    // Check API response structure
    if (apiResult.jobs && Array.isArray(apiResult.jobs)) {
      console.log('✅ API endpoint working: returned', apiResult.jobs.length, 'jobs');
      
      if (apiResult.jobs.length === 0) {
        console.log('⚠️ WARNING: API returned an empty jobs array');
      } else {
        const sampleJob = apiResult.jobs[0];
        console.log('   Sample job:', {
          title: sampleJob.title,
          company: sampleJob.company,
          id: sampleJob._id
        });
      }
    } else {
      console.log('❌ API endpoint not returning expected structure');
      console.log('   Response structure:', Object.keys(apiResult));
    }
    
    console.log('----------------------------------------');
    
    // Step 2: Check homepage rendering
    const homepageUrl = 'https://clickclickjob.vercel.app/';
    console.log('2. Checking homepage rendering:', homepageUrl);
    
    const pageResponse = await fetch(homepageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ClickClickJob-Verifier/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!pageResponse.ok) {
      throw new Error(`Homepage request failed with status ${pageResponse.status}`);
    }
    
    const htmlContent = await pageResponse.text();
    
    // Check if the HTML contains job titles or empty state messages
    const containsJobs = htmlContent.includes('Featured Jobs') && 
                         !htmlContent.includes('No jobs available');
    
    if (containsJobs) {
      console.log('✅ Homepage appears to be displaying jobs');
      
      // Check for specific job titles from the API response
      if (apiResult.jobs && apiResult.jobs.length > 0) {
        const jobTitles = apiResult.jobs.slice(0, 3).map(job => job.title);
        let foundJobTitles = 0;
        
        jobTitles.forEach(title => {
          if (htmlContent.includes(title)) {
            foundJobTitles++;
            console.log(`   Found job title in HTML: ${title}`);
          }
        });
        
        if (foundJobTitles > 0) {
          console.log(`✅ Found ${foundJobTitles} specific job titles in the HTML content`);
        } else {
          console.log('⚠️ Could not find specific job titles in the HTML content');
        }
      }
    } else {
      console.log('❌ Homepage does not appear to be displaying jobs');
      
      if (htmlContent.includes('No jobs available')) {
        console.log('   "No jobs available" message detected');
      }
      
      if (htmlContent.includes('Error loading jobs')) {
        console.log('   "Error loading jobs" message detected');
      }
    }
    
    console.log('----------------------------------------');
    console.log('Verification complete. Summary:');
    
    if (apiResult.jobs && apiResult.jobs.length > 0 && containsJobs) {
      console.log('✅ VERIFICATION PASSED: API is returning jobs and frontend appears to be displaying them');
      console.log('The fix has been successfully deployed and is working as expected.');
    } else if (apiResult.jobs && apiResult.jobs.length > 0 && !containsJobs) {
      console.log('⚠️ PARTIAL SUCCESS: API is returning jobs but frontend is not displaying them');
      console.log('Additional troubleshooting is needed for the frontend rendering.');
    } else if ((!apiResult.jobs || apiResult.jobs.length === 0) && !containsJobs) {
      console.log('❌ VERIFICATION FAILED: API is not returning jobs and frontend is not displaying them');
      console.log('The issue appears to be with the API or database connectivity.');
    }
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

verifyFrontendJobDisplay(); 