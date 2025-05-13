#!/bin/bash

# Frontend deployment script for ClickClickJob.com

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting deployment process for ClickClickJob.com frontend..."

# Get the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build for production
echo "Building for production..."
npm run build

# Run tests if they exist
if [ -f "package.json" ] && grep -q "\"test\":" "package.json"; then
  echo "Running tests..."
  npm test
fi

# Create deployment package
echo "Creating deployment package..."
mkdir -p dist
tar -czf dist/frontend-package.tar.gz build

# For actual deployment, you might use different commands depending on your hosting provider
# Examples:
# - For AWS S3: aws s3 sync ./build s3://your-bucket-name/ --delete
# - For Netlify: netlify deploy --prod
# - For Vercel: vercel --prod

echo "Deployment package created at dist/frontend-package.tar.gz"
echo "To deploy to production, run your hosting provider's deployment command"
echo "Example: aws s3 sync ./build s3://clickclickjob.com/ --delete"

echo "Deployment preparation complete!"

# Make this script executable with: chmod +x deploy.sh 