/**
 * Utilities to help bypass anti-scraping protections
 */
const logger = require('./logger');

/**
 * Configure a browser instance to avoid detection
 * @param {import('playwright').Browser} browser - Playwright browser instance
 */
async function configureBrowserForStealth(browser) {
  const context = await browser.newContext({
    userAgent: getRandomUserAgent(),
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    hasTouch: false,
    javaScriptEnabled: true,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    geolocation: { longitude: -73.935242, latitude: 40.730610 },
    permissions: ['geolocation'],
    colorScheme: 'light',
    reducedMotion: 'no-preference'
  });

  // Add extra headers to seem more like a regular browser
  await context.setExtraHTTPHeaders({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  });

  // Script to modify navigator.webdriver to false to avoid bot detection
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    });
    
    // Randomize browser plugin info
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        return {
          length: Math.floor(Math.random() * 5) + 1
        };
      }
    });
    
    // Override common bot detection methods
    window.chrome = { runtime: {} };
  });

  return context;
}

/**
 * Get a random user agent string
 * @returns {string} User agent string
 */
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.39',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0'
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Add random delays between actions to mimic human behavior
 * @param {number} min - Minimum delay in milliseconds
 * @param {number} max - Maximum delay in milliseconds
 * @returns {Promise<void>}
 */
async function randomDelay(min = 1000, max = 5000) {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Perform random mouse movements on page to appear more human-like
 * @param {import('playwright').Page} page - Playwright page
 * @returns {Promise<void>}
 */
async function performRandomMouseMovements(page) {
  try {
    const { width, height } = page.viewportSize() || { width: 1920, height: 1080 };
    const movesCount = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < movesCount; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      await page.mouse.move(x, y);
      await randomDelay(300, 800);
    }
  } catch (error) {
    logger.debug(`Error in random mouse movements: ${error.message}`);
  }
}

/**
 * Use a rotating proxy if available
 * @param {string[]} proxyUrls - List of proxy URLs to use
 * @returns {string} A proxy URL
 */
function getRandomProxy(proxyUrls = []) {
  if (!proxyUrls || proxyUrls.length === 0) {
    return null;
  }
  
  return proxyUrls[Math.floor(Math.random() * proxyUrls.length)];
}

module.exports = {
  configureBrowserForStealth,
  getRandomUserAgent,
  randomDelay,
  performRandomMouseMovements,
  getRandomProxy
}; 