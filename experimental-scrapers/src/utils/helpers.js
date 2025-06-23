/**
 * Helper utilities for experimental scrapers
 */

/**
 * Random delay between min and max milliseconds
 */
async function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Get a random user agent
 */
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Extract salary information from text
 */
function extractSalary(text) {
  if (!text) return '';
  
  // Common salary patterns
  const patterns = [
    /\$[\d,]+(?:\.\d{2})?(?:\s*-\s*\$[\d,]+(?:\.\d{2})?)?(?:\s*(?:per|\/)\s*(?:hour|hr|month|year|annually))?/gi,
    /[\d,]+(?:\.\d{2})?\s*-\s*[\d,]+(?:\.\d{2})?\s*(?:USD|PHP|per\s*month|per\s*hour|\/month|\/hour)/gi,
    /(?:USD|PHP)\s*[\d,]+(?:\.\d{2})?(?:\s*-\s*[\d,]+(?:\.\d{2})?)?/gi
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return '';
}

/**
 * Parse relative date strings (e.g., "2 days ago", "1 week ago")
 */
function parseRelativeDate(dateString) {
  if (!dateString) return new Date();
  
  const now = new Date();
  const lowerDate = dateString.toLowerCase();
  
  // Today/yesterday
  if (lowerDate.includes('today') || lowerDate.includes('just now')) {
    return now;
  }
  if (lowerDate.includes('yesterday')) {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  // Extract number and unit
  const match = lowerDate.match(/(\d+)\s*(minute|hour|day|week|month|year)s?\s*ago/);
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2];
    
    let milliseconds = 0;
    switch (unit) {
      case 'minute':
        milliseconds = amount * 60 * 1000;
        break;
      case 'hour':
        milliseconds = amount * 60 * 60 * 1000;
        break;
      case 'day':
        milliseconds = amount * 24 * 60 * 60 * 1000;
        break;
      case 'week':
        milliseconds = amount * 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        milliseconds = amount * 30 * 24 * 60 * 60 * 1000;
        break;
      case 'year':
        milliseconds = amount * 365 * 24 * 60 * 60 * 1000;
        break;
    }
    
    return new Date(now.getTime() - milliseconds);
  }
  
  // Try to parse as regular date
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? now : parsed;
}

/**
 * Check if a job is likely remote based on title and description
 */
function isLikelyRemote(title, description, location) {
  const text = `${title} ${description} ${location}`.toLowerCase();
  
  const remoteIndicators = [
    'remote', 'work from home', 'wfh', 'telecommute', 'virtual',
    'distributed', 'anywhere', 'location independent'
  ];
  
  const onsiteIndicators = [
    'on-site', 'onsite', 'in-person', 'office location', 'commute',
    'headquarters', 'local candidates', 'relocation required'
  ];
  
  // Check for strong onsite indicators first
  for (const indicator of onsiteIndicators) {
    if (text.includes(indicator)) {
      return false;
    }
  }
  
  // Check for remote indicators
  for (const indicator of remoteIndicators) {
    if (text.includes(indicator)) {
      return true;
    }
  }
  
  // If location is explicitly "remote" or similar
  if (location && location.toLowerCase().includes('remote')) {
    return true;
  }
  
  return false;
}

/**
 * Validate URL
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Make URL absolute
 */
function makeAbsoluteUrl(url, baseUrl) {
  if (!url) return '';
  if (isValidUrl(url)) return url;
  
  try {
    return new URL(url, baseUrl).href;
  } catch (_) {
    return '';
  }
}

module.exports = {
  randomDelay,
  getRandomUserAgent,
  cleanText,
  extractSalary,
  parseRelativeDate,
  isLikelyRemote,
  isValidUrl,
  makeAbsoluteUrl
}; 