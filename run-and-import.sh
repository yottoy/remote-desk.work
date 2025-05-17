#!/bin/bash

# Run and Import Script
# This script runs the direct_scraper.py to generate job data
# and then imports it into the MongoDB database

# Set up logging
LOG_FILE="logs/run-and-import-$(date +%Y-%m-%d_%H-%M-%S).log"
mkdir -p logs

# Function to log messages
log() {
  echo "$(date +"%Y-%m-%d %H:%M:%S") - $1" | tee -a "$LOG_FILE"
}

log "Starting run-and-import process"

# Check for --overwrite flag
OVERWRITE_FLAG=""
if [[ "$1" == "--overwrite" || "$1" == "-o" ]]; then
  OVERWRITE_FLAG="--overwrite"
  log "Overwrite mode enabled"
fi

# Step 1: Run the direct_scraper.py script
log "Running direct_scraper.py to scrape job data..."
python direct_scraper.py

# Check if scraping was successful
if [ $? -ne 0 ]; then
  log "ERROR: direct_scraper.py failed. Aborting import."
  exit 1
fi

# Check if the combined-results.json file exists
if [ ! -f "results/combined-results.json" ]; then
  log "ERROR: results/combined-results.json not found. Scraping may have failed."
  exit 1
fi

# Get job count from combined-results.json
JOB_COUNT=$(grep -o '"total_jobs":' results/combined-results.json | wc -l)
log "Scraping complete. Found approximately $JOB_COUNT jobs."

# Step 2: Import to MongoDB
log "Importing scraped data to MongoDB..."
node import-scraper-to-mongodb.js $OVERWRITE_FLAG

# Check if import was successful
if [ $? -ne 0 ]; then
  log "ERROR: MongoDB import failed."
  exit 1
fi

log "Process completed successfully!"
log "See $LOG_FILE for detailed logs"

exit 0 