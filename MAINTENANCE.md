# ClickClickJob Database Maintenance

This directory contains tools for maintaining the quality of the ClickClickJob MongoDB database. These tools help keep the database clean by removing mock entries, jobs with missing descriptions, and other low-quality data.

## Available Scripts

### 1. Periodic Data Maintenance

The main maintenance script: `periodic-data-maintenance.js`

This script performs the following tasks:
- Removes mock/fallback entries (with example.com URLs)
- Deletes entries with missing or empty descriptions
- Removes entries with extremely short descriptions (< 20 characters by default)
- Logs all maintenance activities
- Can send notifications when significant cleanup is performed

#### Usage Options

Run the script in one of the following modes:

```bash
# Run once immediately and exit
node periodic-data-maintenance.js --now

# For use with cron jobs (run once and exit)
node periodic-data-maintenance.js --cron

# Run as a continuous service that performs maintenance periodically
node periodic-data-maintenance.js
```

### 2. Cron Job Setup

A helper script to set up automated maintenance: `setup-cron-job.sh`

This script:
- Creates a cron job to run the maintenance script on a regular schedule
- Configures log file locations
- Provides options to customize the schedule

#### Usage

```bash
# Make the script executable
chmod +x setup-cron-job.sh

# Run the setup script
./setup-cron-job.sh
```

### 3. Analysis and Diagnostic Tools

Additional scripts for analyzing the database:

- `analyze-job-data.js` - Examines job data for suspicious content in descriptions, titles, and company names
- `check-urls.js` - Analyzes URLs in the database for potential issues
- `clean-mock-entries.js` - Specifically focuses on removing mock/fallback entries
- `cleanup-job-database.js` - Comprehensive cleanup script (used as the basis for the periodic maintenance)

## Configuration

The maintenance script uses the following environment variables (in your `.env` file):

```
# Required
MONGODB_URI=mongodb+srv://username:password@hostname/database

# Optional
MAINTENANCE_INTERVAL=86400000       # Run interval in milliseconds (24h default)
ENABLE_NOTIFICATIONS=true           # Enable email notifications
NOTIFICATION_EMAIL=admin@example.com  # Email to receive notifications
```

## Log Files

Maintenance logs are stored in the `logs` directory:

- Individual maintenance run logs: `maintenance_YYYY-MM-DD_HH-MM-SS.log`
- Cron job output log: `cron-output.log`

Logs older than 30 days are automatically cleaned up.

## Customization

You can customize the maintenance behavior by editing the config object in `periodic-data-maintenance.js`:

```javascript
const config = {
  // Schedule settings
  runInterval: process.env.MAINTENANCE_INTERVAL || 24 * 60 * 60 * 1000,
  
  // Database settings
  databases: ['clickclickjob', 'test', 'remote-jobs'],
  
  // Cleanup thresholds
  minDescriptionLength: 20, // Adjust this to change what's considered "too short"

  // Other settings...
};
```

## Notification System

The script includes a placeholder for sending notifications. To implement actual notifications, edit the `sendNotification()` function in the script. The default implementation includes example code for sending email via the system's mail command, which can be uncommented and customized.

## Adding to Deployment Pipeline

For production deployment, consider:

1. Including the maintenance script in your deployment process
2. Setting up the cron job via your infrastructure as code
3. Configuring proper logging to a centralized log management system
4. Implementing more sophisticated notification methods (Slack, Email, SMS, etc.)

## Troubleshooting

If you encounter issues:

1. Check the logs in the `logs` directory
2. Verify MongoDB connection credentials
3. Run the analysis scripts to diagnose database issues
4. Try running the maintenance script with the `--now` flag to see immediate output

For further assistance, consult the MongoDB documentation or contact your database administrator. 