#!/bin/bash

echo "⏳ Waiting for Vercel deployment to complete..."
echo "=============================================="
echo ""
echo "Started at: $(date)"
echo "Checking every 30 seconds..."
echo ""

MAX_ATTEMPTS=20  # 10 minutes max
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    # Check captioning page status
    STATUS=$(curl -L -s -o /dev/null -w "%{http_code}" "https://www.clickclickjob.com/categories/captioning")
    
    if [ "$STATUS" = "200" ]; then
        echo ""
        echo "✅ SUCCESS! Captioning page is now live!"
        echo "Status: HTTP $STATUS"
        echo ""
        echo "Running full verification..."
        ./check-vercel-deployment.sh
        echo ""
        echo "🎉 Deployment complete! Next steps:"
        echo "   1. Visit: https://clickclickjob.com/categories/captioning"
        echo "   2. Submit to Google Search Console"
        echo "   3. Run scrapers: ./run-scraper-fixed.sh"
        exit 0
    else
        echo "[$ATTEMPT/$MAX_ATTEMPTS] Still building... Status: HTTP $STATUS ($(date +%H:%M:%S))"
        sleep 30
    fi
done

echo ""
echo "⚠️  Timeout reached after 10 minutes"
echo "Current status: HTTP $STATUS"
echo ""
echo "💡 If still 404, check Vercel Dashboard:"
echo "   https://vercel.com/dashboard"
echo "   Look for any build errors or warnings"



