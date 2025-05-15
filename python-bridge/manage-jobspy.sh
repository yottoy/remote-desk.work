#!/bin/bash

# JobSpy Bridge Management Script
# This script helps manage the JobSpy bridge deployment on GitHub

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Repository URL
REPO_URL="https://github.com/yottoy/remote-desk.work"

# Function to check status
check_status() {
  echo -e "${YELLOW}Opening browser to GitHub Actions page to check workflow status...${NC}"
  open "${REPO_URL}/actions/workflows/jobspy-scraper.yml"
}

# Function to open manual trigger page
trigger_workflow() {
  echo -e "${YELLOW}Opening browser to GitHub workflow trigger page...${NC}"
  open "${REPO_URL}/actions/workflows/jobspy-scraper.yml"
  echo -e "${GREEN}Please use the 'Run workflow' button on the right side to manually trigger the workflow.${NC}"
}

# Function to update local codebase
update_code() {
  echo -e "${YELLOW}Updating local repository...${NC}"
  git pull origin main
  echo -e "${GREEN}Local repository updated!${NC}"
}

# Function to push changes to GitHub
push_changes() {
  echo -e "${YELLOW}Pushing changes to GitHub...${NC}"
  git add .
  
  echo -e "${YELLOW}Enter commit message:${NC}"
  read commit_message
  
  git commit -m "$commit_message"
  git push origin main
  
  echo -e "${GREEN}Changes pushed to GitHub!${NC}"
}

# Function to open logs directory
view_logs() {
  if [ -d "logs" ]; then
    echo -e "${GREEN}Opening logs directory...${NC}"
    open logs
  else
    echo -e "${RED}Logs directory not found. Creating it...${NC}"
    mkdir -p logs
    touch logs/scraper.log
    echo -e "${GREEN}Logs directory created. Opening...${NC}"
    open logs
  fi
}

# Function to display help menu
display_help() {
  echo "JobSpy Bridge Management Script"
  echo "-------------------------------"
  echo "Usage: ./manage-jobspy.sh [command]"
  echo ""
  echo "Commands:"
  echo "  status       - Check GitHub workflow status"
  echo "  trigger      - Open the manual trigger page for the workflow"
  echo "  update       - Update local code from GitHub"
  echo "  push         - Push local changes to GitHub"
  echo "  logs         - View logs directory"
  echo "  help         - Display this help menu"
  echo ""
  echo "Example: ./manage-jobspy.sh trigger"
}

# Main script execution
case "$1" in
  status)
    check_status
    ;;
  trigger)
    trigger_workflow
    ;;
  update)
    update_code
    ;;
  push)
    push_changes
    ;;
  logs)
    view_logs
    ;;
  help|*)
    display_help
    ;;
esac

exit 0 