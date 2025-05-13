# Indeed Scraper Setup

## ⚠️ IMPORTANT: Scraping Limitations

**As of May 2025, direct web scraping of Indeed has become extremely difficult due to their aggressive anti-bot measures.**

The Selenium-based scraper we've implemented often encounters:
- Cloudflare security challenges
- CAPTCHAs
- IP blocks
- Other anti-automation techniques

For detailed analysis, see [INDEED-SCRAPING-REPORT.md](./INDEED-SCRAPING-REPORT.md).

## Available Implementation Options

The remote-job-scraper now includes two Indeed scrapers:

1. **IndeedSeleniumScraper** - Uses Playwright to automate a real browser, attempting to bypass anti-scraping measures
2. **IndeedScraper (Legacy)** - Uses the Indeed Publisher API or direct web scraping with Axios

### Recommended Approaches (In order of preference)

1. **Use Indeed's Official API** - Register at https://www.indeed.com/publisher to get legitimate API access
2. **Focus on alternative job sources** - WeWorkRemotely, RemoteCo, etc. are more scraper-friendly
3. **Use the Selenium scraper with proxy rotation** - Requires additional services like BrightData or Smartproxy

## Selenium-based Scraper

The new Selenium-based scraper uses Playwright (a browser automation tool) to scrape Indeed jobs. This approach:

- Simulates real user behavior to attempt to bypass Cloudflare and other anti-scraping measures
- Takes screenshots of the search results and job details for debugging
- Implements retry logic and fallback mechanisms when encountering CAPTCHAs
- Has multiple selectors to adapt to Indeed's frequent layout changes

This scraper will run in run-all-scrapers.js but may not return results due to anti-bot protections.

## API Mode Setup (Legacy Scraper)

To use the Indeed Publisher API with the legacy scraper:

1. Register as an Indeed Publisher at: https://www.indeed.com/publisher
2. Once approved, you'll receive a Publisher ID (API key)
3. Add this key to your `.env` file:

```
INDEED_API_KEY=your_indeed_publisher_id_here
```

## Configuration

The Indeed scrapers are configured in `config/config.js` with the following options:

```javascript
indeed: {
  baseUrl: 'https://api.indeed.com/ads',
  apiKey: process.env.INDEED_API_KEY || '',
  queries: [
    'data entry remote',
    'administrative assistant remote',
    'virtual assistant remote',
    'customer service representative remote'
  ],
  credibilityScore: 8
}
```

## Running the Indeed Scrapers

The IndeedSeleniumScraper is automatically included when you run:

```
node run-all-scrapers.js
```

To test just the Selenium-based Indeed scraper:

```
node test-indeed-selenium.js
```

## Screenshots and Debugging

The Selenium-based scraper takes screenshots of:
- Each search results page
- Individual job detail pages
- HTML content of pages for debugging

These are saved in the `indeed-screenshots` directory and help diagnose issues with the scraper.

## Based on Open Source Implementation

Our Indeed scraper implementation is inspired by the [IndeedJobScraper](https://github.com/Eben001/IndeedJobScraper) open source project. 