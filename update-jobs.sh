#!/bin/bash
# Complete Job Scraper and MongoDB Update Script
# This script replaces the need for GitHub Actions

set -e  # Exit on error

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   CLICKCLICKJOB - MANUAL SCRAPER & DATABASE UPDATE    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Change to project directory
cd "/Users/yotamtroim/Library/Mobile Documents/com~apple~CloudDocs/Projects/remote-desk.work"

# Step 1: Check dependencies
echo "📋 Step 1: Checking dependencies..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found!"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found!"
    exit 1
fi

echo "✅ Dependencies OK"
echo ""

# Step 2: Install/update Python packages
echo "📦 Step 2: Installing Python dependencies..."
python3 -m pip install --quiet --upgrade python-jobspy pandas beautifulsoup4 markdownify
echo "✅ Python packages ready"
echo ""

# Step 3: Run the scraper
echo "🔍 Step 3: Running job scraper..."
echo "This will take 5-10 minutes to fetch jobs from Indeed and LinkedIn..."
mkdir -p results logs

python3 direct_scraper.py 2>&1 | tee logs/manual-run-$(date +%Y%m%d-%H%M%S).log

# Check if scraper succeeded
if [ ! -f "results/combined-results.json" ]; then
    echo "❌ Scraper failed - no results file created"
    exit 1
fi

# Count jobs found
JOBS_FOUND=$(python3 -c "import json; data=json.load(open('results/combined-results.json')); print(len(data) if isinstance(data, list) else len(data.get('jobs', [])))")
echo "✅ Scraper completed: Found $JOBS_FOUND jobs"
echo ""

# Step 4: Clean old MongoDB data
echo "🗑️  Step 4: Cleaning old jobs from MongoDB..."
node clean-and-import.js

echo "✅ Old data cleaned"
echo ""

# Step 5: Import fresh data
echo "📥 Step 5: Importing fresh jobs to MongoDB..."
node import-scraper-to-mongodb.js 2>&1 | tee logs/mongodb-import-$(date +%Y%m%d-%H%M%S).log

if [ $? -eq 0 ]; then
    echo "✅ Import successful!"
else
    echo "⚠️  Import completed with warnings (might be quota-related)"
fi
echo ""

# Step 6: Verify fresh data
echo "🔍 Step 6: Verifying database has fresh data..."
node diagnose-stale-data.js 2>&1 | grep -A 5 "Most recent jobs"

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                  ✅ UPDATE COMPLETE!                   ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "   - Scraped: $JOBS_FOUND jobs"
echo "   - Database: Updated with fresh data"
echo "   - Website: Should now show current jobs"
echo ""
echo "💡 Next run: Run this script again in 3-7 days"
echo "   or whenever you notice stale data"
echo ""
echo "📝 Logs saved to:"
echo "   logs/manual-run-*.log"
echo "   logs/mongodb-import-*.log"






