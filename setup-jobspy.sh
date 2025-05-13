#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up JobSpy bridge integration...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found.${NC}"
  echo -e "${YELLOW}Please create a .env file first.${NC}"
  exit 1
fi

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
  echo -e "${RED}Error: Python 3 is required but not found.${NC}"
  echo -e "${YELLOW}Please install Python 3.10+ to use JobSpy.${NC}"
  exit 1
fi

# Make sure we have the python-bridge directory
if [ ! -d "python-bridge" ]; then
  echo -e "${YELLOW}Creating python-bridge directory...${NC}"
  mkdir -p python-bridge
fi

# Check if the main bridge files exist
if [ ! -f "python-bridge/indeed_bridge.py" ] || [ ! -f "python-bridge/requirements.txt" ]; then
  echo -e "${RED}Error: Bridge files not found.${NC}"
  echo -e "${YELLOW}Please make sure python-bridge/indeed_bridge.py and python-bridge/requirements.txt exist.${NC}"
  exit 1
fi

# Install Python dependencies
echo -e "${GREEN}Installing Python dependencies...${NC}"
cd python-bridge && python3 -m pip install -r requirements.txt
if [ $? -ne 0 ]; then
  echo -e "${RED}Error installing Python dependencies.${NC}"
  echo -e "${YELLOW}You may need to install them manually with: python3 -m pip install -r python-bridge/requirements.txt${NC}"
fi
cd ..

# Add JobSpy settings to .env file if they don't exist
echo -e "${GREEN}Updating .env file...${NC}"

# Check if JobSpy settings already exist
if ! grep -q "ENABLE_JOBSPY_INDEED" .env; then
  echo "" >> .env
  echo "# JobSpy Bridge Configuration" >> .env
  echo "ENABLE_JOBSPY_INDEED=true" >> .env
  echo "JOBSPY_BRIDGE_URL=http://localhost:8000" >> .env
  echo "JOBSPY_BRIDGE_HOST=127.0.0.1" >> .env
  echo "JOBSPY_BRIDGE_PORT=8000" >> .env
  echo "# Optional comma-separated list of proxies for JobSpy" >> .env
  echo "# JOBSPY_PROXIES=" >> .env
  
  echo -e "${GREEN}Successfully added JobSpy settings to .env file.${NC}"
else
  # Just enable JobSpy if it exists but is disabled
  sed -i.bak 's/ENABLE_JOBSPY_INDEED=false/ENABLE_JOBSPY_INDEED=true/g' .env
  
  echo -e "${GREEN}JobSpy settings already exist in .env file. Enabled JobSpy.${NC}"
fi

echo -e "${GREEN}JobSpy bridge setup complete!${NC}"
echo -e "${YELLOW}You can now start the application, and it will automatically start the bridge.${NC}"
echo -e "${YELLOW}Or you can manually start the bridge with: cd python-bridge && python3 indeed_bridge.py${NC}"

exit 0 