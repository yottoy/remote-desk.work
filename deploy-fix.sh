#!/bin/bash
# All-in-one script to fix, commit, and deploy

echo "╔════════════════════════════════════════════════════════╗"
echo "║   CLICKCLICKJOB STALE DATA FIX - AUTOMATED DEPLOY      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "diagnose-stale-data.js" ]; then
  echo "❌ Error: Please run this script from the project root directory"
  exit 1
fi

echo "Step 1: Checking Xcode license..."
if git status > /dev/null 2>&1; then
  echo "✅ Git is working"
else
  echo ""
  echo "⚠️  Xcode license not accepted yet"
  echo ""
  echo "Please run this command first:"
  echo "  sudo xcodebuild -license"
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo ""
echo "Step 2: Showing changes to commit..."
echo "──────────────────────────────────────────────────────"
git status --short .github/workflows/ *.md *.js 2>/dev/null || git status --short
echo "──────────────────────────────────────────────────────"
echo ""

read -p "Proceed with commit? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Aborted by user"
  exit 1
fi

echo ""
echo "Step 3: Staging files..."
git add .github/workflows/scrape-jobs.yml
git add .github/workflows/run-scrapers.yml
git add STALE_DATA_FIX.md
git add STORAGE_ISSUE_EXPLANATION.md
git add COMPLETE_FIX_SUMMARY.md
git add QUICK_START.md
git add diagnose-stale-data.js
git add commit-changes.sh
git add trigger-workflows.sh
git add deploy-fix.sh
echo "✅ Files staged"

echo ""
echo "Step 4: Creating commit..."
git commit -m "Fix: Re-enable scrapers with zero storage usage

- Re-enabled scraper schedules (disabled 167 days ago)
- Disabled artifact uploads (were using 4+ GB/month)
- Jobs save directly to MongoDB (no artifacts needed)
- Resolves stale data issue with zero storage cost
- Added diagnostic tools and deployment scripts

Workflows fixed:
- scrape-jobs.yml: Uncommented schedule, disabled artifacts
- run-scrapers.yml: Uncommented schedule, disabled artifacts

Files added:
- diagnose-stale-data.js: Database health checker
- STALE_DATA_FIX.md: Issue documentation
- STORAGE_ISSUE_EXPLANATION.md: Root cause analysis
- COMPLETE_FIX_SUMMARY.md: Complete overview
- QUICK_START.md: Quick reference guide
- Deployment scripts for easy execution"

echo "✅ Commit created"

echo ""
echo "Step 5: Pushing to GitHub..."
git push origin main
echo "✅ Pushed to GitHub!"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                   ✅ COMMIT SUCCESSFUL!                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Trigger workflows to get fresh data:"
echo "   📱 Easy way (Recommended):"
echo "      https://github.com/yottoy/remote-desk.work/actions"
echo "      - Click 'JobSpy Scraper'"
echo "      - Click 'Run workflow' → 'Run workflow'"
echo ""
echo "   🖥️  Script way (requires GitHub token):"
echo "      export GITHUB_TOKEN='your_token'"
echo "      bash trigger-workflows.sh"
echo ""
echo "2. Wait 20-30 minutes for completion"
echo ""
echo "3. Verify fresh data:"
echo "   node diagnose-stale-data.js"
echo ""
echo "4. Check the website:"
echo "   https://clickclickjob.com"
echo ""
echo "📊 Monitor workflows at:"
echo "   https://github.com/yottoy/remote-desk.work/actions"
echo ""


