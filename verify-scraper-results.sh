#!/bin/bash

echo "🔍 Verifying Scraper Results"
echo "============================"
echo ""

# Check if results files exist
if [ ! -f "combined-results.json" ]; then
    echo "❌ combined-results.json not found. Did scraper run successfully?"
    exit 1
fi

echo "📊 Results Summary:"
echo "==================="

# Total jobs
TOTAL=$(cat combined-results.json | grep -c '"title"')
echo "Total jobs scraped: $TOTAL"
echo ""

echo "🎯 Priority Categories:"
echo "----------------------"

# Data Processing
DP_COUNT=$(cat combined-results.json | grep -i "data processing" | wc -l | xargs)
echo "✅ Data Processing jobs: $DP_COUNT"

# Captioning
CAP_COUNT=$(cat combined-results.json | grep -i "captioning\|caption" | wc -l | xargs)
echo "✅ Captioning jobs: $CAP_COUNT"

# Transcription
TRANS_COUNT=$(cat combined-results.json | grep -i "transcription" | wc -l | xargs)
echo "✅ Transcription jobs: $TRANS_COUNT"
echo ""

echo "🚫 Excluded Categories (Should be 0):"
echo "------------------------------------"

# Tony's Plumbing
PLUMB_COUNT=$(cat combined-results.json | grep -i "tony's plumbing\|plumbing modesto" | wc -l | xargs)
if [ "$PLUMB_COUNT" -eq 0 ]; then
    echo "✅ Tony's Plumbing: $PLUMB_COUNT (GOOD)"
else
    echo "❌ Tony's Plumbing: $PLUMB_COUNT (SHOULD BE 0!)"
fi

# Indulge Travels
TRAVEL_COUNT=$(cat combined-results.json | grep -i "indulge travels" | wc -l | xargs)
if [ "$TRAVEL_COUNT" -eq 0 ]; then
    echo "✅ Indulge Travels: $TRAVEL_COUNT (GOOD)"
else
    echo "❌ Indulge Travels: $TRAVEL_COUNT (SHOULD BE 0!)"
fi

# Talentify
TAL_COUNT=$(cat combined-results.json | grep -i "talentify" | wc -l | xargs)
if [ "$TAL_COUNT" -eq 0 ]; then
    echo "✅ Talentify: $TAL_COUNT (GOOD)"
else
    echo "❌ Talentify: $TAL_COUNT (SHOULD BE 0!)"
fi

echo ""
echo "📈 Success Indicators:"
echo "--------------------"

# Calculate success
if [ "$DP_COUNT" -gt 0 ]; then
    echo "✅ Data processing jobs found"
else
    echo "⚠️  No data processing jobs found (might take time)"
fi

if [ "$CAP_COUNT" -gt 0 ]; then
    echo "✅ Captioning jobs found"
else
    echo "⚠️  No captioning jobs found (might take time)"
fi

if [ "$PLUMB_COUNT" -eq 0 ] && [ "$TRAVEL_COUNT" -eq 0 ] && [ "$TAL_COUNT" -eq 0 ]; then
    echo "✅ No mis-targeted jobs detected"
else
    echo "⚠️  Mis-targeted jobs still appearing - check exclusion patterns"
fi

echo ""
echo "💡 Next Steps:"
echo "-------------"
echo "1. Check MongoDB import log: tail logs/mongodb-import-*.log"
echo "2. Verify categories populated in database"
echo "3. Check frontend: https://clickclickjob.com/categories/data-processing"
echo "4. Check frontend: https://clickclickjob.com/categories/captioning"



