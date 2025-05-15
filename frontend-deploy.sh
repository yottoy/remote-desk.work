#!/bin/bash

# Deploy the frontend to Vercel
echo "===== Deploying ClickClickJob.com Frontend to Vercel ====="

# Change to frontend directory
cd frontend || exit 1

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "Vercel CLI not found. Installing..."
  npm install -g vercel
fi

# Build the frontend
echo "Building frontend..."
npm run build

# Deploy to Vercel
echo "Deploying to Vercel..."
echo "IMPORTANT: Make sure to set these environment variables during deployment:"
echo "  - MONGODB_URI: your MongoDB connection string"
echo "  - MONGODB_DB: clickclickjob"
echo ""

# Execute Vercel deployment
vercel --prod

echo ""
echo "===== Deployment Complete ====="
echo ""
echo "After deployment, verify MongoDB connection by:"
echo "1. Visit the health endpoint at /api/health"
echo "   - Look for 'connected: true' in the response"
echo "2. Visit the jobs API at /api/jobs?limit=5"
echo "   - Verify jobs are being returned from MongoDB"
echo ""
echo "If there are connection issues:"
echo "1. Go to Vercel dashboard > Project Settings > Environment Variables"
echo "2. Verify MONGODB_URI and MONGODB_DB are set correctly"
echo "3. Redeploy if needed" 