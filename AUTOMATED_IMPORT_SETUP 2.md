# Automated MongoDB Import Setup

## Overview

The GitHub Actions workflows have been updated to automatically import scraped job data into MongoDB after each successful scrape run. This ensures the website always has the latest jobs without manual intervention.

## GitHub Repository Secrets Setup

To enable automated MongoDB imports, you need to add the following secrets to your GitHub repository:

### Required Secrets

1. **MONGODB_URI** - Your MongoDB connection string
2. **MONGODB_DB** - Your MongoDB database name (usually 'clickclickjob')

### How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:

#### Secret 1: MONGODB_URI
- **Name**: `MONGODB_URI`
- **Value**: Your MongoDB connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/`)

#### Secret 2: MONGODB_DB
- **Name**: `MONGODB_DB` 
- **Value**: `clickclickjob` (or your database name)

## Updated Workflows

The following workflows now include automated MongoDB import:

### 1. `.github/workflows/run-scrapers.yml`
- Runs every 12 hours via cron: `0 */12 * * *`
- Scrapes jobs from multiple sources
- Automatically imports results to MongoDB if scraping succeeds

### 2. `.github/workflows/direct-scraper.yml`
- Runs every 12 hours via cron: `0 */12 * * *`
- Runs the direct JobSpy scraper
- Automatically imports results to MongoDB if scraping succeeds

## How It Works

1. **Scraping Phase**: GitHub Actions runs the scrapers every 12 hours
2. **Success Check**: Only proceeds to import if scraping was successful
3. **File Detection**: Checks for result files larger than 100 bytes
4. **Import Execution**: Runs `node import-scraper-to-mongodb.js --overwrite`
5. **Logging**: All import activity is logged to `logs/mongodb-import.log`
6. **Backup**: Old jobs are backed up before being replaced with fresh data

## Benefits

✅ **Fully Automated**: No manual intervention required  
✅ **Always Fresh**: Website shows jobs posted within the last 12 hours  
✅ **Reliable**: Only imports if scraping succeeds  
✅ **Safe**: Backs up old data before replacement  
✅ **Logged**: Full visibility into import process  

## Monitoring

You can monitor the automated imports by:

1. **GitHub Actions Tab**: Check workflow run status
2. **Artifacts**: Download logs from each run
3. **Website**: Verify jobs show current posting dates
4. **Database**: Check job counts and posting dates directly

## Troubleshooting

If imports fail:

1. Check GitHub Actions logs for error messages
2. Verify MongoDB secrets are correctly set
3. Check MongoDB connection and permissions
4. Review `logs/mongodb-import.log` in the workflow artifacts

## Manual Override

You can still manually trigger imports when needed:

```bash
# Local import
node import-scraper-to-mongodb.js --overwrite

# Manual workflow trigger
# Go to GitHub Actions → Select workflow → "Run workflow"
```

## Next Run

The next automated scrape + import will occur:
- **Every 12 hours** starting from the last successful run
- You can also trigger manually via GitHub Actions web interface

🎉 **Your job posting pipeline is now fully automated!** 