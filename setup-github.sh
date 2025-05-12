#!/bin/bash

# Setup GitHub repository for remote-desk.work
# Run with: bash setup-github.sh

echo "Setting up GitHub repository for remote-desk.work..."

# 1. Make sure we're in the root directory
cd "$(dirname "$0")"

# 2. Initialize git repository (if not already done)
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
fi

# 3. Add all files to git
echo "Adding files to git..."
git add .

# 4. Create initial commit
echo "Creating initial commit..."
git commit -m "Initial commit: Remote Job Scraper setup"

# 5. Create a new GitHub repository
echo "Please create a new GitHub repository named 'remote-desk.work'"
echo "Visit: https://github.com/new"
echo "Repository name: remote-desk.work"
echo "Description: Remote job scraping system focused on data entry and administrative roles"
echo "Make it Public or Private according to your preference"
echo "Do NOT initialize with README, .gitignore, or license"
echo ""
read -p "Press Enter after you've created the repository..."

# 6. Add GitHub repository as remote
echo "Adding GitHub remote..."
read -p "Enter your GitHub username: " github_username
git remote add origin "https://github.com/$github_username/remote-desk.work.git"

# 7. Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main || git push -u origin master

echo ""
echo "GitHub setup complete!"
echo "Next steps:"
echo "1. Add these secrets to your GitHub repository:"
echo "   - MONGODB_URI: your MongoDB connection string"
echo "   Visit: https://github.com/$github_username/remote-desk.work/settings/secrets/actions"
echo ""
echo "2. Configure your CI/CD workflow:"
echo "   The workflow is already set up in .github/workflows/daily-scrape.yml"
echo "   It will run daily at 2:00 AM UTC to scrape new jobs"
echo ""
echo "3. To test the scraper, run: npm start"
echo "   Make sure you have installed dependencies: npm install"
echo "   And Playwright browsers: npx playwright install"
echo ""
echo "4. Monitor job scraping in GitHub Actions:"
echo "   Visit: https://github.com/$github_username/remote-desk.work/actions" 