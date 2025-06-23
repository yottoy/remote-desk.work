#!/bin/bash

# Deploy database maintenance script to production server
# This script copies the maintenance files to the production server and sets up the cron job

# Configuration - MODIFY THESE VALUES
PROD_SERVER="user@your-production-server.com"
PROD_PATH="/path/to/production/app"
MONGODB_URI="mongodb+srv://username:password@cluster0.mjemntb.mongodb.net/clickclickjob?retryWrites=true&w=majority&appName=Cluster0&ssl=true"

# Files to deploy
MAINTENANCE_FILES=(
  "periodic-data-maintenance.js"
  "setup-cron-job.sh"
  "MAINTENANCE.md"
)

# Display header
echo "=========================================="
echo "ClickClickJob Maintenance Tools Deployment"
echo "=========================================="
echo ""

# Check if SSH connection to production server works
echo "Testing connection to production server..."
ssh -q -o BatchMode=yes -o ConnectTimeout=5 $PROD_SERVER exit
if [ $? -ne 0 ]; then
  echo "❌ Cannot connect to production server: $PROD_SERVER"
  echo "Please check your SSH configuration and server status."
  exit 1
fi
echo "✅ Connection to production server successful"

# Create remote directories if they don't exist
echo "Setting up directories on production server..."
ssh $PROD_SERVER "mkdir -p $PROD_PATH/logs"
echo "✅ Directory structure ready"

# Copy maintenance files to production server
echo "Copying maintenance files to production server..."
for file in "${MAINTENANCE_FILES[@]}"; do
  echo "  - Copying $file..."
  scp "$file" "$PROD_SERVER:$PROD_PATH/$file"
  if [ $? -ne 0 ]; then
    echo "❌ Failed to copy $file to production server"
    exit 1
  fi
done
echo "✅ All files copied successfully"

# Make scripts executable on the remote server
echo "Setting execute permissions..."
ssh $PROD_SERVER "chmod +x $PROD_PATH/setup-cron-job.sh"
echo "✅ Execute permissions set"

# Check if .env file exists and contains MONGODB_URI
echo "Checking .env configuration..."
ssh $PROD_SERVER "grep -q 'MONGODB_URI' $PROD_PATH/.env"
if [ $? -ne 0 ]; then
  echo "MONGODB_URI not found in .env file. Adding it now..."
  ssh $PROD_SERVER "echo 'MONGODB_URI=$MONGODB_URI' >> $PROD_PATH/.env"
  echo "✅ Added MONGODB_URI to .env file"
else
  echo "✅ MONGODB_URI already exists in .env file"
fi

# Set up the cron job
echo "Setting up cron job on production server..."
ssh $PROD_SERVER "cd $PROD_PATH && ./setup-cron-job.sh"
if [ $? -ne 0 ]; then
  echo "❌ Failed to set up cron job"
  exit 1
fi

echo ""
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "Maintenance script has been deployed to $PROD_SERVER:$PROD_PATH"
echo "A cron job has been set up to run the maintenance script regularly"
echo ""
echo "------------------------"
echo "IMPORTANT DATABASE INFORMATION:"
echo "------------------------"
echo "The scraper should write into the 'jobs' collection in the 'clickclickjob' database."
echo "This is the main production database that contains all job listings."
echo ""
echo "MongoDB collection details:"
echo "- Database name: clickclickjob"
echo "- Collection name: jobs"
echo "- Database URI format: mongodb+srv://username:password@cluster0.mjemntb.mongodb.net/clickclickjob"
echo ""
echo "The maintenance script is configured to clean this database automatically."
echo "Make sure your scrapers write to the same database to ensure data consistency." 