#!/bin/bash

echo "🔄 Force Revalidating Vercel Pages"
echo "==================================="
echo ""

# URLs to revalidate
URLS=(
    "https://www.clickclickjob.com/categories/captioning"
    "https://www.clickclickjob.com/categories/data-processing"
)

echo "Attempting to force revalidation by making requests..."
echo ""

for url in "${URLS[@]}"; do
    echo "Requesting: $url"
    # Make request with cache-busting headers
    curl -s -o /dev/null -w "Status: %{http_code}\n" \
        -H "Cache-Control: no-cache" \
        -H "Pragma: no-cache" \
        "$url?_=$(date +%s)"
    echo ""
done

echo "✅ Revalidation requests sent"
echo ""
echo "💡 Next steps:"
echo "   1. Wait 2-3 minutes for Vercel to regenerate pages"
echo "   2. Run: ./check-vercel-deployment.sh"
echo "   3. If still 404, you need to purge cache in Vercel Dashboard:"
echo "      - Go to: https://vercel.com/dashboard"
echo "      - Select your project"
echo "      - Deployments → Latest → ... menu → Redeploy"
echo "      - Check 'Use existing Build Cache' = OFF"



