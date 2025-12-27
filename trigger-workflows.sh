#!/bin/bash
# Script to trigger GitHub Actions workflows via API

set -e

# GitHub repository details
GITHUB_USER="yottoy"
GITHUB_REPO="remote-desk.work"
GITHUB_API="https://api.github.com"

echo "🚀 TRIGGERING GITHUB ACTIONS WORKFLOWS"
echo "========================================"
echo ""

# Check if GitHub token is available
if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️  GITHUB_TOKEN not set in environment"
  echo ""
  echo "To trigger workflows via API, you need a GitHub Personal Access Token."
  echo ""
  echo "Option 1: Set token and run this script"
  echo "  export GITHUB_TOKEN='your_token_here'"
  echo "  bash trigger-workflows.sh"
  echo ""
  echo "Option 2: Trigger manually via GitHub web UI"
  echo "  1. Go to: https://github.com/$GITHUB_USER/$GITHUB_REPO/actions"
  echo "  2. Select a workflow (e.g., 'JobSpy Scraper')"
  echo "  3. Click 'Run workflow' button"
  echo "  4. Click 'Run workflow' again to confirm"
  echo ""
  echo "Workflows to trigger:"
  echo "  - JobSpy Scraper (main scraper, recommended first)"
  echo "  - Main Job Scraper (direct scraper)"
  echo "  - Scrape Remote Admin/Data Entry Jobs"
  echo "  - Run Job Scrapers"
  echo ""
  exit 1
fi

echo "✅ GitHub token found"
echo ""

# Function to trigger a workflow
trigger_workflow() {
  local workflow_file=$1
  local workflow_name=$2
  
  echo "🔄 Triggering: $workflow_name"
  echo "   Workflow file: $workflow_file"
  
  response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Authorization: token $GITHUB_TOKEN" \
    "$GITHUB_API/repos/$GITHUB_USER/$GITHUB_REPO/actions/workflows/$workflow_file/dispatches" \
    -d '{"ref":"main"}')
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" = "204" ]; then
    echo "   ✅ Successfully triggered!"
  else
    echo "   ❌ Failed (HTTP $http_code)"
    echo "   Response: $(echo "$response" | head -n-1)"
  fi
  echo ""
}

# Trigger the main scrapers
echo "Triggering workflows..."
echo ""

trigger_workflow "jobspy-scraper.yml" "JobSpy Scraper"
trigger_workflow "direct-scraper.yml" "Main Job Scraper"
trigger_workflow "scrape-jobs.yml" "Scrape Remote Admin/Data Entry Jobs"
trigger_workflow "run-scrapers.yml" "Run Job Scrapers"

echo "==========================================="
echo "✅ WORKFLOW TRIGGERS COMPLETE!"
echo "==========================================="
echo ""
echo "📊 Check workflow status:"
echo "   https://github.com/$GITHUB_USER/$GITHUB_REPO/actions"
echo ""
echo "⏱️  Workflows should start within 1-2 minutes"
echo "   Each takes 15-30 minutes to complete"
echo ""
echo "🔍 Verify results after completion:"
echo "   node diagnose-stale-data.js"

