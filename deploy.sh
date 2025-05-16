#!/bin/bash

# ClickClickJob Deployment Script
echo "Starting ClickClickJob deployment process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "Vercel CLI not found. Installing..."
  npm install -g vercel
fi

# Ensure environment variables are prepared
echo "Checking environment variables..."

# List of required environment variables
required_vars=("MONGODB_URI" "MONGODB_DB")
missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo "⚠️ Warning: The following environment variables are not set:"
  for var in "${missing_vars[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "These will need to be configured in the Vercel dashboard."
  echo "You can set them at: https://vercel.com/dashboard → Project Settings → Environment Variables"
  echo ""
fi

# Build the project locally first to catch any errors
echo "Running local build to verify..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Local build failed. Please fix the errors before deploying."
  exit 1
fi

echo "✅ Local build successful."

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed."
  exit 1
fi

echo "✅ Deployment successful! Your app is now live with Vercel Analytics enabled."
echo "Visit the Vercel dashboard to configure environment variables and view analytics data."
echo "https://vercel.com/dashboard" 