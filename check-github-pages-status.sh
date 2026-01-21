#!/bin/bash

# GitHub Pages Status Checker
# This script helps you identify if GitHub Pages is enabled on your repositories

echo "=================================================="
echo "GitHub Pages Status Checker"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

# Get repository information
REPO_URL=$(git remote get-url origin 2>/dev/null)
if [ -z "$REPO_URL" ]; then
    echo -e "${RED}Error: No origin remote found${NC}"
    exit 1
fi

# Extract owner and repo name from URL
if [[ $REPO_URL =~ github\.com[:/](.+)/(.+)(\.git)?$ ]]; then
    OWNER="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]%.git}"
else
    echo -e "${RED}Error: Could not parse GitHub URL: $REPO_URL${NC}"
    exit 1
fi

echo "Repository: $OWNER/$REPO"
echo "URL: https://github.com/$OWNER/$REPO"
echo ""

# Check for gh-pages branch
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Checking for gh-pages branch..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if git show-ref --verify --quiet refs/heads/gh-pages; then
    echo -e "${RED}⚠️  LOCAL gh-pages branch EXISTS${NC}"
    HAS_LOCAL_PAGES=1
else
    echo -e "${GREEN}✓ No local gh-pages branch${NC}"
    HAS_LOCAL_PAGES=0
fi

if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
    echo -e "${RED}⚠️  REMOTE gh-pages branch EXISTS${NC}"
    HAS_REMOTE_PAGES=1
else
    echo -e "${GREEN}✓ No remote gh-pages branch${NC}"
    HAS_REMOTE_PAGES=0
fi

echo ""

# Check for Pages-specific files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Checking for GitHub Pages files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FILES_FOUND=0

if [ -f "CNAME" ]; then
    echo -e "${YELLOW}⚠️  CNAME file found: $(cat CNAME)${NC}"
    FILES_FOUND=1
fi

if [ -f ".nojekyll" ]; then
    echo -e "${YELLOW}⚠️  .nojekyll file found${NC}"
    FILES_FOUND=1
fi

if [ -f "_config.yml" ]; then
    echo -e "${YELLOW}⚠️  _config.yml file found (Jekyll config)${NC}"
    FILES_FOUND=1
fi

