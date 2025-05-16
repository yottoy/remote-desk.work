#!/usr/bin/env python3
import os
import sys
import socket
import logging
import random
import time
from typing import Optional, List
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/jobspy_bridge.log")
    ]
)
logger = logging.getLogger("jobspy_bridge")

# Try to load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    logger.warning("python-dotenv not installed, skipping .env loading")

# Create a directory for logs if it doesn't exist
os.makedirs("logs", exist_ok=True)

# Create a safe startup wrapper for the bridge
def start_bridge():
    logger.info("Starting JobSpy bridge...")
    
    # Try to import the necessary libraries
    try:
        try:
            import pandas as pd
            logger.info("Pandas imported successfully")
        except ImportError:
            logger.error("Failed to import pandas. Installing...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pandas"])
            import pandas as pd
            logger.info("Pandas installed and imported")
            
        try:
            from fastapi import FastAPI, HTTPException
            logger.info("FastAPI imported successfully")
        except ImportError:
            logger.error("Failed to import FastAPI. Installing...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "fastapi"])
            from fastapi import FastAPI, HTTPException
            logger.info("FastAPI installed and imported")
            
        try:
            from pydantic import BaseModel
            logger.info("Pydantic imported successfully")
        except ImportError:
            logger.error("Failed to import Pydantic. Installing...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pydantic"])
            from pydantic import BaseModel
            logger.info("Pydantic installed and imported")
            
        try:
            import uvicorn
            logger.info("Uvicorn imported successfully")
        except ImportError:
            logger.error("Failed to import Uvicorn. Installing...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "uvicorn"])
            import uvicorn
            logger.info("Uvicorn installed and imported")
            
        try:
            from enum import Enum
            from jobspy import scrape_jobs
            logger.info("JobSpy imported successfully")
        except ImportError:
            logger.error("Failed to import JobSpy. Installing...")
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "jobspy"])
            from enum import Enum
            from jobspy import scrape_jobs
            logger.info("JobSpy installed and imported")
        
        # Create FastAPI app
        app = FastAPI(
            title="JobSpy Bridge API",
            description="Simple API bridge for the JobSpy library",
            version="1.0.0"
        )

        # Define site enum
        class Site(str, Enum):
            INDEED = "indeed"
            LINKEDIN = "linkedin"
            GLASSDOOR = "glassdoor"
            ZIPRECRUITER = "ziprecruiter"
            DICE = "dice"
            SIMPLYHIRED = "simplyhired"
            REMOTECO = "remoteco"
            WEWORKREMOTELY = "weworkremotely"

        # Request models
        class ScrapeRequest(BaseModel):
            site_name: str
            search_term: str
            location: str = "Remote"
            results_wanted: int = 10
            hours_old: Optional[int] = None
            job_type: Optional[str] = None
            easy_apply: Optional[bool] = None
            is_remote: Optional[bool] = None
            country_indeed: Optional[str] = None
            proxies: Optional[List[str]] = None

        # Health check endpoint
        @app.get("/health")
        def health_check():
            return {"status": "healthy", "timestamp": time.time()}

        # Scrape jobs endpoint
        @app.post("/scrape-jobs")
        def scrape_jobs_api(req: ScrapeRequest):
            try:
                logger.info(f"Request to scrape {req.site_name} for '{req.search_term}' in {req.location}")
                
                # Convert site name string to Site enum
                site = None
                try:
                    site = Site(req.site_name.lower())
                except ValueError:
                    sites = [site.value for site in Site]
                    raise HTTPException(status_code=400, detail=f"Invalid site name. Valid options: {sites}")
                
                # Check required parameters
                if not req.search_term:
                    raise HTTPException(status_code=400, detail="search_term is required")
                
                # Build kwargs dict for scrape_jobs
                kwargs = {
                    "site_name": site.value,
                    "search_term": req.search_term,
                    "location": req.location,
                    "results_wanted": req.results_wanted
                }
                
                # Add optional parameters 
                # Note: Indeed has restrictions on parameter combinations - see JobSpy docs
                if req.hours_old is not None:
                    kwargs["hours_old"] = req.hours_old
                    
                if req.job_type is not None:
                    kwargs["job_type"] = req.job_type
                    
                if req.easy_apply is not None:
                    kwargs["easy_apply"] = req.easy_apply
                    
                if req.is_remote is not None:
                    kwargs["remote"] = req.is_remote
                    
                if req.country_indeed is not None and site == Site.INDEED:
                    kwargs["country"] = req.country_indeed
                    
                if req.proxies:
                    kwargs["proxies"] = req.proxies
                
                # Log what we're about to do
                logger.info(f"Calling JobSpy scrape_jobs with parameters: {kwargs}")
                
                # Attempt to scrape jobs
                try:
                    # Call the JobSpy library
                    logger.info("Starting JobSpy scrape")
                    df = scrape_jobs(**kwargs)
                    
                    # Process the results
                    if df is None or len(df) == 0:
                        logger.warning("No jobs found in the search results")
                        return []
                    
                    logger.info(f"Found {len(df)} jobs")
                    
                    # Convert DataFrame to list of dictionaries
                    try:
                        # First convert to JSON and then parse back to ensure proper serialization
                        jobs_json = df.to_json(orient="records", date_format="iso")
                        jobs_list = json.loads(jobs_json)
                        return jobs_list
                    except Exception as e:
                        logger.error(f"Error converting results to JSON: {str(e)}")
                        # Fallback method if to_json fails
                        jobs_list = df.to_dict(orient="records")
                        return jobs_list
                        
                except Exception as e:
                    logger.error(f"Error during JobSpy scrape: {str(e)}")
                    raise HTTPException(status_code=500, detail=f"Error scraping jobs: {str(e)}")
                    
            except Exception as e:
                logger.error(f"Error processing request: {str(e)}")
                if isinstance(e, HTTPException):
                    raise e
                else:
                    raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

        # Determine host and port
        host = os.environ.get("JOBSPY_BRIDGE_HOST", "127.0.0.1")
        port = int(os.environ.get("JOBSPY_BRIDGE_PORT", 8000))
        
        # Print startup information
        logger.info(f"Starting server on {host}:{port}")
        logger.info(f"API docs available at http://{host}:{port}/docs")
        
        # Start the server
        if __name__ == "__main__":
            # Attempt to bind to the port first to verify it's available
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.bind((host, port))
                sock.close()
                logger.info(f"Port {port} is available")
            except Exception as e:
                logger.error(f"Port {port} is not available: {str(e)}")
                # Try a random port between 8001 and 9000
                port = random.randint(8001, 9000)
                logger.info(f"Using alternative port: {port}")
                # Update environment variable so clients know which port to use
                os.environ["JOBSPY_BRIDGE_PORT"] = str(port)
                # Write the new port to a file so scripts can pick it up
                with open("jobspy_bridge_port.txt", "w") as f:
                    f.write(str(port))
            
            # Start the server
            logger.info(f"Starting uvicorn server on {host}:{port}")
            uvicorn.run(app, host=host, port=port, log_level="info")
            
    except Exception as e:
        logger.critical(f"Failed to start JobSpy bridge: {str(e)}")
        # Create a minimal fallback server that just responds with error info
        create_fallback_server(str(e))
        return False
        
    return True

