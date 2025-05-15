#!/bin/bash

# Setup MongoDB Environment Variables
echo "Setting up MongoDB environment for ClickClickJob.com"

# Ask for MongoDB URI
echo -n "Enter your MongoDB connection string (mongodb+srv://...): "
read MONGODB_URI

# Validate input
if [[ -z "$MONGODB_URI" ]]; then
  echo "Error: MongoDB URI is required"
  exit 1
fi

# Ask for database name (with default)
echo -n "Enter your MongoDB database name [default: clickclickjob]: "
read MONGODB_DB
MONGODB_DB=${MONGODB_DB:-clickclickjob}

# Save to .env in project root
echo "MONGODB_URI=$MONGODB_URI" > .env
echo "MONGODB_DB=$MONGODB_DB" >> .env
echo "Created .env file in project root"

# Save to frontend/.env for Next.js
echo "MONGODB_URI=$MONGODB_URI" > frontend/.env
echo "MONGODB_DB=$MONGODB_DB" >> frontend/.env
echo "Created .env file in frontend directory"

# Export variables for current session
export MONGODB_URI=$MONGODB_URI
export MONGODB_DB=$MONGODB_DB
echo "Exported environment variables for current terminal session"

echo ""
echo "Setup complete! You can now run:"
echo "  1. node test-mongodb-connection.js        # To test direct MongoDB connection"
echo "  2. ./test-api-connection.sh               # To test API endpoints"
echo ""
echo "For Vercel deployment, add these environment variables in the Vercel dashboard:"
echo "  MONGODB_URI=$MONGODB_URI"
echo "  MONGODB_DB=$MONGODB_DB" 