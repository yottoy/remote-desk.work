#!/bin/bash

# Test API connection and MongoDB integration
echo "===== Testing ClickClickJob API and MongoDB Connection ====="

# Check if MongoDB URI is set
if [ -z "$MONGODB_URI" ]; then
  echo "Error: MONGODB_URI environment variable is not set"
  echo "Please export your MongoDB connection string: export MONGODB_URI=mongodb://..."
  exit 1
fi

# Test MongoDB connection first
echo -e "\n1. Testing direct MongoDB connection..."
node test-mongodb-connection.js

if [ $? -ne 0 ]; then
  echo "MongoDB connection test failed. Please fix connection issues before continuing."
  exit 1
fi

# Start Next.js development server in background
echo -e "\n2. Starting Next.js development server in background..."
cd frontend
npm run dev &
SERVER_PID=$!

# Give the server some time to start
echo "Waiting for server to start..."
sleep 5

# Test the API health endpoint
echo -e "\n3. Testing API health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)

if [ $? -ne 0 ]; then
  echo "Failed to connect to API health endpoint"
  kill $SERVER_PID
  exit 1
fi

echo "Health endpoint response:"
echo $HEALTH_RESPONSE | jq '.' 2>/dev/null || echo $HEALTH_RESPONSE

# Check if MongoDB connection is successful via API
DB_CONNECTED=$(echo $HEALTH_RESPONSE | grep -o '"connected":true' || echo "")
if [ -z "$DB_CONNECTED" ]; then
  echo "API cannot connect to MongoDB. Check environment variables and connection string."
  kill $SERVER_PID
  exit 1
else
  echo "API successfully connected to MongoDB!"
fi

# Test the jobs API endpoint
echo -e "\n4. Testing jobs API endpoint..."
JOBS_RESPONSE=$(curl -s "http://localhost:3000/api/jobs?limit=2")

echo "Jobs endpoint response (limited to 2 jobs):"
echo $JOBS_RESPONSE | jq '.' 2>/dev/null || echo $JOBS_RESPONSE

# Test admin jobs API endpoint
echo -e "\n5. Testing admin jobs API endpoint..."
ADMIN_JOBS_RESPONSE=$(curl -s "http://localhost:3000/api/admin-jobs?limit=2")

echo "Admin jobs endpoint response (limited to 2 jobs):"
echo $ADMIN_JOBS_RESPONSE | jq '.' 2>/dev/null || echo $ADMIN_JOBS_RESPONSE

# Test categories API endpoint
echo -e "\n6. Testing categories API endpoint..."
CATEGORIES_RESPONSE=$(curl -s "http://localhost:3000/api/categories")

echo "Categories endpoint response:"
echo $CATEGORIES_RESPONSE | jq '.' 2>/dev/null || echo $CATEGORIES_RESPONSE

# Clean up by stopping the server
echo -e "\n7. Stopping Next.js development server..."
kill $SERVER_PID

echo -e "\n===== API and MongoDB test completed ====="

# Check if there were jobs returned to determine success
JOB_COUNT=$(echo $JOBS_RESPONSE | grep -o '"totalJobs":[0-9]*' | grep -o '[0-9]*')

if [ -z "$JOB_COUNT" ] || [ "$JOB_COUNT" -eq 0 ]; then
  echo "Warning: No jobs found in the database. Data may be missing."
  exit 1
else
  echo "Success! Found $JOB_COUNT jobs in the database."
  exit 0
fi 