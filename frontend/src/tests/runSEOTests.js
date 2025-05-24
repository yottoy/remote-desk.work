/**
 * SEO Landing Pages Test Runner
 * 
 * This script performs automated tests on the SEO landing pages
 * to verify functionality and performance.
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const { URL } = require('url');

// Keywords to test
const KEYWORDS = [
  'remote-data-entry-jobs-no-experience',
  'legitimate-work-from-home-admin-jobs',
  'virtual-assistant-jobs-part-time-remote',
  'entry-level-remote-administrative-assistant',
  'work-from-anywhere-data-entry-positions',
  'remote-executive-assistant-jobs-full-time',
  'online-administrative-jobs-no-scams',
  'beginner-friendly-remote-admin-positions'
];

// Base URL for testing
const BASE_URL = 'http://localhost:3002';

/**
 * Test a single keyword landing page
 * @param {string} keyword - The keyword to test
 * @param {puppeteer.Browser} browser - Puppeteer browser instance
 */
async function testKeywordPage(keyword, browser) {
  console.log(`\n🧪 Testing keyword page: ${keyword}`);
  
  const page = await browser.newPage();
  
  // Set viewport to desktop size
  await page.setViewport({ width: 1280, height: 800 });
  
  // Navigate to the keyword page
  const url = `${BASE_URL}/${keyword}`;
  console.log(`📄 Loading page: ${url}`);
  
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    if (!response.ok()) {
      console.error(`❌ Failed to load page: ${response.status()} ${response.statusText()}`);
      await page.close();
      return;
    }
    
    console.log(`✅ Page loaded successfully`);
    
    // Test 1: Check page title and meta description
    const title = await page.title();
    const metaDescription = await page.$eval('meta[name="description"]', el => el.content).catch(() => null);
    
    console.log(`📝 Page title: ${title}`);
    console.log(`📝 Meta description: ${metaDescription ? 'Present' : 'Missing'}`);
    
    // Test 2: Check for schema markup
    const schemaScript = await page.$('script[type="application/ld+json"]').catch(() => null);
    console.log(`📝 Schema markup: ${schemaScript ? 'Present' : 'Missing'}`);
    
    // Test 3: Check for job listings
    const jobCards = await page.$$('.job-card, [data-testid="job-card"]').catch(() => []);
    console.log(`📝 Job listings: ${jobCards.length} found`);
    
    // Test 4: Check for filters
    const filters = await page.$('.filters, [data-testid="job-filters"]').catch(() => null);
    console.log(`📝 Filters: ${filters ? 'Present' : 'Missing'}`);
    
    // Test 5: Check for timezone compatibility component
    const timezoneComponent = await page.$('[data-testid="timezone-compatibility"], .timezone-compatibility').catch(() => null);
    console.log(`📝 Timezone compatibility: ${timezoneComponent ? 'Present' : 'Missing'}`);
    
    // Test 6: Check for regional job market insights
    const marketInsights = await page.$('[data-testid="regional-job-market"], .regional-job-market').catch(() => null);
    console.log(`📝 Regional job market insights: ${marketInsights ? 'Present' : 'Missing'}`);
    
    // Test 7: Check for application guide
    const applicationGuide = await page.$('[data-testid="application-guide"], .application-guide').catch(() => null);
    console.log(`📝 Application guide: ${applicationGuide ? 'Present' : 'Missing'}`);
    
    // Test 8: Check for FAQ section
    const faqSection = await page.$('[data-testid="faq-section"], .faq-section').catch(() => null);
    console.log(`📝 FAQ section: ${faqSection ? 'Present' : 'Missing'}`);
    
    // Test 9: Check for email signup
    const emailSignup = await page.$('[data-testid="email-signup"], .email-signup').catch(() => null);
    console.log(`📝 Email signup: ${emailSignup ? 'Present' : 'Missing'}`);
    
    // Test 10: Check for legal disclaimers
    const legalDisclaimer = await page.$('[data-testid="legal-disclaimer"], .legal-disclaimer').catch(() => null);
    console.log(`📝 Legal disclaimers: ${legalDisclaimer ? 'Present' : 'Missing'}`);
    
    // Test 11: Test mobile responsiveness
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    console.log(`📝 Mobile viewport set: 375x667`);
    
    // Check if the menu is collapsed on mobile
    const mobileMenu = await page.$('.mobile-menu, [data-testid="mobile-menu"]').catch(() => null);
    console.log(`📝 Mobile menu: ${mobileMenu ? 'Present' : 'Missing'}`);
    
    // Test 12: Check analytics script
    const analyticsScript = await page.$('script[src*="google-analytics"], script[src*="gtag"]').catch(() => null);
    console.log(`📝 Analytics script: ${analyticsScript ? 'Present' : 'Missing'}`);
    
    await page.close();
    console.log(`✅ Testing completed for ${keyword}`);
  } catch (error) {
    console.error(`❌ Error testing ${keyword}:`, error.message);
    await page.close();
  }
}

/**
 * Run Lighthouse audit on a page
 * @param {string} url - The URL to audit
 * @param {puppeteer.Browser} browser - Puppeteer browser instance
 */
async function runLighthouseAudit(url, browser) {
  console.log(`\n🔍 Running Lighthouse audit for: ${url}`);
  
  try {
    const { lhr } = await lighthouse(url, {
      port: (new URL(browser.wsEndpoint())).port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    });
    
    console.log('Lighthouse scores:');
    console.log(`🚀 Performance: ${Math.round(lhr.categories.performance.score * 100)}`);
    console.log(`♿ Accessibility: ${Math.round(lhr.categories.accessibility.score * 100)}`);
    console.log(`👍 Best Practices: ${Math.round(lhr.categories['best-practices'].score * 100)}`);
    console.log(`🔍 SEO: ${Math.round(lhr.categories.seo.score * 100)}`);
    
    // Check Core Web Vitals
    const lcpScore = lhr.audits['largest-contentful-paint'].numericValue;
    const clsScore = lhr.audits['cumulative-layout-shift'].numericValue;
    const ttiScore = lhr.audits['interactive'].numericValue;
    
    console.log('\nCore Web Vitals:');
    console.log(`⚡ Largest Contentful Paint: ${Math.round(lcpScore)}ms ${lcpScore < 2500 ? '✅' : '❌'}`);
    console.log(`🔄 Cumulative Layout Shift: ${clsScore.toFixed(3)} ${clsScore < 0.1 ? '✅' : '❌'}`);
    console.log(`⌛ Time to Interactive: ${Math.round(ttiScore)}ms ${ttiScore < 3800 ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('Error running Lighthouse audit:', error.message);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting SEO Landing Pages Tests');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Test each keyword page
    for (const keyword of KEYWORDS) {
      await testKeywordPage(keyword, browser);
    }
    
    // Run Lighthouse audit on the first keyword page
    await runLighthouseAudit(`${BASE_URL}/${KEYWORDS[0]}`, browser);
    
    console.log('\n✅ All tests completed');
  } catch (error) {
    console.error('❌ Error running tests:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the tests
runTests().catch(console.error);
