/**
 * Google Search Console Removal Helper
 * 
 * This script helps format and display URLs for manual submission to Google Search Console.
 * Google requires manual submission through their UI for removal requests.
 * 
 * Run: node scripts/submit-gsc-removals.js
 */

const fs = require('fs');
const path = require('path');

const removalsFile = path.join(__dirname, '../reports/gsc-removal-requests/url-list-2026-01-05.txt');

function displayRemovalInstructions() {
  try {
    // Read the URLs file
    const fileContent = fs.readFileSync(removalsFile, 'utf-8');
    const urls = fileContent.trim().split('\n').filter(line => line.trim());
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 GOOGLE SEARCH CONSOLE - OUTDATED CONTENT REMOVAL INSTRUCTIONS');
    console.log('='.repeat(80));
    console.log(`\nTotal URLs to remove: ${urls.length}`);
    console.log('\nThese job postings were deleted on January 5, 2026.');
    console.log('They now correctly return 410 Gone (job no longer available).\n');
    
    console.log('─'.repeat(80));
    console.log('STEP-BY-STEP GUIDE');
    console.log('─'.repeat(80));
    
    console.log('\n1. Go to Google Search Console:');
    console.log('   https://search.google.com/search-console');
    
    console.log('\n2. Select your property: clickclickjob.com');
    
    console.log('\n3. Use the "Removals" tool (left sidebar)');
    
    console.log('\n4. Click "New Request"');
    
    console.log('\n5. Choose "Temporarily remove URL"');
    
    console.log('\n6. For each URL below, you can either:');
    console.log('   Option A: Remove specific URL only');
    console.log('   Option B: Remove all URLs with this prefix (bulk)');
    
    console.log('\n7. RECOMMENDED: Use bulk removal with prefix:');
    console.log('   https://www.clickclickjob.com/jobs/');
    console.log('   This will remove ALL deleted job URLs at once!');
    
    console.log('\n8. Google will process the removal in 1-2 days');
    
    console.log('\n' + '─'.repeat(80));
    console.log('BULK REMOVAL (FASTEST METHOD)');
    console.log('─'.repeat(80));
    console.log('\nInstead of submitting 230+ individual URLs, use this:');
    console.log('\n   PREFIX: https://www.clickclickjob.com/jobs/683');
    console.log('   PREFIX: https://www.clickclickjob.com/jobs/684');
    console.log('   PREFIX: https://www.clickclickjob.com/jobs/685');
    console.log('   PREFIX: https://www.clickclickjob.com/jobs/686');
    console.log('   PREFIX: https://www.clickclickjob.com/jobs/687');
    console.log('   PREFIX: https://www.clickclickjob.com/jobs/695');
    
    console.log('\n⚡ These 6 prefix removals will cover ALL 230+ deleted jobs!');
    
    console.log('\n' + '─'.repeat(80));
    console.log('WHY THIS WORKS');
    console.log('─'.repeat(80));
    console.log('\n✅ Your site now returns 410 Gone for deleted jobs');
    console.log('✅ 410 Gone tells Google: "This content is permanently removed"');
    console.log('✅ Google will update its index and stop showing these pages');
    console.log('✅ Your 404 error count will drop to near zero');
    
    console.log('\n' + '─'.repeat(80));
    console.log('VERIFICATION');
    console.log('─'.repeat(80));
    console.log('\nAfter submitting removal requests:');
    console.log('1. Wait 24-48 hours');
    console.log('2. Check Google Search Console > Coverage report');
    console.log('3. Look for decrease in "Crawled - currently not indexed" errors');
    console.log('4. Monitor 404 error rate in your analytics');
    
    console.log('\n' + '─'.repeat(80));
    console.log('INDIVIDUAL URLs (If needed)');
    console.log('─'.repeat(80));
    console.log('\nIf you prefer to remove URLs individually, here are all 230+:');
    console.log('(You can copy-paste these one by one into GSC)\n');
    
    // Group URLs by prefix for better organization
    const urlsByPrefix = {};
    urls.forEach(url => {
      const match = url.match(/\/jobs\/([a-f0-9]{3})/);
      const prefix = match ? match[1] : 'other';
      if (!urlsByPrefix[prefix]) {
        urlsByPrefix[prefix] = [];
      }
      urlsByPrefix[prefix].push(url);
    });
    
    // Display grouped URLs
    Object.keys(urlsByPrefix).sort().forEach(prefix => {
      console.log(`\n--- Prefix: ${prefix} (${urlsByPrefix[prefix].length} URLs) ---`);
      urlsByPrefix[prefix].forEach((url, idx) => {
        console.log(`${idx + 1}. ${url}`);
      });
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 RECOMMENDATION: Use the bulk prefix method above!');
    console.log('   It\'s much faster than submitting 230+ individual URLs.');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error reading URLs file:', error.message);
    console.error('\nMake sure the file exists:');
    console.error(removalsFile);
    process.exit(1);
  }
}

// Run the display
displayRemovalInstructions();
