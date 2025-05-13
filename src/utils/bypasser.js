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

    // Add additional fingerprinting evasion
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en']
    });

    // Hide automation features
    Object.defineProperty(navigator, 'permissions', {
      get: () => ({
        query: () => Promise.resolve({ state: 'prompt' })
      })
    });
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
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Add random delays between actions to mimic human behavior
 * @param {number} min - Minimum delay in milliseconds
 * @param {number} max - Maximum delay in milliseconds
 * @returns {Promise<void>}
 */
async function randomDelay(min = 3000, max = 15000) {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  logger.debug(`Waiting for ${delay}ms to mimic human behavior`);
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
    const movesCount = Math.floor(Math.random() * 5) + 5; // Increased from 2 to 5 minimum moves
    
    logger.debug(`Performing ${movesCount} random mouse movements`);
    
    for (let i = 0; i < movesCount; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      await page.mouse.move(x, y);
      await randomDelay(500, 1500);
    }
    
    // Occasionally perform scrolling to mimic reading behavior
    if (Math.random() > 0.5) {
      const scrollAmount = Math.floor(Math.random() * 1000) + 200;
      await page.evaluate(scroll => window.scrollBy(0, scroll), scrollAmount);
      await randomDelay(1000, 3000);
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

/**
 * Modify DOM to hide automation footprints (run inside page context)
 * @param {import('playwright').Page} page - Playwright page
 */
async function hideAutomationFootprints(page) {
  await page.evaluate(() => {
    // Override the automation detection
    if (window.navigator.webdriver === true) {
      delete Object.getPrototypeOf(navigator).webdriver;
    }
    
    // Add a fake mouse cursor to the page to make it look more human
    const fakeCursor = document.createElement('div');
    fakeCursor.style.backgroundColor = 'red';
    fakeCursor.style.width = '5px';
    fakeCursor.style.height = '5px';
    fakeCursor.style.borderRadius = '50%';
    fakeCursor.style.position = 'absolute';
    fakeCursor.style.top = '0';
    fakeCursor.style.left = '0';
    fakeCursor.style.zIndex = '9999';
    fakeCursor.style.pointerEvents = 'none';
    document.body.appendChild(fakeCursor);
  });
}

/**
 * Simplified bypasser module for testing
 */
module.exports = {
  randomDelay: async (min, max) => {
    // Not needed for testing
  },
  
  performRandomMouseMovements: async (page) => {
    // Not needed for testing
  },
  
  configureBrowserForStealth: async (browser) => {
    // Not needed for testing
    return browser;
  }
}; 