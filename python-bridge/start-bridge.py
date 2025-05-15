#!/usr/bin/env python3
import os
import sys
import subprocess
import time
import logging
import signal
import socket
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("start-bridge.log")
    ]
)
logger = logging.getLogger("bridge-starter")

# Ensure the bridge process can be killed properly
bridge_process = None

def signal_handler(sig, frame):
    logger.info(f"Received signal {sig}, shutting down bridge...")
    if bridge_process:
        try:
            bridge_process.terminate()
            logger.info("Bridge process terminated")
        except Exception as e:
            logger.error(f"Error terminating bridge process: {e}")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def wait_for_port(host, port, timeout=30):
    """Wait for a port to be available on a host."""
    start_time = time.time()
    while True:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(1)
                result = sock.connect_ex((host, port))
                if result == 0:
                    logger.info(f"Port {port} is open on {host}")
                    return True
        except Exception as e:
            logger.debug(f"Error checking port: {e}")
        
        if time.time() - start_time > timeout:
            logger.error(f"Timeout waiting for port {port} on {host}")
            return False
        
        logger.info(f"Waiting for port {port} to be available (elapsed: {int(time.time() - start_time)}s)...")
        time.sleep(2)

def main():
    global bridge_process
    
    # Get the directory of this script
    script_dir = Path(__file__).parent.absolute()
    project_root = script_dir.parent
    
    # Path to the bridge script
    bridge_script = project_root / "jobspy_bridge.py"
    
    if not bridge_script.exists():
        logger.error(f"Bridge script not found at {bridge_script}")
        sys.exit(1)
    
    # Virtual environment path
    venv_path = project_root / ".venv"
    if venv_path.exists():
        # Use Python from virtual environment
        python_executable = venv_path / "bin" / "python"
        # Check if the path exists before using it
        if not python_executable.exists():
            # Try Windows path
            python_executable = venv_path / "Scripts" / "python.exe"
            if not python_executable.exists():
                logger.warning(f"Python executable not found in venv, falling back to system Python")
                python_executable = "python"
    else:
        # Use system Python
        python_executable = "python"
    
    # Ensure network settings are configured for IPv4
    logger.info("Setting up IPv4 network configuration...")
    try:
        ipv4_addr = socket.gethostbyname("localhost")
        logger.info(f"IPv4 address for localhost: {ipv4_addr}")
    except Exception as e:
        logger.warning(f"Could not resolve localhost: {e}")
    
    # Create a logs directory if it doesn't exist
    logs_dir = project_root / "logs"
    logs_dir.mkdir(exist_ok=True)
    
    # Path for bridge output log
    bridge_log = logs_dir / "jobspy_bridge.log"
    
    logger.info(f"Starting bridge from {bridge_script} with Python: {python_executable}")
    
    try:
        # Start the bridge process
        bridge_output = open(bridge_log, "w")
        bridge_process = subprocess.Popen(
            [python_executable, str(bridge_script)],
            stdout=bridge_output,
            stderr=subprocess.STDOUT,
            cwd=str(project_root)
        )
        
        logger.info(f"Started bridge process with PID: {bridge_process.pid}")
        
        # Wait for the bridge to start
        bridge_host = os.environ.get("JOBSPY_BRIDGE_HOST", "127.0.0.1")
        bridge_port = int(os.environ.get("JOBSPY_BRIDGE_PORT", "8000"))
        
        logger.info(f"Waiting for bridge to be available on {bridge_host}:{bridge_port}...")
        if wait_for_port(bridge_host, bridge_port):
            logger.info("Bridge is now available")
            
            # Keep the process running
            logger.info("Bridge is running. Press Ctrl+C to stop.")
            bridge_process.wait()
        else:
            logger.error("Bridge failed to start")
            if bridge_process.poll() is not None:
                logger.error(f"Bridge process exited with code: {bridge_process.returncode}")
            
            # Output the bridge log for debugging
            logger.error("Bridge log output:")
            with open(bridge_log, "r") as log_file:
                logger.error(log_file.read())
            
            sys.exit(1)
    except Exception as e:
        logger.error(f"Error starting bridge: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 