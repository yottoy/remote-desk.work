const { chromium } = require('playwright');

async function analyzePagination() {
  console.log('Analyzing OnlineJobs.ph pagination...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  try {
    page.setDefaultTimeout(60000);
    
    console.log('Navigating to OnlineJobs.ph job search...');
    await page.goto('https://www.onlinejobs.ph/jobseekers/jobsearch', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(5000);
    
    // Count total jobs on first page
    const jobCount = await page.evaluate(() => {
      const jobs = document.querySelectorAll('.jobpost-cat-box');
      return jobs.length;
    });
    
    console.log(`Found ${jobCount} jobs on first page`);
    
    // Look for pagination elements
    const paginationInfo = await page.evaluate(() => {
      const results = [];
      
      // Look for common pagination patterns
      const selectors = [
        '.pagination', '[class*="pagination"]', '[class*="pager"]',
        'a[href*="page"]', 'a[href*="Page"]', 
        '.next', '.prev', '[class*="next"]', '[class*="prev"]',
        'input[name*="page"]', 'select[name*="page"]'
      ];
      
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach((el, index) => {
              if (index < 5) { // Limit to first 5 of each type
                results.push({
                  selector: selector,
                  tagName: el.tagName,
                  className: el.className,
                  id: el.id,
                  href: el.href || '',
                  text: el.textContent?.trim().substring(0, 100) || '',
                  innerHTML: el.innerHTML.substring(0, 200)
                });
              }
            });
          }
        } catch (e) {
          // Skip
        }
      });
      
      return results;
    });
    
    console.log('\nPagination elements found:');
    paginationInfo.forEach((info, index) => {
      console.log(`${index + 1}. Selector: ${info.selector}`);
      console.log(`   Tag: ${info.tagName}, Class: ${info.className}`);
      console.log(`   Text: ${info.text}`);
      console.log(`   Href: ${info.href}`);
      console.log('');
    });
    
    // Look for page numbers or total count
    const pageInfo = await page.evaluate(() => {
      const text = document.body.textContent;
      
      // Look for patterns like "Page 1 of 32", "1-30 of 942 jobs", etc.
      const patterns = [
        /page\s+\d+\s+of\s+\d+/gi,
        /\d+\s*-\s*\d+\s+of\s+\d+/gi,
        /showing\s+\d+\s*-\s*\d+\s+of\s+\d+/gi,
        /\d+\s+jobs?\s+found/gi,
        /total:\s*\d+/gi
      ];
      
      const matches = [];
      patterns.forEach(pattern => {
        const found = text.match(pattern);
        if (found) {
          matches.push(...found);
        }
      });
      
      return matches;
    });
    
    console.log('\nPage information found:');
    pageInfo.forEach((info, index) => {
      console.log(`${index + 1}. ${info}`);
    });
    
    // Try to find the next page link
    const nextPageLink = await page.evaluate(() => {
      const nextLinks = document.querySelectorAll('a');
      for (const link of nextLinks) {
        const text = link.textContent?.toLowerCase() || '';
        const href = link.href || '';
        if ((text.includes('next') || text.includes('>') || text === '2') && href.includes('page')) {
          return {
            text: link.textContent,
            href: link.href,
            className: link.className
          };
        }
      }
      return null;
    });
    
    if (nextPageLink) {
      console.log('\nNext page link found:');
      console.log(`Text: ${nextPageLink.text}`);
      console.log(`Href: ${nextPageLink.href}`);
      console.log(`Class: ${nextPageLink.className}`);
    } else {
      console.log('\nNo next page link found');
    }
    
  } catch (error) {
    console.error('Analysis failed:', error.message);
  } finally {
    await browser.close();
  }
}

analyzePagination().catch(console.error); 