// Script to verify job count on the All Jobs page
async function verifyJobsCount() {
  try {
    const { default: fetch } = await import('node-fetch');
    
    console.log('Verifying number of jobs on the All Jobs page...');
    console.log('--------------------------------------------------------');
    
    // 1. Check the page content
    const pageUrl = 'https://clickclickjob.vercel.app/jobs';
    console.log('1. Checking jobs page:', pageUrl);
    
    const pageResponse = await fetch(pageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ClickClickJob-Verifier/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!pageResponse.ok) {
      throw new Error(`Jobs page request failed with status ${pageResponse.status}`);
    }
    
    const html = await pageResponse.text();
    
    // Look for job count in title
    const countMatch = html.match(/(\d+) Remote Admin &amp; Data Entry Jobs/);
    const count = countMatch ? parseInt(countMatch[1]) : null;
    
    if (count !== null) {
      console.log(`Found job count in title: ${count} jobs`);
      
      if (count > 3) {
        console.log('✅ More than 3 jobs are being displayed');
      } else {
        console.log('❌ Still only showing 3 or fewer jobs');
      }
    } else {
      console.log('Unable to find job count in page title');
      
      // Alternative method: count job card elements
      const jobCardMatches = html.match(/border border-gray-200 rounded-lg/g);
      const jobCardCount = jobCardMatches ? jobCardMatches.length : 0;
      
      console.log(`Found approximately ${jobCardCount} job cards in the HTML`);
      
      if (jobCardCount > 3) {
        console.log('✅ More than 3 job cards found in the HTML');
      } else {
        console.log('❌ Only 3 or fewer job cards found in the HTML');
      }
    }
    
    // 2. Check the API response directly
    const apiUrl = 'https://clickclickjob.vercel.app/api/jobs';
    console.log('\n2. Checking API directly:', apiUrl);
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ClickClickJob-Verifier/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API request failed with status ${apiResponse.status}`);
    }
    
    const apiData = await apiResponse.json();
    
    if (apiData.jobs && Array.isArray(apiData.jobs)) {
      const apiJobCount = apiData.jobs.length;
      const totalJobCount = apiData.pagination?.totalJobs || apiJobCount;
      
      console.log(`API returned ${apiJobCount} jobs (${totalJobCount} total)`);
      
      if (apiJobCount > 3) {
        console.log('✅ API is returning more than 3 jobs');
      } else {
        console.log('❌ API is only returning 3 or fewer jobs');
      }
    } else {
      console.log('❌ API response does not contain a jobs array');
    }
    
    console.log('\n--------------------------------------------------------');
    console.log('Verification complete.');
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

verifyJobsCount(); 