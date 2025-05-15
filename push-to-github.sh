#!/bin/bash

# Script to push the project to GitHub
set -e  # Exit on any error

echo "=== Pushing to GitHub ==="
echo "Current directory: $(pwd)"

# Initialize git if not already initialized
if [ ! -d .git ]; then
  echo "Initializing Git repository..."
  git init
fi

# Configure Git if needed
if [ -z "$(git config user.email)" ]; then
  echo "Setting up Git user configuration..."
  git config user.name "ClickClickJob"
  git config user.email "admin@clickclickjob.com"
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
  echo "Creating .gitignore..."
  cat > .gitignore << EOL
node_modules/
.env
*.log
*.json-unfiltered
EOL
fi

# Add files to staging
echo "Adding files to Git..."
git add .

# Commit changes
echo "Committing changes..."
git commit -m "Job scraper system with GitHub workflow integration"

# Check if remote already exists
if ! git remote | grep -q "origin"; then
  echo "Enter your GitHub repository URL (https://github.com/username/repo.git):"
  read GITHUB_URL
  
  if [ -z "$GITHUB_URL" ]; then
    echo "No GitHub URL provided. Skipping push."
    exit 1
  fi
  
  echo "Adding GitHub remote..."
  git remote add origin "$GITHUB_URL"
fi

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main || git push -u origin master

echo "=== Push completed ==="
echo "Go to your GitHub repository to view the code and run the Actions workflow" 