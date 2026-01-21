#!/bin/bash
# GitHub Actions Diagnostic Script

echo "🔍 GITHUB ACTIONS DIAGNOSTIC"
echo "============================================"
echo ""

# Check repository
echo "📦 Repository:"
git remote get-url origin
echo ""

# Check if we can access GitHub
echo "🌐 GitHub Connectivity:"
if curl -s --connect-timeout 5 https://github.com > /dev/null; then
  echo "✅ Can reach GitHub"
else
  echo "❌ Cannot reach GitHub"
fi
echo ""

# Check last commit
echo "📝 Last Commit:"
git log -1 --oneline
echo ""

# Check workflow files
echo "⚙️  Workflow Files in .github/workflows/:"
ls -1 .github/workflows/*.yml | wc -l | xargs echo "Total:"
echo ""

# Check git status
echo "📊 Git Status:"
if git status | grep -q "nothing to commit"; then
  echo "✅ Working tree clean"
else
  echo "⚠️  Uncommitted changes exist"
fi
echo ""

# Recent push
echo "🚀 Last Push:"
git log origin/main -1 --pretty=format:"%h - %s (%ar)" 2>/dev/null || echo "Unable to check"
echo ""
echo ""

# Instructions
echo "============================================"
echo "📋 NEXT STEPS:"
echo ""
echo "Since I can't access the GitHub API directly,"
echo "please check these manually:"
echo ""
echo "1. Go to: https://github.com/yottoy/remote-desk.work/settings/actions"
echo ""
echo "2. Check 'Actions permissions':"
echo "   Should be: 'Allow all actions and reusable workflows'"
echo "   NOT: 'Disable actions'"
echo ""
echo "3. Check 'Workflow permissions':"
echo "   Should be: 'Read and write permissions'"
echo ""
echo "4. Go to: https://github.com/yottoy/remote-desk.work/actions"
echo "   Look at the runs list"
echo ""
echo "5. Tell me what you see:"
echo "   - Are Actions enabled or disabled?"
echo "   - Do you see any recent workflow runs?"
echo "   - Any error messages?"
echo ""






