#!/bin/bash

# Ensure script stops on first error
set -e

echo "Starting Vercel deployment..."

# Check if we're already logged in to Vercel
if ! vercel whoami &>/dev/null; then
  echo "Please log in to Vercel first:"
  vercel login
fi

# Deploy to production
echo "Deploying to production..."
vercel --prod

echo "Deployment completed. Checking status..."

# Check deployment status
vercel ls clickclickjob --limit 1

echo "Deployment process finished." 