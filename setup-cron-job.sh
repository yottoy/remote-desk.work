#!/bin/bash

# Setup cron job for database maintenance
# This script sets up a cron job to run the database maintenance script regularly

# Configuration
SCRIPT_PATH="$(pwd)/periodic-data-maintenance.js"
LOG_DIR="$(pwd)/logs"
NODE_PATH=$(which node)
CRON_SCHEDULE="0 3 * * *"  # Default: Run daily at 3 AM

# Display header
echo "=========================================="
echo "ClickClickJob Database Maintenance Cron Setup"
echo "=========================================="
echo ""

# Check if script exists
if [ ! -f "$SCRIPT_PATH" ]; then
  echo "Error: Maintenance script not found at $SCRIPT_PATH"
  echo "Please run this setup script from the project root directory."
  exit 1
fi

# Check if Node.js is available
if [ -z "$NODE_PATH" ]; then
  echo "Error: Node.js not found in PATH."
  echo "Please install Node.js before setting up the cron job."
  exit 1
fi

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"
echo "Log directory set to: $LOG_DIR"

# Allow customizing the cron schedule
read -p "Run maintenance at (default: $CRON_SCHEDULE - daily at 3 AM): " custom_schedule
if [ ! -z "$custom_schedule" ]; then
  CRON_SCHEDULE="$custom_schedule"
fi

# Prepare the cron command
CRON_COMMAND="$CRON_SCHEDULE cd $(pwd) && $NODE_PATH $SCRIPT_PATH --cron >> $LOG_DIR/cron-output.log 2>&1"

echo ""
echo "Cron job will run with the following schedule:"
echo "$CRON_SCHEDULE ($(crontab -l | grep -q "$SCRIPT_PATH" && echo "Updating existing entry" || echo "New entry"))"
echo ""

# Add/update the cron job
(crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH" || true; echo "$CRON_COMMAND") | crontab -

# Verify the cron job was added
if crontab -l | grep -q "$SCRIPT_PATH"; then
  echo "✅ Cron job successfully installed!"
  echo "The maintenance script will run at the specified schedule."
  echo "You can view the cron output log at: $LOG_DIR/cron-output.log"
else
  echo "❌ Failed to install cron job. Please check for errors and try again."
  exit 1
fi

echo ""
echo "To verify your crontab entries, run: crontab -l"
echo "To remove this job, run: crontab -l | grep -v \"$SCRIPT_PATH\" | crontab -"
echo ""

# Instructions for .env file
echo "Make sure your .env file contains the necessary MongoDB URI:"
echo "MONGODB_URI=mongodb+srv://username:password@hostname/database"
echo ""
echo "Optional environment variables for the maintenance script:"
echo "MAINTENANCE_INTERVAL=86400000      # Run interval in milliseconds (24h default)"
echo "ENABLE_NOTIFICATIONS=true          # Enable email notifications"
echo "NOTIFICATION_EMAIL=admin@example.com  # Email to receive notifications"
echo ""

# Test run option
read -p "Would you like to run a test maintenance now? (y/n): " test_run
if [[ "$test_run" =~ ^[Yy] ]]; then
  echo "Running maintenance test..."
  echo "Output will be logged to $LOG_DIR"
  $NODE_PATH $SCRIPT_PATH --now
  echo "Test completed. Check the logs directory for results."
fi

echo "Setup complete!" 