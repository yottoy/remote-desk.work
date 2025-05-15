/**
 * ProxyRotator - Utility for managing proxy rotation during scraping
 * Helps avoid IP blocking by rotating through proxies based on configured strategies
 */

const fs = require('fs');
const path = require('path');

class ProxyRotator {
  constructor(options = {}) {
    this.options = {
      proxyFile: options.proxyFile || path.join(process.cwd(), 'proxies.txt'),
      strategy: options.strategy || 'per_query', // or 'per_site', 'per_session'
      enabled: options.enabled !== undefined ? options.enabled : true,
      logger: options.logger || console
    };
    
    this.proxies = [];
    this.currentIndex = 0;
    this.siteProxies = {}; // Track proxies used per site
    this.loadProxies();
  }
  
  /**
   * Load proxies from file
   */
  loadProxies() {
    try {
      if (!fs.existsSync(this.options.proxyFile)) {
        this.options.logger.warn(`Proxy file not found: ${this.options.proxyFile}`);
        return;
      }
      
      const content = fs.readFileSync(this.options.proxyFile, 'utf8');
      this.proxies = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      this.options.logger.info(`Loaded ${this.proxies.length} proxies from ${this.options.proxyFile}`);
    } catch (error) {
      this.options.logger.error(`Error loading proxies: ${error.message}`);
    }
  }
  
  /**
   * Get the next proxy based on the selected strategy
   * @param {string} site - The site being scraped (indeed, linkedin, etc)
   * @param {string} queryId - Unique identifier for the current query
   * @returns {string|null} - The proxy URL or null if no proxies available
   */
  getProxy(site, queryId) {
    if (!this.options.enabled || this.proxies.length === 0) {
      return null;
    }
    
    // Simple round-robin for now
    const proxy = this.proxies[this.currentIndex];
    
    // Rotate based on strategy
    if (this.options.strategy === 'per_query') {
      // Change proxy for every query
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    } else if (this.options.strategy === 'per_site' && site) {
      // Use different proxies for different sites
      if (!this.siteProxies[site]) {
        this.siteProxies[site] = this.currentIndex;
        this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
      }
    }
    // 'per_session' strategy keeps the same proxy for the entire session
    
    return proxy;
  }
  
  /**
   * Flag a proxy as failing for the given site
   * @param {string} proxy - The proxy that failed
   * @param {string} site - The site where it failed
   */
  markProxyFailure(proxy, site) {
    if (!proxy || this.proxies.length <= 1) {
      return; // Don't mark if only one proxy
    }
    
    this.options.logger.warn(`Proxy ${proxy} failed for ${site}`);
    
    // Simple implementation: just rotate to next proxy
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    
    // If site-specific, update that too
    if (this.siteProxies[site]) {
      this.siteProxies[site] = this.currentIndex;
    }
  }
  
  /**
   * Get the total count of available proxies
   */
  getProxyCount() {
    return this.proxies.length;
  }
  
  /**
   * Add a new proxy to the rotation
   * @param {string} proxy - The proxy URL to add
   */
  addProxy(proxy) {
    if (proxy && !this.proxies.includes(proxy)) {
      this.proxies.push(proxy);
    }
  }
}

module.exports = ProxyRotator; 