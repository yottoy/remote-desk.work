#!/bin/bash

# Script to setup a cron job for checking 404 links on the website
# This will install necessary dependencies and configure a cron job to run weekly

echo "Setting up 404 link checker cron job"
echo "===================================="

# Script paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
CHECK_SCRIPT="$SCRIPT_DIR/scripts/check-404-links.js"
LOG_DIR="$SCRIPT_DIR/logs"
CRON_LOG="$LOG_DIR/404-check-cron.log"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Check if the script exists
if [ ! -f "$CHECK_SCRIPT" ]; then
  echo "Error: 404 check script not found at $CHECK_SCRIPT"
  exit 1
fi

# Ensure puppeteer is installed (required dependency)
echo "Checking dependencies..."
if ! npm list puppeteer > /dev/null 2>&1; then
  echo "Installing puppeteer..."
  npm install --save puppeteer
else
  echo "Puppeteer is already installed."
fi

# Create temporary cron file
TEMP_CRON=$(mktemp)
crontab -l > "$TEMP_CRON" 2>/dev/null || echo "# New crontab" > "$TEMP_CRON"

# Check if cron job already exists
if grep -q "check-404-links.js" "$TEMP_CRON"; then
  echo "Cron job for 404 checker already exists"
else
  # Add cron job to run weekly (Sunday at 1:00 AM)
  echo "# Run 404 link checker weekly" >> "$TEMP_CRON"
  echo "0 1 * * 0 cd $SCRIPT_DIR && node $CHECK_SCRIPT >> $CRON_LOG 2>&1" >> "$TEMP_CRON"
  
  # Apply new cron configuration
  crontab "$TEMP_CRON"
  echo "Cron job set up to run weekly (Sunday at 1:00 AM)"
fi

# Remove temporary file
rm "$TEMP_CRON"

echo
echo "Cron job details:"
echo "-----------------"
echo "Script: $CHECK_SCRIPT"
echo "Log file: $CRON_LOG"
echo "Schedule: Weekly (Sunday at 1:00 AM)"
echo
echo "You can check the cron setup with: crontab -l"
echo
echo "To run the script manually:"
echo "  cd $SCRIPT_DIR && node $CHECK_SCRIPT"
echo
echo "Setup complete." 