#!/usr/bin/env python3
import os
import json
import logging
import random
import time
import socket
from datetime import datetime
from typing import List, Optional, Dict, Any, Union

import pandas as pd
from fastapi import FastAPI, HTTPException, status, BackgroundTasks, Depends, Request
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv
from jobspy import scrape_jobs, Site
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
from requests.packages.urllib3.util.connection import allowed_gai_family
import tls_client

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("jobspy_bridge.log")
    ]
)
logger = logging.getLogger("jobspy_bridge")

# Get environment variables
HOST = os.getenv("JOBSPY_BRIDGE_HOST", "0.0.0.0")  # Changed to 0.0.0.0 for Vercel
PORT = int(os.getenv("JOBSPY_BRIDGE_PORT", "3000"))  # Changed to 3000 for Vercel
MAX_RETRY_ATTEMPTS = int(os.getenv("MAX_RETRY_ATTEMPTS", "3"))
RETRY_DELAY = float(os.getenv("RETRY_DELAY", "5"))
MIN_REQUEST_INTERVAL = float(os.getenv("MIN_REQUEST_INTERVAL", "2.0"))
USE_RANDOM_USER_AGENTS = os.getenv("USE_RANDOM_USER_AGENTS", "false").lower() == "true"

# Configure socket to use IPv4 only
socket.setdefaulttimeout(30)  # 30 second timeout

# Force IPv4 only
if ":" in HOST:
    logger.warning(f"IPv6 address detected: {HOST}. Forcing IPv4 only.")
    HOST = "127.0.0.1"

# Configure requests to use IPv4
def _allowed_gai_family():
    return socket.AF_INET

socket._getaddrinfo = socket.getaddrinfo
socket._allowed_gai_family = _allowed_gai_family

# Configure tls_client to use IPv4
def create_ipv4_socket(*args, **kwargs):
    return socket.socket(family=socket.AF_INET)

tls_client.Session._create_socket = create_ipv4_socket

# Common user agents for rotating
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36 Edg/91.0.864.54',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
]

# Rate limiting state tracking
last_request_time = {}

# Create FastAPI app
app = FastAPI(title="JobSpy Bridge API")

