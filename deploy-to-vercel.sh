#!/bin/bash

# Deploy ClickClickJob.com to Vercel with MongoDB verification
echo "===== Deploying ClickClickJob.com to Vercel ====="

# Load environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env"
  export $(cat .env | xargs)
else
  echo "No .env file found"
  
  # Check if environment variables are set
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
fi

# Verify MongoDB connection
echo "🔍 Verifying MongoDB connection..."
node test-connection.js

if [ $? -ne 0 ]; then
  echo "❌ MongoDB connection failed. Fix the connection issues before deploying."
  exit 1
fi

echo "✅ MongoDB connection verified successfully!"

# Make sure the database name is included in the URI
if [[ "$MONGODB_URI" != *"/clickclickjob"* ]]; then
  echo "⚠️ Database name might not be specified in the URI."
  echo "Current URI: $MONGODB_URI"
  echo "Consider updating it to include /clickclickjob before the query parameters."
  
  # Offer to fix the URI
  read -p "Do you want to update the URI to include the database name? (y/n): " update_uri
  if [[ "$update_uri" == "y" ]]; then
    # Extract parts before and after the query parameters
    uri_base=$(echo "$MONGODB_URI" | cut -d'?' -f1)
    uri_params=$(echo "$MONGODB_URI" | grep -q '?' && echo "?$(echo "$MONGODB_URI" | cut -d'?' -f2-)" || echo "")
    
    # Add database name if not present
    if [[ "$uri_base" != *"/"* ]] || [[ "$uri_base" =~ .*/.* && "$uri_base" != *"/clickclickjob" ]]; then
      if [[ "$uri_base" =~ .*/$ ]]; then
        # Remove trailing slash if present
        uri_base="${uri_base%/}"
      fi
      
      # If there's a database name already, replace it
      if [[ "$uri_base" =~ .*/[^/]+$ && "$uri_base" != *"/clickclickjob" ]]; then
        uri_base=$(echo "$uri_base" | sed 's#/[^/]*$#/clickclickjob#')
      else
        # Add database name
        uri_base="${uri_base}/clickclickjob"
      fi
    fi
    
    # Set the updated URI
    export MONGODB_URI="${uri_base}${uri_params}"
    echo "Updated URI: $MONGODB_URI"
    
    # Update .env file if it exists
    if [ -f .env ]; then
      # Update MONGODB_URI line
      sed -i.bak "s#^MONGODB_URI=.*#MONGODB_URI=$MONGODB_URI#" .env && rm .env.bak
      echo "Updated .env file with new URI"
    fi
  fi
fi

# Copy MongoDB environment to frontend
echo "📋 Copying MongoDB environment to frontend..."
echo "MONGODB_URI=$MONGODB_URI" > frontend/.env
echo "MONGODB_DB=$MONGODB_DB" >> frontend/.env

# Navigate to frontend directory
cd frontend || { echo "❌ frontend directory not found"; exit 1; }

# Check for the existence of vercel.json
if [ ! -f vercel.json ]; then
  echo "⚠️ vercel.json not found, creating it..."
  cat > vercel.json <<EOF
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "MONGODB_URI": "@mongodb-uri",
    "MONGODB_DB": "clickclickjob"
  }
}
EOF
  echo "✅ vercel.json created"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the Next.js app
echo "🏗️ Building the application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix the build issues before deploying."
  exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "Note: You will need to set MONGODB_URI and MONGODB_DB in your Vercel project settings"
echo "MONGODB_URI should be added as a secret environment variable"

# Ask for confirmation before deploying
read -p "Do you want to proceed with deployment? (y/n): " deploy
if [[ "$deploy" != "y" ]]; then
  echo "Deployment canceled."
  exit 0
fi

# Deploy with environment variables
npx vercel --prod

if [ $? -ne 0 ]; then
  echo "❌ Deployment to Vercel failed."
  exit 1
fi

echo "✅ Deployment initiated!"
echo "🌐 Visit your Vercel dashboard to check the deployment status."
echo "After deployment, verify MongoDB connection using:"
echo "https://your-domain.vercel.app/api/health" 