const { chromium } = require('playwright');

async function analyzePaginationDetailed() {
  console.log('Detailed OnlineJobs.ph pagination analysis...');
  
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
    
    // Get detailed pagination structure
    const paginationDetails = await page.evaluate(() => {
      const pagination = document.querySelector('.pagination');
      if (!pagination) return null;
      
      const links = pagination.querySelectorAll('a, li');
      const details = [];
      
      links.forEach((link, index) => {
        details.push({
          index: index,
          tagName: link.tagName,
          className: link.className,
          href: link.href || '',
          text: link.textContent?.trim() || '',
          innerHTML: link.innerHTML,
          hasHref: !!link.href
        });
      });
      
      return {
        paginationHTML: pagination.innerHTML,
        links: details
      };
    });
    
    if (paginationDetails) {
      console.log('\nPagination HTML structure:');
      console.log(paginationDetails.paginationHTML);
      
      console.log('\nPagination links:');
      paginationDetails.links.forEach((link, index) => {
        console.log(`${index + 1}. ${link.tagName} - "${link.text}"`);
        console.log(`   Class: ${link.className}`);
        console.log(`   Href: ${link.href}`);
        console.log(`   Has Href: ${link.hasHref}`);
        console.log('');
      });
      
      // Try to click on page 2
      console.log('Attempting to navigate to page 2...');
      
      const page2Link = await page.$('.pagination a[href*="page=2"], .pagination a:has-text("2")');
      if (page2Link) {
        console.log('Found page 2 link, clicking...');
        await page2Link.click();
        await page.waitForTimeout(5000);
        
        const newUrl = page.url();
        console.log(`New URL: ${newUrl}`);
        
        const newJobCount = await page.evaluate(() => {
          return document.querySelectorAll('.jobpost-cat-box').length;
        });
        
        console.log(`Jobs on page 2: ${newJobCount}`);
      } else {
        // Try alternative approach
        const allLinks = await page.$$('.pagination a');
        console.log(`Found ${allLinks.length} pagination links`);
        
        for (let i = 0; i < allLinks.length; i++) {
          const linkText = await allLinks[i].textContent();
          const linkHref = await allLinks[i].getAttribute('href');
          console.log(`Link ${i + 1}: "${linkText}" -> ${linkHref}`);
          
          if (linkText?.trim() === '2') {
            console.log('Clicking on page 2...');
            await allLinks[i].click();
            await page.waitForTimeout(5000);
            
            const newUrl = page.url();
            console.log(`New URL: ${newUrl}`);
            
            const newJobCount = await page.evaluate(() => {
              return document.querySelectorAll('.jobpost-cat-box').length;
            });
            
            console.log(`Jobs on page 2: ${newJobCount}`);
            break;
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Analysis failed:', error.message);
  } finally {
    await browser.close();
  }
}

analyzePaginationDetailed().catch(console.error); 