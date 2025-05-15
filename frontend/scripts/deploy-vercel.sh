#!/bin/bash

# Deploy to Vercel with MongoDB connection verification
echo "🚀 Preparing to deploy ClickClickJob to Vercel..."

# Verify MongoDB environment variables are set
if [ -z "$MONGODB_URI" ]; then
  echo "❌ MONGODB_URI environment variable is not set"
  echo "Please set it before deploying:"
  echo "export MONGODB_URI=your_mongodb_connection_string"
  exit 1
fi

if [ -z "$MONGODB_DB" ]; then
  echo "⚠️ MONGODB_DB not set, using default: clickclickjob"
  export MONGODB_DB="clickclickjob"
fi

# Verify MongoDB connection before deploying
echo "🔍 Verifying MongoDB connection..."
node scripts/verify-mongodb.js

if [ $? -ne 0 ]; then
  echo "❌ MongoDB connection failed. Fix the connection issues before deploying."
  exit 1
fi

echo "✅ MongoDB connection verified successfully!"

# Build the application
echo "🏗️ Building the application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix the build issues before deploying."
  exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
npx vercel --prod

if [ $? -ne 0 ]; then
  echo "❌ Deployment to Vercel failed."
  exit 1
fi

echo "✅ Deployment complete!"
echo "🌐 Visit your Vercel dashboard to check the deployment status."

# Verify production deployment
echo "🔍 Waiting for deployment to complete..."
sleep 10
echo "🔍 Verifying production API health..."
echo "Visit your API health endpoint to verify MongoDB connection:"
echo "https://www.clickclickjob.com/api/health" 