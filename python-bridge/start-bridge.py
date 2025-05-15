#!/usr/bin/env python3
import os
import sys
import subprocess
import time
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("bridge-starter")

def main():
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
        python_executable = venv_path / "bin" / "python3"
    else:
        # Fallback to system Python
        python_executable = "python3"
    
    logger.info(f"Starting JobSpy bridge using Python: {python_executable}")
    logger.info(f"Bridge script: {bridge_script}")
    
    # Start the bridge
    try:
        # Install required dependencies if missing
        try:
            packages_check = subprocess.run(
                [str(python_executable), "-m", "pip", "list"], 
                capture_output=True, 
                text=True
            )
            packages_output = packages_check.stdout
            
            required_packages = ['pandas', 'uvicorn', 'fastapi', 'jobspy']
            missing_packages = []
            
            for pkg in required_packages:
                if pkg not in packages_output:
                    missing_packages.append(pkg)
            
            if missing_packages:
                logger.info(f"Installing missing dependencies: {', '.join(missing_packages)}")
                subprocess.run(
                    [str(python_executable), "-m", "pip", "install"] + missing_packages,
                    check=True
                )
        except Exception as e:
            logger.error(f"Error checking dependencies: {e}")
        
        # Run the bridge directly without going through uvicorn command-line interface
        cmd = [
            str(python_executable), 
            "-c", 
            f"""
import sys
sys.path.insert(0, '{project_root}')
import uvicorn
from jobspy_bridge import app

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)
"""
        ]
        
        logger.info(f"Running command: {' '.join(cmd)}")
        
        # Start the bridge as a subprocess
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a bit to see if it starts successfully
        time.sleep(2)
        
        # Check if process is still running
        if process.poll() is None:
            logger.info(f"Bridge started successfully with PID {process.pid}")
            return 0
        else:
            # Process exited immediately, check output
            stdout, stderr = process.communicate()
            logger.error(f"Bridge failed to start. Exit code: {process.returncode}")
            logger.error(f"STDOUT: {stdout}")
            logger.error(f"STDERR: {stderr}")
            return 1
            
    except Exception as e:
        logger.error(f"Error starting bridge: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 