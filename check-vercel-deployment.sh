#!/bin/bash

echo "🔍 Checking Vercel Deployment Status"
echo "====================================="
echo ""

echo "Latest GitHub commits:"
git log --oneline -5
echo ""

echo "📡 Testing category pages..."
echo ""

# Function to test URL
test_url() {
    local url=$1
    local name=$2
    
    echo -n "Testing $name... "
    status=$(curl -L -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" -eq 200 ]; then
        echo "✅ Live (HTTP $status)"
    elif [ "$status" -eq 404 ]; then
        echo "❌ Not Found (HTTP $status)"
    else
        echo "⚠️  Status: HTTP $status"
    fi
}

# Test category pages
test_url "https://clickclickjob.com/categories/data-processing" "Data Processing"
test_url "https://clickclickjob.com/categories/captioning" "Captioning"
test_url "https://clickclickjob.com/categories/data-entry" "Data Entry (control)"
test_url "https://clickclickjob.com" "Homepage (control)"

echo ""
echo "💡 If showing 404:"
echo "   - Wait 5-10 minutes for Vercel build"
echo "   - Check: https://vercel.com/dashboard"
echo "   - Run this script again"
echo ""
echo "💡 If showing ✅:"
echo "   - Submit to Google Search Console"
echo "   - Run scrapers to populate with jobs"

