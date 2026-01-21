#!/bin/bash

# Script to submit URLs to Google Search Console for indexing
# This script helps recover from the job posting tracking issue that started Jan 4, 2026

echo "🔍 Google Search Console URL Submission Helper"
echo "================================================"
echo ""
echo "This script will help you submit URLs for re-indexing."
echo "You'll need to manually submit each URL via Google Search Console."
echo ""

# Check if we have the REINDEX_THESE_PAGES.txt file
if [ ! -f "REINDEX_THESE_PAGES.txt" ]; then
    echo "❌ Error: REINDEX_THESE_PAGES.txt not found"
    exit 1
fi

# Extract URLs from the file
urls=$(grep -E '^[0-9]+\. https://' REINDEX_THESE_PAGES.txt | sed 's/^[0-9]*\. //')

echo "📋 Found $(echo "$urls" | wc -l | tr -d ' ') URLs to submit"
echo ""
echo "INSTRUCTIONS:"
echo "-------------"
echo "1. Open Google Search Console: https://search.google.com/search-console"
echo "2. Select property: clickclickjob.com"
echo "3. Use the 'URL Inspection' tool (top search bar)"
echo "4. Copy each URL below and submit for indexing"
echo "5. Wait ~1 minute between submissions to avoid rate limits"
echo ""
echo "URLs TO SUBMIT:"
echo "==============="
echo ""

counter=1
for url in $urls; do
    echo "$counter. $url"
    counter=$((counter + 1))
done

echo ""
echo "ALSO SUBMIT THESE SITEMAPS:"
echo "==========================="
echo "1. https://www.clickclickjob.com/sitemap.xml"
echo "2. https://www.clickclickjob.com/sitemap-jobs.xml"
echo ""
echo "To submit sitemaps:"
echo "1. Go to: Google Search Console > Sitemaps"
echo "2. Add sitemap URL"
echo "3. Click 'Submit'"
echo ""
echo "✅ After submitting all URLs and sitemaps, monitor in Google Search Console"
echo "   Expected recovery time: 3-7 days"
echo ""

# Create a simplified list for easy copying
echo "Creating a simple list in URLS_TO_REINDEX.txt..."
echo "$urls" > URLS_TO_REINDEX.txt
echo ""
echo "✅ Saved simplified URL list to URLS_TO_REINDEX.txt"
