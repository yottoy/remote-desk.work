# Setting Up Proxies for Better Scraping Results

The job scraper is encountering 403 Forbidden errors which indicate that websites are using anti-bot measures. This guide explains how to use proxies to bypass these restrictions.

## Why Use Proxies?

Job sites implement various anti-scraping measures:
- IP-based rate limiting
- Bot detection technologies 
- Browser fingerprinting
- CAPTCHAs and other challenges

Using proxies allows you to rotate your IP address for each request, making it harder for sites to detect and block your scraper.

## Proxy Options

### 1. Proxy Services

These services offer rotating proxies specifically designed for web scraping:

- [Bright Data](https://brightdata.com/)
- [SmartProxy](https://smartproxy.com/)
- [Oxylabs](https://oxylabs.io/)
- [ProxyCrawl](https://proxycrawl.com/)
- [ScraperAPI](https://www.scraperapi.com/)

Most of these services offer:
- Residential/mobile proxies (less likely to be blocked than datacenter IPs)
- Geographic targeting
- Session management
- Auto rotation

### 2. Setting Up the Proxy

#### Environment Setup

Add your proxy configuration to the `.env` file:

```
# Proxy Configuration
PROXY_ENABLED=true
PROXY_URL=http://username:password@proxy.example.com:8080
```

For multiple proxies, you can use a comma-separated list:

```
PROXY_URLS=http://user:pass@proxy1.com:8080,http://user:pass@proxy2.com:8080
```

#### Code Integration

The scraper uses the proxy configuration automatically through the bypasser utility.

### 3. Testing Your Proxy

To test if your proxy is working:

```bash
# Test a specific proxy
curl -x http://username:password@proxy.example.com:8080 https://httpbin.org/ip

# Or use a simple test script
node tests/proxy-test.js
```

## Additional Proxy Tips

1. **Location matters**: Some job sites only show listings for specific regions. Use proxies from your target regions.

2. **Proxy rotation**: Avoid using the same proxy for multiple requests to the same site.

3. **Speed vs. quality**: Residential proxies are slower but less likely to be blocked than datacenter proxies.

4. **Cost management**: Most proxy services charge by bandwidth usage. Monitor your usage to avoid unexpected costs.

5. **Free proxies**: Free proxy lists exist but are generally unreliable and often already blocked by major sites.

## When to Use Proxies

Try running the scraper without proxies first. Only enable proxies if you consistently see:
- 403 Forbidden errors
- CAPTCHAs
- Empty results with error messages

## Setting Up a Local Proxy Server

For more advanced users, you can set up a local proxy server that rotates IPs automatically:

1. Install ProxyChains: `brew install proxychains-ng` (macOS) or `apt-get install proxychains` (Linux)
2. Configure with multiple proxies 
3. Run your scraper through ProxyChains: `proxychains node src/index.js` 