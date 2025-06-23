// Use dynamic import for fetch
async function verifyAllJobsPage() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    console.log('Verifying that the All Jobs page does not show "Error loading jobs"...');
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
    
    // Check if the page contains error messages
    const hasErrorMessage = pageHtml.includes('Error loading jobs');
    const hasAnyJob = pageHtml.includes('Remote Admin') || 
                     pageHtml.includes('Data Entry') ||
                     pageHtml.includes('Virtual Assistant') ||
                     pageHtml.includes('Customer Support') ||
                     pageHtml.includes('/jobs/');
    
    console.log(`✅ Error message present: ${hasErrorMessage ? 'YES' : 'NO'}`);
    console.log(`✅ Jobs displayed: ${hasAnyJob ? 'YES' : 'NO'}`);
    
    console.log('\n--------------------------------------------------------');
    console.log('Verification complete. Summary:');
    
    if (!hasErrorMessage && hasAnyJob) {
      console.log('✅ VERIFICATION PASSED: All Jobs page is working correctly without errors');
    } else {
      console.log('❌ VERIFICATION FAILED: Issues found with All Jobs page');
      
      if (hasErrorMessage) {
        console.log('  - Error message "Error loading jobs" is still displayed');
      }
      
      if (!hasAnyJob) {
        console.log('  - No jobs appear to be displayed on the page');
      }
    }
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

verifyAllJobsPage(); 