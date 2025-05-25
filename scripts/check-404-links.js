/**
 * Script to crawl the website and check for 404 links
 * This script will visit all pages on the website and report any broken links (404)
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Base URL for the website
const BASE_URL = 'https://www.clickclickjob.com';

// Store visited URLs to avoid checking duplicates
const visitedUrls = new Set();
// Store broken URLs
const brokenUrls = new Set();
// Store all URLs found on the site
const allUrls = new Set();
// Store URL source mapping (which page contains the broken link)
const urlSources = new Map();

/**
 * Check if a URL belongs to our website
 */
const isInternalUrl = (url) => {
  return url.startsWith(BASE_URL) || 
         url.startsWith('/') || 
         (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('#'));
};

/**
 * Normalize URL to avoid duplicates
 */
const normalizeUrl = (url, baseUrl) => {
  // Handle relative URLs
  if (url.startsWith('/')) {
    return `${BASE_URL}${url}`;
  } else if (!url.startsWith('http')) {
    if (url.startsWith('#') || url.startsWith('mailto:')) {
      return null; // Skip anchors and mailto links
    }
    // Handle URLs without leading slash
    return `${baseUrl}/${url}`;
  }
  
  // Return absolute URLs unchanged if they match our domain
  if (url.startsWith(BASE_URL)) {
    // Remove trailing slash for consistency
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
  
  // Return null for external URLs
  return null;
};

/**
 * Extract links from a page
 */
const extractLinks = async (page, sourceUrl) => {
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.href)
      .filter(href => href);
  });
  
  // Normalize and filter links
  links.forEach(url => {
    const normalizedUrl = normalizeUrl(url, sourceUrl);
    if (normalizedUrl) {
      allUrls.add(normalizedUrl);
      
      // Record the source of this URL
      if (!urlSources.has(normalizedUrl)) {
        urlSources.set(normalizedUrl, new Set());
      }
      urlSources.get(normalizedUrl).add(sourceUrl);
    }
  });
  
  return links.filter(url => {
    const normalizedUrl = normalizeUrl(url, sourceUrl);
    return normalizedUrl && !visitedUrls.has(normalizedUrl);
  }).map(url => normalizeUrl(url, sourceUrl));
};

/**
 * Crawl the website and check for 404 errors
 */
async function crawlSite() {
  console.log(`Starting website crawler to check for 404 links on ${BASE_URL}`);
  console.log('=====================================================================');
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Configure navigation timeout
    page.setDefaultNavigationTimeout(30000);
    
    // Start with the homepage
    const urlsToVisit = [BASE_URL];
    visitedUrls.add(BASE_URL);
    
    // Keep track of time
    const startTime = Date.now();
    
    // Track statistics
    let pagesVisited = 0;
    let linksChecked = 0;
    
    while (urlsToVisit.length > 0 && pagesVisited < 1000) { // Limit to 1000 pages for safety
      const currentUrl = urlsToVisit.shift();
      pagesVisited++;
      
      console.log(`\nChecking page ${pagesVisited}: ${currentUrl}`);
      
      try {
        // Navigate to the page
        const response = await page.goto(currentUrl, { waitUntil: 'networkidle2' });
        
        // Check if the page is accessible
        if (!response) {
          console.log(`❌ Failed to load: ${currentUrl}`);
          brokenUrls.add(currentUrl);
          continue;
        }
        
        const status = response.status();
        
        if (status === 404) {
          console.log(`❌ 404 Not Found: ${currentUrl}`);
          brokenUrls.add(currentUrl);
          continue;
        } else if (status >= 400) {
          console.log(`❌ Error ${status}: ${currentUrl}`);
          brokenUrls.add(currentUrl);
          continue;
        }
        
        console.log(`✅ Page loaded (${status}): ${currentUrl}`);
        
        // Extract all links from the page
        const links = await extractLinks(page, currentUrl);
        
        // Filter out already visited links
        const newLinks = links.filter(url => !visitedUrls.has(url));
        
        console.log(`Found ${newLinks.length} new internal links to check`);
        
        // Add new links to the queue
        newLinks.forEach(url => {
          if (!visitedUrls.has(url)) {
            urlsToVisit.push(url);
            visitedUrls.add(url);
            linksChecked++;
          }
        });
      } catch (error) {
        console.log(`❌ Error checking ${currentUrl}: ${error.message}`);
        brokenUrls.add(currentUrl);
      }
      
      // Simple progress report
      console.log(`Progress: Visited ${pagesVisited} pages, Found ${linksChecked} links, Broken: ${brokenUrls.size}`);
    }
    
    // Generate report
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n=====================================================================');
    console.log(`Crawl completed in ${duration.toFixed(2)} seconds`);
    console.log(`Total pages visited: ${pagesVisited}`);
    console.log(`Total links found: ${allUrls.size}`);
    console.log(`Total broken links: ${brokenUrls.size}`);
    
    // Prepare detailed report
    let report = '# Website 404 Links Report\n\n';
    report += `* **Date:** ${new Date().toLocaleString()}\n`;
    report += `* **Website:** ${BASE_URL}\n`;
    report += `* **Pages Visited:** ${pagesVisited}\n`;
    report += `* **Links Found:** ${allUrls.size}\n`;
    report += `* **Broken Links:** ${brokenUrls.size}\n\n`;
    
    if (brokenUrls.size > 0) {
      report += '## Broken Links\n\n';
      
      // Create sorted array of broken URLs
      const sortedBrokenUrls = Array.from(brokenUrls).sort();
      
      sortedBrokenUrls.forEach(url => {
        report += `### ${url}\n`;
        report += 'Found on pages:\n';
        
        // Get the pages where this broken URL was found
        const sources = urlSources.get(url) || new Set();
        Array.from(sources).forEach(source => {
          report += `* ${source}\n`;
        });
        
        report += '\n';
      });
    } else {
      report += '## No broken links found! 🎉\n';
    }
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Save the report
    const reportPath = path.join(reportsDir, `404-report-${new Date().toISOString().split('T')[0]}.md`);
    fs.writeFileSync(reportPath, report);
    
    console.log(`Report saved to ${reportPath}`);
    
    // Write list of broken URLs for quick fixes
    if (brokenUrls.size > 0) {
      const brokenListPath = path.join(reportsDir, 'broken-urls.txt');
      fs.writeFileSync(brokenListPath, Array.from(brokenUrls).join('\n'));
      console.log(`List of broken URLs saved to ${brokenListPath}`);
    }
    
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// Run the script
crawlSite().catch(err => {
  console.error(`Fatal error: ${err}`);
  process.exit(1);
}); 