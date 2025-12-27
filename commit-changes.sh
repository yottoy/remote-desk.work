#!/bin/bash
# Script to commit changes and trigger workflows

set -e  # Exit on error

echo "🔧 Step 1: Committing changes..."
cd "/Users/yotamtroim/Library/Mobile Documents/com~apple~CloudDocs/Projects/remote-desk.work"

# Stage the changes
git add .github/workflows/scrape-jobs.yml
git add .github/workflows/run-scrapers.yml
git add STALE_DATA_FIX.md
git add STORAGE_ISSUE_EXPLANATION.md
git add COMPLETE_FIX_SUMMARY.md
git add diagnose-stale-data.js

# Show what's being committed
echo "📋 Files to commit:"
git status --short

# Commit
git commit -m "Fix: Re-enable scrapers with zero storage usage

- Re-enabled scraper schedules (disabled 167 days ago)
- Disabled artifact uploads (were using 4+ GB/month)  
- Jobs save directly to MongoDB (no artifacts needed)
- Resolves stale data issue with zero storage cost

Changes:
- scrape-jobs.yml: Uncommented schedule, disabled artifacts
- run-scrapers.yml: Uncommented schedule, disabled artifacts
- Added diagnostic tools and documentation"

echo "✅ Changes committed!"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Push complete!"

echo ""
echo "==========================================="
echo "✅ COMMIT SUCCESSFUL!"
echo "==========================================="
echo ""
echo "Next steps:"
echo "1. Wait a few seconds for GitHub to process"
echo "2. Run the workflow trigger script:"
echo "   bash trigger-workflows.sh"

