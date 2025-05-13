# Job Scraping Scripts for ClickClickJob.com

This directory contains scripts for managing the job scraping process for ClickClickJob.com.

## Available Scripts

### run-full-scraper.js

A comprehensive script that runs the entire job scraping pipeline:

1. Starts the Python JobSpy bridge if it's not already running
2. Runs the scrapers with expanded search terms across multiple sources and locations
3. Saves results to MongoDB
4. Generates detailed reports

#### Requirements

- Node.js 16+
- Python 3.10+
- MongoDB instance (local or remote)
- Network access to job sites

#### Configuration

The script is configured through environment variables:

- `JOBSPY_BRIDGE_PORT`: Port for the JobSpy bridge (default: 8000)
- `JOBSPY_BRIDGE_HOST`: Host for the JobSpy bridge (default: 127.0.0.1)
- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017/clickclickjob)

#### Usage

```bash
# Make the script executable
chmod +x scripts/run-full-scraper.js

# Run the script
node scripts/run-full-scraper.js

# Or run directly
./scripts/run-full-scraper.js
```

#### Features

- **Smart Bridge Management**: Automatically starts the bridge if not running, detects and handles port conflicts
- **Comprehensive Scraping**: Covers multiple job sources, search terms, and locations
- **Robust Error Handling**: Retries failed requests, graceful error recovery
- **Detailed Reporting**: Generates JSON reports of the scraping process
- **MongoDB Integration**: Stores job data with duplicate detection and updates
- **Graceful Cleanup**: Properly handles SIGINT, SIGTERM, and unexpected errors

#### Reports

Reports are generated in the `reports/` directory with the following information:

- Total jobs found
- Success/failure rates
- Per-source statistics
- Per-search term statistics
- MongoDB storage results

## Adding New Scripts

When adding new scripts to this directory:

1. Use the same environment variables for configuration
2. Follow the same error handling patterns
3. Add documentation to this README
4. Make scripts executable with `chmod +x`

## Troubleshooting

**Bridge fails to start**:
- Check if port 8000 is in use: `lsof -i :8000`
- Verify Python and dependencies are installed
- Check bridge logs in `python-bridge/jobspy_bridge.log`

**MongoDB connection issues**:
- Verify MongoDB is running: `ps aux | grep mongod`
- Check connection string in `.env` file
- Verify network access to MongoDB

**Rate limiting issues**:
- Increase delays between requests
- Reduce MAX_PARALLEL_SCRAPERS value
- Consider using proxies (configure in JobSpy) 