# Update CORS settings to allow specific origins
origins = [
    "http://localhost:3000",
    "http://localhost:3002",
    "https://clickclickjob-*.vercel.app",
    "https://clickclickjob.vercel.app",
    "https://*.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request models
class JobRequest(BaseModel):
    site_names: List[str] = ["indeed"]
    search_terms: List[str]
    location: Optional[str] = ""
    results_wanted: int = 20
    hours_old: Optional[int] = 72
    country_indeed: str = "USA"
    job_type: Optional[str] = None
    is_remote: Optional[bool] = True
    distance: Optional[int] = 50
    proxies: Optional[List[str]] = None
    linkedin_fetch_description: Optional[bool] = False
    easy_apply: Optional[bool] = None
    description_format: str = "markdown"
    exclude_keywords: Optional[List[str]] = None

    @validator('search_terms')
    def validate_search_terms(cls, v):
        if not v or len(v) == 0:
            raise ValueError("At least one search term is required")
        return v
    
    @validator('results_wanted')
    def validate_results_wanted(cls, v):
        if v <= 0:
            raise ValueError("results_wanted must be greater than 0")
        return v

class JobResponse(BaseModel):
    jobs: List[Dict[str, Any]]
    count: int
    metadata: Dict[str, Any]

@app.get("/")
async def root():
    return {"message": "JobSpy Bridge API", "status": "running", "routes": ["/scrape-jobs", "/scrape-indeed", "/health", "/supported-sites"]}

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

@app.get("/supported-sites")
async def supported_sites():
    return {"supported_sites": [s.name.lower() for s in Site]}

def get_random_user_agent():
    """Get a random user agent for requests"""
    return random.choice(USER_AGENTS) if USE_RANDOM_USER_AGENTS else None

def apply_rate_limiting(site_name: str):
    """Apply rate limiting between requests"""
    current_time = time.time()
    if site_name in last_request_time:
        time_since_last = current_time - last_request_time[site_name]
        if time_since_last < MIN_REQUEST_INTERVAL:
            sleep_time = MIN_REQUEST_INTERVAL - time_since_last
            time.sleep(sleep_time)
    last_request_time[site_name] = current_time

async def scrape_with_retry(
    site_name: Site,
    search_term: str,
    location: str,
    results_wanted: int,
    hours_old: int,
    country_indeed: str,
    job_type: Optional[str],
    is_remote: bool,
    distance: int,
    proxies: Optional[List[str]],
    linkedin_fetch_description: bool,
    easy_apply: Optional[bool],
    description_format: str,
    exclude_keywords: Optional[List[str]] = None
) -> pd.DataFrame:
    """Scrape jobs with retry logic"""
    attempt = 0
    last_error = None
    
    while attempt < MAX_RETRY_ATTEMPTS:
        try:
            # Apply rate limiting
            apply_rate_limiting(site_name.name.lower())
            
            # Get a random user agent
            user_agent = get_random_user_agent()
            
            # Try to scrape
            jobs_df = scrape_jobs(
                site_name=[site_name],
                search_term=search_term,
                location=location,
                results_wanted=results_wanted,
                hours_old=hours_old,
                country_indeed=country_indeed,
                job_type=job_type,
                is_remote=is_remote,
                distance=distance,
                proxies=proxies,
                linkedin_fetch_description=linkedin_fetch_description,
                easy_apply=easy_apply,
                description_format=description_format,
                verbose=2,  # Full logging
                user_agent=user_agent
            )
            
            return jobs_df
            
        except Exception as e:
            last_error = e
            attempt += 1
            if attempt < MAX_RETRY_ATTEMPTS:
                wait_time = RETRY_DELAY * (2 ** (attempt - 1))  # Exponential backoff
                logger.warning(f"Attempt {attempt} failed for {site_name.name}: {str(e)}. Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                logger.error(f"All {MAX_RETRY_ATTEMPTS} attempts failed for {site_name.name}: {str(last_error)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to scrape {site_name.name} after {MAX_RETRY_ATTEMPTS} attempts: {str(last_error)}"
                )

@app.post("/scrape-jobs", response_model=JobResponse)
async def scrape_all_jobs(request: JobRequest, background_tasks: BackgroundTasks):
    try:
        # Convert site names to Site enums
        sites = []
        for site_name in request.site_names:
            try:
                site = Site[site_name.upper()]
                sites.append(site)
            except KeyError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported site: {site_name}"
                )
        
        if not sites:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid sites specified"
            )
        
        # Scrape each search term
        for search_term in request.search_terms:
            # Scrape each site
            for site in sites:
                try:
                    # Run JobSpy scraper for specified site with retries
                    jobs_df = await scrape_with_retry(
                        site_name=site,
                        search_term=search_term,
                        location=request.location,
                        results_wanted=request.results_wanted,
                        hours_old=request.hours_old,
                        country_indeed=request.country_indeed,
                        job_type=request.job_type,
                        is_remote=request.is_remote,
                        distance=request.distance,
                        proxies=request.proxies,
                        linkedin_fetch_description=request.linkedin_fetch_description,
                        easy_apply=request.easy_apply,
                        description_format=request.description_format,
                        exclude_keywords=request.exclude_keywords
                    )
                    
                    # Convert DataFrame to list of dicts
                    jobs = jobs_df.to_dict('records')
                    
                    # Return response
                    return JobResponse(
                        jobs=jobs,
                        count=len(jobs),
                        metadata={
                            "site": site.name.lower(),
                            "search_term": search_term,
                            "location": request.location,
                            "timestamp": datetime.now().isoformat()
                        }
                    )
                    
                except Exception as e:
                    logger.error(f"Error scraping {site.name}: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Error scraping {site.name}: {str(e)}"
                    )
                    
    except Exception as e:
        logger.error(f"Error in scrape_all_jobs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Run the API server if executed directly
if __name__ == "__main__":
    logger.info(f"Starting JobSpy bridge on http://{HOST}:{PORT}")
    try:
        # Create server with Vercel-compatible configuration
        config = uvicorn.Config(app="jobspy_bridge:app", host=HOST, port=PORT, log_level="info")
        server = uvicorn.Server(config)
        server.run()
    except Exception as e:
        logger.error(f"Failed to start JobSpy bridge: {str(e)}")
        raise 