# Create a simple fallback HTTP server when main bridge fails
def create_fallback_server(error_message):
    try:
        logger.warning("Starting fallback server...")
        
        import http.server
        import socketserver
        
        # Define handler with error info
        class FallbackHandler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                # Serve health check and error info
                if self.path == "/health":
                    response = {
                        "status": "fallback",
                        "error": error_message,
                        "timestamp": time.time()
                    }
                else:
                    response = {
                        "error": "JobSpy bridge is running in fallback mode due to an error",
                        "details": error_message,
                        "path": self.path
                    }
                
                self.wfile.write(json.dumps(response).encode())
                
            def do_POST(self):
                # Return empty array for any POST request
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                if self.path == "/scrape-jobs":
                    response = []
                else:
                    response = {"error": "Unsupported endpoint in fallback mode"}
                
                self.wfile.write(json.dumps(response).encode())
                
            def log_message(self, format, *args):
                logger.info(f"Fallback server: {format % args}")
        
        # Get host and port
        host = os.environ.get("JOBSPY_BRIDGE_HOST", "127.0.0.1")
        port = int(os.environ.get("JOBSPY_BRIDGE_PORT", 8000))
        
        # Try to bind to the port
        try:
            httpd = socketserver.TCPServer((host, port), FallbackHandler)
        except:
            # If port is in use, try a random port
            port = random.randint(8001, 9000)
            httpd = socketserver.TCPServer((host, port), FallbackHandler)
            # Write the new port to a file so scripts can pick it up
            with open("jobspy_bridge_port.txt", "w") as f:
                f.write(str(port))
        
        logger.info(f"Fallback server running on http://{host}:{port}")
        
        # Run the server
        httpd.serve_forever()
    except Exception as e:
        logger.critical(f"Failed to start fallback server: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    # Start the bridge
    logger.info("JobSpy Bridge starting up...")
    start_bridge() 