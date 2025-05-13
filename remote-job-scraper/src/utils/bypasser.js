/**
 * Utilities to help bypass anti-scraping protections
 */
const logger = require('./logger');

/**
 * Configure browser for stealth mode
 * @param {Object} browser - Playwright browser instance
 * @returns {Object} - Configured browser context
 */
async function configureBrowserForStealth(browser) {
  try {
    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      hasTouch: false,
      isMobile: false,
      deviceScaleFactor: 1,
      bypassCSP: true,
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: [],
      geolocation: { latitude: 40.7128, longitude: -74.0060 }, // New York
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      forcedColors: 'none',
      acceptDownloads: true,
      defaultBrowserType: 'chromium',
      ignoreHTTPSErrors: true
    });
    
    return context;
  } catch (error) {
    logger.error(`Error configuring stealth browser: ${error.message}`);
    throw error;
  }
}

/**
 * Hide automation footprints by executing browser scripts
 * @param {Object} page - Playwright page
 */
async function hideAutomationFootprints(page) {
  try {
    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      delete Object.getPrototypeOf(navigator).webdriver;
    });
    
    // Modify user agent to remove automation hints
    await page.evaluateOnNewDocument(() => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        get: function() {
          return originalUserAgent.replace('Headless', '');
        }
      });
    });
    
    // Hide automation-related properties
    await page.evaluateOnNewDocument(() => {
      window.navigator.chrome = {
        runtime: {},
      };
      
      // Fake plugins
      const originalPlugins = navigator.plugins;
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          if (originalPlugins.length === 0) {
            return [1, 2, 3, 4, 5].map(() => ({
              name: `Plugin ${Math.floor(Math.random() * 10000)}`,
              description: 'Fake plugin',
              filename: `plugin_${Math.floor(Math.random() * 10000)}.dll`,
              length: 1
            }));
          }
          return originalPlugins;
        },
      });
      
      // Fake languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'es', 'fr'],
      });
    });
  } catch (error) {
    logger.error(`Error hiding automation footprints: ${error.message}`);
  }
}

/**
 * Add a random delay to mimic human behavior
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {Promise} - Promise that resolves after the delay
 */
async function randomDelay(min = 1000, max = 5000) {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Perform random mouse movements on the page to appear more human-like
 * @param {Object} page - Playwright page
 */
async function performRandomMouseMovements(page) {
  try {
    const { width, height } = page.viewportSize() || { width: 1280, height: 800 };
    
    const numMovements = Math.floor(Math.random() * 5) + 3; // 3-7 movements
    
    for (let i = 0; i < numMovements; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      await page.mouse.move(x, y, { steps: 10 });
      await randomDelay(200, 800);
    }
  } catch (error) {
    logger.error(`Error performing random mouse movements: ${error.message}`);
  }
}

/**
 * Handle cookie consent and privacy popups
 * @param {Object} page - Playwright page
 */
async function handleCookieConsent(page) {
  try {
    // List of common cookie consent button selectors
    const selectors = [
      'button[id*="accept"]',
      'button[class*="accept"]',
      'a[id*="accept"]',
      'a[class*="accept"]',
      'button:has-text("Accept")',
      'button:has-text("Accept All")',
      'button:has-text("I Agree")',
      'button:has-text("OK")',
      '[id*="cookie"] button',
      '[class*="cookie"] button',
      '[id*="gdpr"] button',
      '[class*="gdpr"] button',
      '[id*="consent"] button',
      '[class*="consent"] button'
    ];
    
    // Try each selector
    for (const selector of selectors) {
      try {
        const buttonVisible = await page.isVisible(selector, { timeout: 1000 });
        if (buttonVisible) {
          await page.click(selector);
          logger.debug(`Clicked cookie consent button: ${selector}`);
          await randomDelay(500, 1500);
          return true;
        }
      } catch (err) {
        // Ignore errors and try next selector
      }
    }
    
    return false;
  } catch (error) {
    logger.debug(`Error handling cookie consent: ${error.message}`);
    return false;
  }
}

/**
 * Get a random user agent
 * @returns {string} - Random user agent string
 */
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0'
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

module.exports = {
  configureBrowserForStealth,
  hideAutomationFootprints,
  randomDelay,
  performRandomMouseMovements,
  handleCookieConsent,
  getRandomUserAgent
}; 