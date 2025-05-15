#!/bin/bash

# Verify MongoDB connection after deployment
echo "===== Verifying MongoDB Connection on ClickClickJob.com ====="

# Base URL - can be changed for development/staging
BASE_URL="https://www.clickclickjob.com"
if [[ -n "$1" ]]; then
  BASE_URL="$1"
  echo "Using custom base URL: $BASE_URL"
fi

# Test health endpoint
echo -e "\n1. Testing API health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")

echo "Health endpoint response:"
echo $HEALTH_RESPONSE | jq '.' 2>/dev/null || echo $HEALTH_RESPONSE

# Check if MongoDB connection is successful
DB_CONNECTED=$(echo $HEALTH_RESPONSE | grep -o '"connected":true' || echo "")
if [ -z "$DB_CONNECTED" ]; then
  echo "❌ API cannot connect to MongoDB."
  echo "Please check environment variables in Vercel dashboard."
  echo "Make sure MONGODB_URI and MONGODB_DB are correctly set."
else
  echo "✅ API successfully connected to MongoDB!"
fi

# Test the jobs API endpoint
echo -e "\n2. Testing jobs API endpoint..."
JOBS_RESPONSE=$(curl -s "$BASE_URL/api/jobs?limit=3")

echo "Jobs endpoint response (limited to 3 jobs):"
echo $JOBS_RESPONSE | jq '.' 2>/dev/null || echo $JOBS_RESPONSE

# Check if jobs are returned
JOB_COUNT=$(echo $JOBS_RESPONSE | grep -o '"totalJobs":[0-9]*' | grep -o '[0-9]*')

if [ -z "$JOB_COUNT" ] || [ "$JOB_COUNT" -eq 0 ]; then
  echo "⚠️ No jobs found in the database. Check if data exists in MongoDB."
else
  echo "✅ Success! Found $JOB_COUNT jobs in the database."
fi

# Test admin jobs API endpoint
echo -e "\n3. Testing admin jobs API endpoint..."
ADMIN_JOBS_RESPONSE=$(curl -s "$BASE_URL/api/admin-jobs?limit=3")

echo "Admin jobs endpoint response (limited to 3 jobs):"
echo $ADMIN_JOBS_RESPONSE | jq '.' 2>/dev/null || echo $ADMIN_JOBS_RESPONSE

# Test categories API endpoint
echo -e "\n4. Testing categories API endpoint..."
CATEGORIES_RESPONSE=$(curl -s "$BASE_URL/api/categories")

echo "Categories endpoint response:"
echo $CATEGORIES_RESPONSE | jq '.' 2>/dev/null || echo $CATEGORIES_RESPONSE

echo -e "\n===== MongoDB Connection Verification Complete ====="

# Final summary
if [ -z "$DB_CONNECTED" ]; then
  echo "❌ MongoDB connection failed. Check Vercel environment variables."
  exit 1
elif [ -z "$JOB_COUNT" ] || [ "$JOB_COUNT" -eq 0 ]; then
  echo "⚠️ MongoDB connected but no jobs found. Check if data exists."
  exit 0
else
  echo "✅ MongoDB connection successful and data is being retrieved!"
  exit 0
fi 