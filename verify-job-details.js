// Use dynamic import for fetch
async function verifyJobDetails() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    console.log('Verifying job detail pages and apply buttons on production...');
    console.log('--------------------------------------------------------');
    
    // Step 1: Get job listing from API to extract a job ID
    const apiUrl = 'https://clickclickjob.vercel.app/api/jobs/';
    console.log('1. Fetching job listings from API endpoint:', apiUrl);
    
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
    
    // Check if we have jobs
    if (!apiResult.jobs || !apiResult.jobs.length) {
      throw new Error('No jobs found in API response');
    }
    
    // Get the first job for testing
    const testJob = apiResult.jobs[0];
    console.log(`✅ Found test job: "${testJob.title}" (ID: ${testJob._id})`);
    
    // Step 2: Check job detail page
    const jobDetailUrl = `https://clickclickjob.vercel.app/jobs/${testJob._id}`;
    console.log(`\n2. Checking job detail page: ${jobDetailUrl}`);
    
    const detailResponse = await fetch(jobDetailUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ClickClickJob-Verifier/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!detailResponse.ok) {
      throw new Error(`Job detail page request failed with status ${detailResponse.status}`);
    }
    
    const detailHtml = await detailResponse.text();
    
    // Check if job details are displayed
    const hasTitle = detailHtml.includes(testJob.title);
    const hasCompany = detailHtml.includes(testJob.company);
    const hasApplyButton = detailHtml.includes('Apply Now') || detailHtml.includes('Contact to Apply');
    
    if (hasTitle && hasCompany) {
      console.log(`✅ Job detail page is showing correctly for: "${testJob.title}"`);
    } else {
      console.log(`❌ Job detail page is not showing job information correctly`);
    }
    
    if (hasApplyButton) {
      console.log('✅ Apply button found on job detail page');
    } else {
      console.log('❌ Apply button not found on job detail page');
    }
    
    // Step 3: Check that the Apply button has a valid href
    const applyUrlMatch = detailHtml.match(/href="([^"]*)"[^>]*>(?:Apply Now|Contact to Apply)</);
    if (applyUrlMatch && applyUrlMatch[1]) {
      const applyUrl = applyUrlMatch[1];
      console.log(`✅ Apply button href: ${applyUrl}`);
      
      // Check if it's a valid URL or mailto link
      if (applyUrl.startsWith('http') || applyUrl.startsWith('mailto:')) {
        console.log('✅ Apply button has a valid URL or mailto link');
      } else {
        console.log('❌ Apply button has an invalid URL format');
      }
    } else {
      console.log('❌ Could not extract Apply button URL');
    }
    
    console.log('\n--------------------------------------------------------');
    console.log('Verification complete. Summary:');
    
    if (hasTitle && hasCompany && hasApplyButton && applyUrlMatch) {
      console.log('✅ VERIFICATION PASSED: Job detail pages and Apply buttons are working correctly.');
    } else {
      console.log('❌ VERIFICATION FAILED: Issues found with job detail pages or Apply buttons.');
      
      if (!hasTitle || !hasCompany) {
        console.log('  - Job information is not displaying correctly');
      }
      
      if (!hasApplyButton) {
        console.log('  - Apply button is missing');
      } else if (!applyUrlMatch) {
        console.log('  - Apply button does not have a valid URL');
      }
    }
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

verifyJobDetails(); 