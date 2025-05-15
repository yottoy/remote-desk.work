# ClickClickJob Job Scraper

A system for scraping remote admin and data entry job postings from various sites using JobSpy.

## Features

- Scrapes multiple job sites (Indeed, LinkedIn, WeWorkRemotely, etc.)
- Focuses on remote admin and data entry positions
- Deduplicates job listings across sources
- Filters out irrelevant jobs and scams
- Rotates proxies to avoid IP blocking

## GitHub Actions Workflow

This project includes a GitHub Actions workflow that:

1. Automatically runs every 12 hours
2. Sets up the Python and Node.js environment
3. Tests the environment and dependencies
4. Runs all scrapers in sequence
5. Combines and processes results
6. Saves job data as artifacts

## Running Locally

### Prerequisites

- Node.js 16+
- Python 3.10+
- npm

### Installation

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
npm run setup-python
```

### Running

```bash
# Run the diagnostic test
node test-github-environment.js

# Run all scrapers
npm start

# Run specific scrapers
npm run scrape-indeed
npm run scrape-all
npm run scrape-alt
npm run scrape-wwr
```

## GitHub Setup

1. Push to GitHub using the included script:
   ```bash
   ./push-to-github.sh
   ```

2. Go to your GitHub repository
3. Click on the "Actions" tab
4. Run the "Run Job Scrapers" workflow

## Results

Job results are stored in several files:

- `indeed-results.json`: Indeed-specific jobs
- `scrape-results.json`: Main JobSpy results
- `alt-sites-results.json`: Alternative sites
- `combined-results.json`: All deduplicated jobs

## Troubleshooting

If you encounter issues with the JobSpy bridge:

1. Make sure Python dependencies are installed: `npm run setup-python`
2. Test the bridge: `node test-bridge.js`
3. Check job results in the `github-test-result.json` file

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [JobSpy](https://github.com/nickpollard/jobspy) - Python library for job scraping
- All contributors who have helped improve this system 