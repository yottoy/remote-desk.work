#!/bin/bash

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Check if PID file exists
if [ -f "bridge.pid" ]; then
    PID=$(cat bridge.pid)
    if ps -p $PID > /dev/null; then
        echo "Stopping JobSpy Bridge (PID: $PID)..."
        kill $PID
        rm bridge.pid
        echo "Bridge stopped."
    else
        echo "Bridge process not running."
        rm bridge.pid
    fi
else
    echo "No PID file found. Attempting to kill any running bridge processes..."
    pkill -f "python jobspy_bridge.py" || true
fi 