# JobSpy Bridge for Remote Admin/Data Entry Jobs

This module provides a bridge between your JavaScript application and the [JobSpy](https://github.com/speedyapply/JobSpy) Python library to scrape remote admin and data entry jobs from various job boards.

## Key Features

- Scrapes multiple job sites using JobSpy
- Implements rate limiting to avoid blocks
- Supports proxy rotation
- Provides robust error handling and retries
- Handles browser fingerprinting with rotating User-Agents
- Optimized search terms for admin/data entry roles

## Setup Instructions

### Prerequisites

- Python 3.9+ with pip
- Node.js 16+
- npm

### Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Configure environment variables (optional):

```bash
# Create a .env file in the python-bridge directory
JOBSPY_BRIDGE_HOST=127.0.0.1  # Host to bind to
JOBSPY_BRIDGE_PORT=8000       # Port for the bridge
MAX_RETRY_ATTEMPTS=3          # Max retries per scraping job
RETRY_DELAY=5                 # Base retry delay in seconds
MIN_REQUEST_INTERVAL=2.0      # Minimum seconds between requests
USE_RANDOM_USER_AGENTS=true   # Enable User-Agent rotation
```

3. Configure proxies (recommended to avoid rate limiting):

Edit the `proxies.txt` file to add your proxies, one per line:

```
ip:port
ip:port:username:password
```

You can obtain proxies from services like Bright Data, Oxylabs, SmartProxy, etc.

## Usage

### Starting the Bridge

Run the Python FastAPI bridge:

```bash
cd python-bridge
python jobspy_bridge.py
```

Or use the provided npm script:

```bash
npm run bridge
```

### Running the Scraper

Run the job scraper with:

```bash
cd python-bridge
node scrape-all-jobs.js
```

Or:

```bash
npm run scrape
```

### Running Both Together

To start both the bridge and the scraper:

```bash
cd python-bridge
node run-scrape.js
```

Or:

```bash
npm run full-scrape
```

## Optimizing for Admin/Data Entry Roles

The scraper is configured with the following search terms optimized for admin/data entry roles:

- 'remote data entry'
- 'remote administrative assistant'
- 'virtual assistant remote'
- 'remote customer service'
- 'work from home data entry'
- 'remote transcription'
- 'remote administrative support'
- 'remote office assistant'
- 'remote data processing'
- 'remote clerk'
- 'data entry work from home'
- 'remote admin assistant'
- 'remote receptionist'
- 'remote secretary'
- 'remote bookkeeping'
- 'work from home customer service'
- 'remote executive assistant'
- 'remote project assistant'
- 'remote office admin'
- 'remote administrative coordinator'
- 'remote data specialist'
- 'remote data analyst'
- 'remote office manager'
- 'remote personal assistant'

You can edit the `SEARCH_TERMS` array in `scrape-all-jobs.js` to customize these.

## Configuration Options

### Job Search Settings

Edit `scrape-all-jobs.js` to customize these parameters:

- `SEARCH_TERMS`: Array of search terms to use
- `LOCATIONS`: Array of locations to search in
- `SOURCES`: Array of job sites to scrape
- `DELAY_BETWEEN_REQUESTS`: Delay between requests in ms
- `RETRY_DELAY`: Delay before retrying failed requests
- `MAX_RETRIES`: Maximum number of retry attempts
- `USE_PROXIES`: Whether to use proxies

### Proxy Configuration

To enable proxy usage:

1. Set `USE_PROXIES=true` in your environment
2. Add proxies to `proxies.txt`

## Troubleshooting

### Rate Limiting Issues

If you're experiencing rate limiting:

1. Increase `MIN_REQUEST_INTERVAL` to add more delay between requests
2. Enable and configure proxies
3. Reduce the number of search terms or job sites
4. Use `USER_AGENTS` rotation (enabled by default)

### Bridge Connection Issues

If the bridge isn't connecting:

1. Check that the bridge is running on the correct port
2. Verify no firewall is blocking connections
3. Ensure the JOBSPY_BRIDGE_URL environment variable is set correctly

### No Jobs Found

If no jobs are found:

1. Check the job site is working by visiting it in a browser
2. Try different search terms
3. Verify JobSpy version is compatible
4. Check the logs for specific errors

## Logs

Logs are written to:

- Console output
- `jobspy_bridge.log` for the Python bridge
- `scrape-results.json` for scraper results

## API Reference

The bridge exposes these endpoints:

- `GET /`: Check if the API is running
- `GET /health`: Health check endpoint
- `GET /supported-sites`: Get supported job sites
- `POST /scrape-jobs`: Main endpoint to scrape jobs
- `POST /scrape-indeed`: Legacy endpoint for Indeed only

## License

This software is provided under the same license as [JobSpy](https://github.com/speedyapply/JobSpy). 