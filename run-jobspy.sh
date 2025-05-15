#!/bin/bash

# JobSpy Runner Script
# Used to start/stop the bridge and run scraper tasks

# Configuration
BRIDGE_HOST="127.0.0.1"
BRIDGE_PORT=8000
BRIDGE_TIMEOUT=60
BRIDGE_LOG="jobspy_bridge.log"
BRIDGE_PID_FILE="bridge_pid.txt"
RESULTS_DIR="../results"

# Create directories if they don't exist
mkdir -p ../logs
mkdir -p logs
mkdir -p $RESULTS_DIR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check if the bridge is running
check_bridge() {
  # Check if PID file exists
  if [ -f "$BRIDGE_PID_FILE" ]; then
    PID=$(cat $BRIDGE_PID_FILE)
    if ps -p $PID > /dev/null; then
      echo -e "${GREEN}Bridge is running with PID $PID${NC}"
      return 0
    else
      echo -e "${YELLOW}Bridge PID file exists but process is not running${NC}"
      rm -f $BRIDGE_PID_FILE
    fi
  fi
  
  # Try to connect to the bridge
  if curl -s "http://$BRIDGE_HOST:$BRIDGE_PORT/health" > /dev/null; then
    echo -e "${GREEN}Bridge is running at http://$BRIDGE_HOST:$BRIDGE_PORT${NC}"
    return 0
  else
    echo -e "${RED}Bridge is not running${NC}"
    return 1
  fi
}

# Function to start the bridge
start_bridge() {
  echo "Starting JobSpy bridge..."
  
  # Check if it's already running
  if check_bridge > /dev/null; then
    echo -e "${YELLOW}Bridge is already running${NC}"
    return 0
  fi
  
  # Start the bridge in the background
  python3 jobspy_bridge.py > $BRIDGE_LOG 2>&1 &
  PID=$!
  echo $PID > $BRIDGE_PID_FILE
  
  # Wait for bridge to start
  echo "Waiting for bridge to start..."
  for i in $(seq 1 $BRIDGE_TIMEOUT); do
    if curl -s "http://$BRIDGE_HOST:$BRIDGE_PORT/health" > /dev/null; then
      echo -e "${GREEN}Bridge started successfully at http://$BRIDGE_HOST:$BRIDGE_PORT${NC}"
      return 0
    fi
    sleep 1
    echo -n "."
  done
  
  # If we get here, bridge failed to start
  echo -e "${RED}Bridge failed to start within timeout period${NC}"
  echo "Check logs at $BRIDGE_LOG for details"
  kill $PID 2>/dev/null
  return 1
}

# Function to stop the bridge
stop_bridge() {
  echo "Stopping JobSpy bridge..."
  
  # Check if PID file exists
  if [ -f "$BRIDGE_PID_FILE" ]; then
    PID=$(cat $BRIDGE_PID_FILE)
    if ps -p $PID > /dev/null; then
      echo "Killing process $PID"
      kill $PID
      sleep 2
      if ps -p $PID > /dev/null; then
        echo "Process didn't terminate, using SIGKILL"
        kill -9 $PID 2>/dev/null
      fi
      rm -f $BRIDGE_PID_FILE
      echo -e "${GREEN}Bridge stopped${NC}"
    else
      echo -e "${YELLOW}Bridge PID file exists but process is not running${NC}"
      rm -f $BRIDGE_PID_FILE
    fi
  else
    echo "No PID file found, attempting to find by process name"
    PID=$(ps aux | grep "python3 jobspy_bridge.py" | grep -v grep | awk '{print $2}')
    if [ -n "$PID" ]; then
      echo "Found process $PID, killing it"
      kill $PID 2>/dev/null
      echo -e "${GREEN}Bridge stopped${NC}"
    else
      echo -e "${YELLOW}No running bridge found${NC}"
    fi
  fi
}

# Function to run scraper
run_scraper() {
  echo "Running job scraper..."
  
  # Check if bridge is running
  if ! check_bridge > /dev/null; then
    echo -e "${YELLOW}Bridge is not running, starting it...${NC}"
    if ! start_bridge; then
      echo -e "${RED}Failed to start bridge, aborting scraper${NC}"
      return 1
    fi
    echo "Bridge started successfully"
  fi
  
  # Set environment variables to force IPv4
  export JOBSPY_BRIDGE_URL="http://127.0.0.1:8000"
  
  # Run the scraper
  timestamp=$(date +"%Y%m%d_%H%M%S")
  echo "Starting scraper with command: node scrape-all-jobs.js"
  node scrape-all-jobs.js 2>&1 | tee "logs/scraper_$timestamp.log"
  
  # Check if results were generated
  if [ -f "scrape-results.json" ]; then
    echo -e "${GREEN}Scraper completed successfully${NC}"
    # Copy results to results directory
    cp "scrape-results.json" "$RESULTS_DIR/scrape-results_$timestamp.json"
    echo -e "${GREEN}Results saved to $RESULTS_DIR/scrape-results_$timestamp.json${NC}"
    return 0
  else
    echo -e "${RED}Scraper failed or did not produce results${NC}"
    return 1
  fi
}

# Function to display status
status() {
  echo "JobSpy System Status:"
  echo "--------------------"
  
  # Check bridge status
  check_bridge
  
  # Check for recent results
  echo "Recent results:"
  ls -lt $RESULTS_DIR 2>/dev/null | head -n 5 | awk '{print "  " $6 " " $7 " " $8 " " $9}'
  
  # Check for required dependencies
  echo "System info:"
  echo -n "  Python version: "
  python3 --version 2>&1 || echo "Not installed"
  echo -n "  Node version: "
  node --version 2>&1 || echo "Not installed"
  echo -n "  JobSpy package: "
  pip3 list | grep jobspy || echo "Not installed"
  echo "  Host: $(hostname)"
  echo "  IPv4 resolution: $(python3 -c "import socket; print(socket.gethostbyname('localhost'))" 2>/dev/null || echo "Failed")"
}

# Function to check for required dependencies
check_deps() {
  echo "Checking dependencies..."
  
  # Check Python
  if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed or not in PATH${NC}"
    return 1
  fi
  
  # Check Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed or not in PATH${NC}"
    return 1
  fi
  
  # Check curl
  if ! command -v curl &> /dev/null; then
    echo -e "${RED}curl is not installed or not in PATH${NC}"
    return 1
  fi
  
  # Check for JobSpy package
  if ! pip3 list | grep -q jobspy; then
    echo -e "${YELLOW}JobSpy package not found. Installing...${NC}"
    pip3 install jobspy
  fi
  
  echo -e "${GREEN}All dependencies are installed${NC}"
  return 0
}

# Main command handler
case "$1" in
  start)
    check_deps && start_bridge
    ;;
  stop)
    stop_bridge
    ;;
  restart)
    stop_bridge
    sleep 2
    check_deps && start_bridge
    ;;
  status)
    status
    ;;
  scrape)
    check_deps && run_scraper
    ;;
  *)
    echo "JobSpy Runner Script"
    echo "Usage: $0 {start|stop|restart|status|scrape}"
    echo "  start   - Start JobSpy bridge"
    echo "  stop    - Stop JobSpy bridge"
    echo "  restart - Restart JobSpy bridge"
    echo "  status  - Check JobSpy system status"
    echo "  scrape  - Run job scraper"
    exit 1
    ;;
esac

exit 0 