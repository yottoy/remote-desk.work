#!/bin/bash

# Script to deploy the fixed frontend to production
# This script will build and deploy the frontend with our fixes

echo "Deploying frontend fixes to production"
echo "====================================="

# Set base directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
LOG_DIR="$SCRIPT_DIR/logs"
DEPLOY_LOG="$LOG_DIR/frontend-deploy-$(date +%Y-%m-%d-%H-%M-%S).log"

# Make sure the log directory exists
mkdir -p "$LOG_DIR"

# Check if we are in the right directory
if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: Frontend directory not found at $FRONTEND_DIR"
  exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "Vercel CLI not found, installing..."
  npm install -g vercel
fi

echo "Starting deployment process..."
echo "$(date): Starting deployment" > "$DEPLOY_LOG"

# Navigate to frontend directory
cd "$FRONTEND_DIR"

# Install dependencies
echo "Installing dependencies..."
echo "$(date): Installing dependencies" >> "$DEPLOY_LOG"
npm install >> "$DEPLOY_LOG" 2>&1
if [ $? -ne 0 ]; then
  echo "Failed to install dependencies. Check $DEPLOY_LOG for details."
  exit 1
fi

# Build the project
echo "Building the frontend..."
echo "$(date): Building frontend" >> "$DEPLOY_LOG"
npm run build >> "$DEPLOY_LOG" 2>&1
if [ $? -ne 0 ]; then
  echo "Failed to build the project. Check $DEPLOY_LOG for details."
  exit 1
fi

# Deploy to production
echo "Deploying to production..."
echo "$(date): Deploying to production" >> "$DEPLOY_LOG"
vercel deploy --prod >> "$DEPLOY_LOG" 2>&1
if [ $? -ne 0 ]; then
  echo "Failed to deploy to production. Check $DEPLOY_LOG for details."
  exit 1
fi

echo "$(date): Deployment complete" >> "$DEPLOY_LOG"
echo
echo "Deployment complete!"
echo "Check $DEPLOY_LOG for full deployment log"
echo
echo "Next steps:"
echo "1. Run the 404 checker script to verify the fixes: npm run check-404"
echo "2. Set up the cron job to periodically check for 404s: npm run cron-setup"
echo 