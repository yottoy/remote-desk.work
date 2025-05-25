#!/bin/bash

# Kill any existing bridge processes
pkill -f "python jobspy_bridge.py" || true

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "../.venv" ]; then
    source "../.venv/bin/activate"
else
    echo "Virtual environment not found. Creating one..."
    python3 -m venv ../.venv
    source "../.venv/bin/activate"
    
    # Install required packages
    pip install fastapi uvicorn jobspy pandas python-dotenv tls-client requests
fi

# Verify Python is available
if ! command -v python &> /dev/null; then
    echo "Python not found. Please install Python 3.11 or later."
    exit 1
fi

# Start the bridge
echo "Starting JobSpy Bridge..."
python jobspy_bridge.py &

# Store the PID
echo $! > bridge.pid

echo "Bridge started with PID $(cat bridge.pid)"
