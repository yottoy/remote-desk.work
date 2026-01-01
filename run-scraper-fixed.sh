#!/bin/bash

echo "🚀 Starting JobSpy Scraper - Fixed Version"
echo "=========================================="
echo ""

# Check if python3 exists
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3"
    exit 1
fi

# Check if node exists
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
fi

echo "✅ Python3 version: $(python3 --version)"
echo "✅ Node.js version: $(node --version)"
echo ""

# Step 0: Cleanup old jobs from MongoDB
echo "🧹 Step 0: Cleaning up old jobs from MongoDB..."
echo "================================================"
node cleanup-old-jobs-enhanced.js --days=30 --remove-invalid --remove-duplicates 2>&1 | tee logs/cleanup-$(date +%Y%m%d-%H%M%S).log
if [ $? -eq 0 ]; then
    echo "✅ Cleanup completed successfully"
else
    echo "⚠️  Cleanup had issues, but continuing with scraping..."
fi
echo ""

# Check if bridge script exists
if [ ! -f "jobspy_bridge.py" ]; then
    echo "❌ jobspy_bridge.py not found in current directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Kill any existing bridge processes
echo "🧹 Cleaning up old bridge processes..."
pkill -f "jobspy_bridge.py" 2>/dev/null
sleep 2

# Start the bridge
echo "🌉 Starting JobSpy bridge..."
python3 jobspy_bridge.py > jobspy_bridge.log 2>&1 &
BRIDGE_PID=$!
echo $BRIDGE_PID > bridge_pid.txt
echo "Bridge started with PID: $BRIDGE_PID"

# Wait for bridge to be ready
echo "⏳ Waiting for bridge to start (30 seconds)..."
COUNTER=0
MAX_WAIT=30
while [ $COUNTER -lt $MAX_WAIT ]; do
    if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
        echo "✅ Bridge is ready!"
        break
    fi
    sleep 1
    COUNTER=$((COUNTER + 1))
    echo -n "."
done
echo ""

if [ $COUNTER -eq $MAX_WAIT ]; then
    echo "❌ Bridge failed to start. Check logs:"
    tail -20 jobspy_bridge.log
    kill $BRIDGE_PID 2>/dev/null
    exit 1
fi

# Run scrapers
echo ""
echo "📊 Running scrapers..."
echo "====================="

echo ""
echo "1️⃣ Scraping Indeed, LinkedIn..."
node scrape-all-jobs.js 2>&1 | tee logs/scrape-all-$(date +%Y%m%d-%H%M%S).log

echo ""
echo "2️⃣ Scraping alternative sites..."
node scrape-alt-sites.js 2>&1 | tee logs/scrape-alt-$(date +%Y%m%d-%H%M%S).log

echo ""
echo "3️⃣ Scraping WeWorkRemotely..."
node scrape-weworkremotely.js 2>&1 | tee logs/scrape-wwr-$(date +%Y%m%d-%H%M%S).log

echo ""
echo "4️⃣ Scraping RemoteOK..."
node scrape-remoteok.js 2>&1 | tee logs/scrape-remoteok-$(date +%Y%m%d-%H%M%S).log

echo ""
echo "5️⃣ Scraping Remotive..."
node scrape-remotive.js 2>&1 | tee logs/scrape-remotive-$(date +%Y%m%d-%H%M%S).log

# Check results
echo ""
echo "📦 Results Summary:"
echo "==================="
for file in scrape-results.json alt-sites-results.json weworkremotely-results.json remoteok-results.json remotive-results.json; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        echo "✅ $file - $size bytes"
    else
        echo "❌ $file - not found"
    fi
done

# Combine results
echo ""
echo "6️⃣ Combining all results..."
node combine-scraper-results.js 2>&1 | tee logs/combine-$(date +%Y%m%d-%H%M%S).log

if [ -f "combined-results.json" ]; then
    JOB_COUNT=$(node -e "try { const data = require('./combined-results.json'); console.log(Array.isArray(data) ? data.length : (data.jobs ? data.jobs.length : 0)); } catch(e) { console.log(0); }")
    echo "✅ Combined results: $JOB_COUNT jobs"
    
    if [ "$JOB_COUNT" -gt 0 ]; then
        # Import to MongoDB
        echo ""
        echo "💾 Importing to MongoDB..."
        node import-scraper-to-mongodb.js 2>&1 | tee logs/mongodb-import-$(date +%Y%m%d-%H%M%S).log
        
        echo ""
        echo "✅ Import complete!"
    else
        echo "⚠️  No jobs found to import"
    fi
else
    echo "❌ combined-results.json not found"
fi

# Stop bridge
echo ""
echo "🛑 Stopping bridge..."
kill $BRIDGE_PID 2>/dev/null
rm -f bridge_pid.txt

echo ""
echo "✅ Scraper run complete!"
echo "Check logs in the logs/ directory for details"
