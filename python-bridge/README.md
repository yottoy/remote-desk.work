# Python Bridge for Job Scraping

## Overview

This directory contains the Python-Node.js bridge that allows ClickClickJob.com to utilize the JobSpy library for scraping job listings from various job platforms.

## Supported Job Sites

The bridge supports scraping from these sites:
- Indeed ✅ (working reliably)
- LinkedIn ✅ (working reliably)
- Naukri ✅ (working reliably)
- Glassdoor ❌ (403 Forbidden errors)
- ZipRecruiter ❌ (rate limiting issues)
- Bayt ❌ (403 Forbidden errors)

## Requirements

- Node.js (v14+)
- Python 3.10+
- Python packages (listed in requirements.txt)

## Setup

1. Install Node.js dependencies:

```bash
npm install axios
```

2. Install Python dependencies:

```bash
python3 -m pip install -r requirements.txt
```

3. Make sure Python scripts are executable:

```bash
chmod +x jobspy_bridge.py
```

## Running the Scrapers

### Option 1: Using the Full Scraper Script (recommended)

The simplest way to run the entire scraping pipeline:

```bash
node ../scripts/run-full-scraper.js
```

This script:
- Starts the bridge if needed
- Runs all scrapers with various search terms
- Saves results to MongoDB
- Generates reports

### Option 2: Run the All-in-One Script

This script will start the Python bridge and then run the scraper:

```bash
node run-scrape.js
```

### Option 3: Manual Two-Step Process

Start the Python bridge in one terminal:

```bash
# Add your Python bin path to PATH if needed
export PATH=$PATH:$HOME/Library/Python/3.12/bin
node start-bridge.js
# or directly with Python
python3 jobspy_bridge.py
```

Then run the scraper in another terminal:

```bash
node scrape-all-jobs.js
```

## Configuration

### Environment Variables

- `JOBSPY_BRIDGE_PORT`: Port for the bridge (default: 8000)
- `JOBSPY_BRIDGE_HOST`: Host for the bridge (default: 127.0.0.1)

### Search Parameters

Edit `scrape-all-jobs.js` to modify:

- `SEARCH_TERMS`: Keywords to search for
- `LOCATIONS`: Geographic locations to include
- `SOURCES`: Job sites to scrape
- `DELAY_BETWEEN_REQUESTS`: Time to wait between requests
- Other parameters like results count, days old, etc.

## API Endpoints

The Python bridge exposes these HTTP endpoints:

- `GET /`: Health check endpoint
- `GET /health`: More detailed health check
- `GET /supported-sites`: List supported job sites
- `POST /scrape-jobs`: Main endpoint for scraping jobs
  - Parameters:
    - `site_names`: List of site names to scrape from (e.g., ["indeed", "linkedin"])
    - `search_terms`: List of search terms (e.g., ["remote data entry"])
    - `location`: Optional location string (e.g., "USA" or "")
    - `results_wanted`: Number of results to fetch (default: 20, max: 100)
    - `hours_old`: How recent jobs should be in hours (default: 72)
    - `is_remote`: Whether to search for remote jobs (default: true)
    - Additional optional parameters

## Troubleshooting

### Python Path Issues

If you get "command not found" errors for Python packages:

```bash
# Add this before running scripts
export PATH=$PATH:$HOME/Library/Python/3.12/bin
```

### Port Already in Use

If port 8000 is already in use:

1. Find the process: `lsof -i :8000`
2. Kill it: `kill -9 <PID>`
3. Or change the port in the environment variables

### Rate Limiting

If you're getting 429 (Too Many Requests) errors:
- Increase `DELAY_BETWEEN_REQUESTS` in scrape-all-jobs.js
- Reduce the number of search terms or locations
- Use proxies (configure in API call)

### Common Errors

- **403 Forbidden**: Site is blocking scrapers, consider using proxies
- **429 Too Many Requests**: You're being rate limited, slow down requests
- **500 Internal Server Error**: Error in the JobSpy library or bridge

## Files

- `jobspy_bridge.py`: Main FastAPI server that handles job scraping
- `start-bridge.js`: Node.js script to start the Python bridge
- `scrape-all-jobs.js`: Node.js script to run job scrapers
- `run-scrape.js`: Combined script to start bridge and run scrapers
- `requirements.txt`: Python package dependencies
- `jobspy_bridge.log`: Log file for debugging

## Adding New Features

When adding new features:
1. Update the JobRequest class in jobspy_bridge.py with new parameters
2. Add appropriate error handling and validation
3. Test with small batches before scaling up
4. Update this documentation 