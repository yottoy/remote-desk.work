# Remote Job Scraper: User Guide

This guide explains how to use, configure, and maintain the remote job scraper system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Running the Scraper](#running-the-scraper)
5. [Automated Scheduling](#automated-scheduling)
6. [Viewing Results](#viewing-results)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Features](#advanced-features)

## System Overview

The Remote Job Scraper is designed to collect remote job listings for data entry, administrative, and customer service positions from multiple sources. It:

- Scrapes job listings from We Work Remotely, Remote.co, and Indeed
- Filters jobs based on quality criteria
- Stores jobs in a MongoDB database with automatic deduplication
- Runs on a scheduled basis via GitHub Actions

## Installation

### Prerequisites

- Node.js 14+ installed
- Git installed
- MongoDB account (Atlas free tier works well)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/remote-desk.work.git
   cd remote-desk.work/remote-job-scraper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

## Configuration

### Environment Variables

Edit the `.env` file to configure the scraper:

```
# MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/remote-jobs?retryWrites=true&w=majority

# Indeed API key (optional)
INDEED_API_KEY=

# Logging level (error, warn, info, debug)
LOG_LEVEL=info

# Quality scoring thresholds
QUALITY_THRESHOLD=5
FEATURED_THRESHOLD=8

# Time-to-live for job listings in days
TTL_DAYS=30

# Directory for logs (relative to project root)
LOG_DIR=logs

# Proxy Configuration (optional)
PROXY_ENABLED=false
PROXY_URL=http://username:password@proxy.example.com:8080
```

### Advanced Configuration

For more detailed configuration, edit `config/config.js`:

- Job sources and categories
- Quality scoring weights
- Relevance keywords
- Scraper rate limits and timeouts

## Running the Scraper

### Manual Run

```bash
# Run the full scraper
npm start

# Run in debug mode
LOG_LEVEL=debug npm start

# Test MongoDB connection only
node test-connection.js
```

### Command Line Arguments

```bash
# Scrape specific sources only
npm run cli -- --sources=weworkremotely,remoteco

# Override quality threshold
npm run cli -- --quality=7

# Scrape specific categories
npm run cli -- --categories=data-entry,administrative
```

## Automated Scheduling

The scraper is configured to run automatically via GitHub Actions on a daily schedule.

### GitHub Actions Setup

1. Push your repository to GitHub
2. Add your MongoDB connection string as a repository secret named `MONGODB_URI`
3. The workflow will run daily at 2:00 AM UTC

### Manual Trigger

You can also manually trigger the workflow:
1. Go to your GitHub repository
2. Navigate to Actions tab
3. Select "Daily Job Scraping" workflow
4. Click "Run workflow"

## Viewing Results

### MongoDB Data

Connect to your MongoDB database to view the collected jobs:
- Use MongoDB Compass for a GUI view
- Query the `jobs` collection

Example query to find featured jobs:
```javascript
db.jobs.find({ featured: true }).sort({ scrapedDate: -1 })
```

### JSON Files

Each scrape run also saves results as JSON files in the `results/` directory.

## Troubleshooting

### Common Issues

1. **403 Forbidden errors**: The scraper is being blocked by anti-scraping measures
   - Use the enhanced anti-scraping features
   - Try proxy rotation (see `docs/proxy-setup.md`)

2. **MongoDB connection errors**:
   - Check your connection string
   - Verify network access in MongoDB Atlas

3. **No jobs found**:
   - Check the logs for any errors
   - Try lowering the quality threshold
   - Job sites may have changed their HTML structure

### Logs

Check the log files in the `logs/` directory:
- `combined.log`: All logs
- `error.log`: Error-level logs only

## Advanced Features

### Proxy Rotation

To bypass anti-scraping measures, configure proxy rotation:
- Follow the guide in `docs/proxy-setup.md`
- Add proxy configuration to your `.env` file

### Custom Job Sources

To add new job sources:
1. Create a new scraper file in `src/scrapers/`
2. Extend the `BaseScraper` class
3. Implement the `scrape()` method
4. Add the new source to `src/controllers/scrapeController.js`

### Job Quality Filtering

The system scores jobs based on:
- Relevance to target keywords
- Job description quality
- Source credibility
- Recency

Adjust the weights and thresholds in `config/config.js`. 