if [ $FILES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No GitHub Pages specific files found${NC}"
fi

echo ""

# Check workflows for Pages deployment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Checking GitHub Actions workflows..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WORKFLOW_FOUND=0
if [ -d ".github/workflows" ]; then
    for workflow in .github/workflows/*.{yml,yaml}; do
        if [ -f "$workflow" ]; then
            if grep -q "pages\|gh-pages\|peaceiris/actions-gh-pages\|github-pages" "$workflow" 2>/dev/null; then
                echo -e "${RED}⚠️  Pages deployment found in: $(basename $workflow)${NC}"
                WORKFLOW_FOUND=1
            fi
        fi
    done
fi

if [ $WORKFLOW_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No Pages deployment workflows found${NC}"
fi

echo ""

# Try to check if Pages is enabled via GitHub API (will only work if repo is public)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Checking GitHub API..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PAGES_RESPONSE=$(curl -s -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$OWNER/$REPO/pages" 2>&1)

if echo "$PAGES_RESPONSE" | grep -q "\"html_url\""; then
    PAGES_URL=$(echo "$PAGES_RESPONSE" | grep -o "\"html_url\":\"[^\"]*\"" | cut -d'"' -f4)
    echo -e "${RED}⚠️  GitHub Pages IS ENABLED!${NC}"
    echo -e "${RED}   Pages URL: $PAGES_URL${NC}"
    PAGES_ENABLED=1
elif echo "$PAGES_RESPONSE" | grep -q "Not Found"; then
    echo -e "${GREEN}✓ GitHub Pages appears to be disabled${NC}"
    echo "   (or repository is private/needs authentication)"
    PAGES_ENABLED=0
else
    echo -e "${YELLOW}⚠️  Could not determine Pages status${NC}"
    echo "   Response: $PAGES_RESPONSE"
    PAGES_ENABLED=-1
fi

echo ""

# Check potential Pages URLs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Testing potential Pages URLs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test user/org Pages site
USER_PAGES_URL="https://$OWNER.github.io/"
echo "Testing: $USER_PAGES_URL"
if curl -s -I "$USER_PAGES_URL" | grep -q "200 OK"; then
    echo -e "${YELLOW}⚠️  User/org Pages site exists: $USER_PAGES_URL${NC}"
else
    echo -e "${GREEN}✓ No user/org Pages site at $USER_PAGES_URL${NC}"
fi

# Test project Pages site
PROJECT_PAGES_URL="https://$OWNER.github.io/$REPO/"
echo "Testing: $PROJECT_PAGES_URL"
if curl -s -I "$PROJECT_PAGES_URL" | grep -q "200 OK"; then
    echo -e "${RED}⚠️  Project Pages site EXISTS: $PROJECT_PAGES_URL${NC}"
    echo -e "${RED}   THIS IS LIKELY THE ISSUE!${NC}"
else
    echo -e "${GREEN}✓ No project Pages site at $PROJECT_PAGES_URL${NC}"
fi

echo ""

# Summary
echo "=================================================="
echo "SUMMARY & RECOMMENDATIONS"
echo "=================================================="
echo ""

ISSUES_FOUND=0

if [ $HAS_LOCAL_PAGES -eq 1 ] || [ $HAS_REMOTE_PAGES -eq 1 ]; then
    echo -e "${RED}❌ gh-pages branch exists${NC}"
    echo "   Action: Delete the gh-pages branch"
    echo "   Commands:"
    if [ $HAS_LOCAL_PAGES -eq 1 ]; then
        echo "     git branch -D gh-pages"
    fi
    if [ $HAS_REMOTE_PAGES -eq 1 ]; then
        echo "     git push origin --delete gh-pages"
    fi
    echo ""
    ISSUES_FOUND=1
fi

if [ $PAGES_ENABLED -eq 1 ]; then
    echo -e "${RED}❌ GitHub Pages is ENABLED${NC}"
    echo "   Action: Disable Pages in repository settings"
    echo "   URL: https://github.com/$OWNER/$REPO/settings/pages"
    echo "   Set Source to: None"
    echo ""
    ISSUES_FOUND=1
fi

if [ $FILES_FOUND -eq 1 ]; then
    echo -e "${YELLOW}⚠️  Pages-related files found${NC}"
    echo "   Action: Consider removing these files if not needed"
    echo ""
fi

if [ $WORKFLOW_FOUND -eq 1 ]; then
    echo -e "${YELLOW}⚠️  Pages deployment workflows found${NC}"
    echo "   Action: Remove or disable these workflows"
    echo ""
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No obvious Pages issues found in local repository${NC}"
    echo ""
    echo "However, GitHub reported an issue. Please:"
    echo "1. Check repository settings: https://github.com/$OWNER/$REPO/settings/pages"
    echo "2. Check all your repositories: https://github.com/$OWNER?tab=repositories"
    echo "3. Look for repositories with 'github-pages' environment"
    echo "4. Consider making repository private if it's currently public"
fi

echo ""
echo "=================================================="
echo "MANUAL CHECKS REQUIRED"
echo "=================================================="
echo ""
echo "You MUST manually check:"
echo "1. Repository Pages Settings:"
echo "   https://github.com/$OWNER/$REPO/settings/pages"
echo ""
echo "2. Repository Environments (look for 'github-pages'):"
echo "   https://github.com/$OWNER/$REPO/deployments"
echo ""
echo "3. All your repositories for Pages:"
echo "   https://github.com/$OWNER?tab=repositories"
echo ""
echo "4. Check if repository is public (might need to be private):"
echo "   https://github.com/$OWNER/$REPO/settings"
echo ""
echo "=================================================="
