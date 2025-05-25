// Use dynamic import for fetch
async function verifyJobListingsPage() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    console.log('Verifying job listings page on production...');
    console.log('--------------------------------------------------------');
    
    // Step 1: Check the job listings page
    const pageUrl = 'https://clickclickjob.vercel.app/jobs';
    console.log('1. Checking job listings page:', pageUrl);
    
    const pageResponse = await fetch(pageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ClickClickJob-Verifier/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!pageResponse.ok) {
      throw new Error(`Job listings page request failed with status ${pageResponse.status}`);
    }
    
    const pageHtml = await pageResponse.text();
    
    // Check if page HTML contains job listings using more lenient patterns
    const hasJobsHeading = pageHtml.includes('Remote Admin') || 
                           pageHtml.includes('Remote Jobs') ||
                           pageHtml.includes('Data Entry Jobs') ||
                           pageHtml.includes('Available Remote') ||
                           pageHtml.includes('Job</h2>') ||
                           pageHtml.includes('Jobs</h2>') ||
                           pageHtml.includes('font-semibold');
                           
    // Check for various patterns that would indicate job cards
    const hasJobCards = pageHtml.includes('JobCard_jobCard') || 
                        pageHtml.includes('class="border border-gray-200 rounded-lg') ||
                        pageHtml.includes('transition-shadow bg-white') ||
                        pageHtml.includes('View Job') ||
                        pageHtml.includes('Apply Now') ||
                        pageHtml.includes('/jobs/') ||
                        pageHtml.includes('High Quality');
    
    const hasUndefined = pageHtml.includes('undefined Remote');
    
    if (hasJobsHeading) {
      console.log('✅ Job listings page has a proper heading');
    } else {
      console.log('❌ Job listings page is missing a proper heading');
    }
    
    if (hasJobCards) {
      console.log('✅ Job listings page appears to display job cards');
    } else {
      console.log('❌ Job listings page does not appear to display job cards');
    }
    
    if (!hasUndefined) {
      console.log('✅ Job listings page does not contain "undefined" in the title');
    } else {
      console.log('❌ Job listings page has "undefined" in the title');
    }
    
    // Step 2: Check the API endpoint
    const apiUrl = 'https://clickclickjob.vercel.app/api/jobs/';
    console.log('\n2. Checking API endpoint directly:', apiUrl);
    
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
    if (apiResult.jobs && apiResult.jobs.length > 0) {
      console.log(`✅ API returned ${apiResult.jobs.length} jobs`);
      console.log('Sample job:', {
        title: apiResult.jobs[0].title,
        company: apiResult.jobs[0].company
      });
    } else {
      console.log('❌ API did not return jobs array or returned an empty array');
    }
    
    console.log('\n--------------------------------------------------------');
    console.log('Verification complete. Summary:');
    
    if (hasJobsHeading && hasJobCards && !hasUndefined && apiResult.jobs && apiResult.jobs.length > 0) {
      console.log('✅ VERIFICATION PASSED: Job listings page is working correctly');
    } else {
      console.log('❌ VERIFICATION FAILED: Issues found with job listings page');
      
      if (!hasJobsHeading || hasUndefined) {
        console.log('  - Issue with page headings or title');
      }
      
      if (!hasJobCards) {
        console.log('  - Job cards are not displaying properly');
      }
      
      if (!apiResult.jobs || apiResult.jobs.length === 0) {
        console.log('  - API is not returning jobs');
      }
    }
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

verifyJobListingsPage(); 