#!/bin/bash

echo "🔄 Re-enabling GitHub Actions scheduled workflows..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install it with: brew install gh"
    echo ""
    echo "Or enable workflows manually at:"
    echo "https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

echo "Enabling scheduled workflows..."
echo ""

# Enable each workflow
gh workflow enable "run-scrapers.yml" && echo "✅ Enabled: Run Job Scrapers"
gh workflow enable "scrape-jobs.yml" && echo "✅ Enabled: Scrape Remote Admin/Data Entry Jobs"
gh workflow enable "database-cleanup.yml" && echo "✅ Enabled: Database Cleanup"

echo ""
echo "✅ All workflows enabled!"
echo ""
echo "📅 Next scheduled runs:"
echo "  - Job Scrapers: Every 12 hours (00:00 and 12:00 UTC)"
echo "  - Database Cleanup: Weekly on Sundays at 03:00 UTC"
echo ""
echo "🔍 Verify with:"
echo "  gh run list --limit 10"
echo ""
echo "⏰ Check again in 12 hours to confirm scheduled runs are working"
