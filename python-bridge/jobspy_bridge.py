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
from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv
from jobspy import scrape_jobs, Site
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

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
HOST = os.getenv("JOBSPY_BRIDGE_HOST", "127.0.0.1")
PORT = int(os.getenv("JOBSPY_BRIDGE_PORT", "8000"))
MAX_RETRY_ATTEMPTS = int(os.getenv("MAX_RETRY_ATTEMPTS", "3"))
RETRY_DELAY = float(os.getenv("RETRY_DELAY", "5"))
MIN_REQUEST_INTERVAL = float(os.getenv("MIN_REQUEST_INTERVAL", "2.0"))
USE_RANDOM_USER_AGENTS = os.getenv("USE_RANDOM_USER_AGENTS", "false").lower() == "true"

# Force IPv4
if ":" in HOST:
    logger.warning(f"IPv6 address detected: {HOST}. Forcing IPv4 only.")
    HOST = "127.0.0.1"

# Configure socket to use IPv4 only
socket.setdefaulttimeout(30)  # 30 second timeout
original_getaddrinfo = socket.getaddrinfo

def getaddrinfo_ipv4_only(*args, **kwargs):
    """Force IPv4 only for all socket connections"""
    family = kwargs.get('family', socket.AF_UNSPEC)
    if family == socket.AF_UNSPEC:
        kwargs['family'] = socket.AF_INET  # Force IPv4
    return original_getaddrinfo(*args, **kwargs)

# Override the getaddrinfo function
socket.getaddrinfo = getaddrinfo_ipv4_only

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
app = FastAPI(title="JobSpy Bridge API", version="1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    # Check system information
    import platform
    import sys
    
    system_info = {
        "status": "ok",
        "api_version": "1.0",
        "python_version": sys.version,
        "platform": platform.platform(),
        "host": HOST,
        "port": PORT,
        "socket_family": "IPv4 only",
        "timestamp": datetime.now().isoformat()
    }
    
    # Test socket binding
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.bind((HOST, 0))  # Bind to an available port
        system_info["socket_test"] = "passed"
        s.close()
    except Exception as e:
        system_info["socket_test"] = f"failed: {str(e)}"
    
    return system_info

@app.get("/supported-sites")
async def supported_sites():
    return {"supported_sites": [s.name.lower() for s in Site]}

def get_random_user_agent():
    """Get a random user agent for requests"""
    return random.choice(USER_AGENTS) if USE_RANDOM_USER_AGENTS else None

def apply_rate_limiting(site_name: str):
    """Apply rate limiting for specific sites with more randomization"""
    now = time.time()
    if site_name in last_request_time:
        elapsed = now - last_request_time[site_name]
        # Add more randomness to bypass rate limiting detection
        min_delay = MIN_REQUEST_INTERVAL + random.uniform(1.0, 8.0)  # Higher random component
        if elapsed < min_delay:
            # Longer sleep with much more variation
            sleep_time = min_delay - elapsed + random.uniform(1.5, 10.0)
            logger.info(f"Rate limiting for {site_name}, sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
    
    # Add additional random delay before updating the timestamp
    # This helps avoid patterns in request timing
    time.sleep(random.uniform(0.2, 2.0))
    
    # Update the last request time
    last_request_time[site_name] = time.time()

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
            
            # Filter out jobs with excluded keywords
            if exclude_keywords and not jobs_df.empty:
                original_count = len(jobs_df)
                
                # Create a filter based on excluded keywords in title and description
                def contains_excluded_keyword(row):
                    title = str(row.get('title', '')).lower()
                    description = str(row.get('description', '')).lower()
                    
                    for keyword in exclude_keywords:
                        if keyword.lower() in title or keyword.lower() in description:
                            return True
                    return False
                
                # Apply the filter
                jobs_df = jobs_df[~jobs_df.apply(contains_excluded_keyword, axis=1)]
                
                filtered_count = original_count - len(jobs_df)
                if filtered_count > 0:
                    logger.info(f"Filtered out {filtered_count} jobs containing excluded keywords")
            
            return jobs_df
            
        except Exception as e:
            attempt += 1
            last_error = e
            logger.warning(f"Error on attempt {attempt}/{MAX_RETRY_ATTEMPTS} for {site_name.name} - {search_term}: {str(e)}")
            
            if attempt < MAX_RETRY_ATTEMPTS:
                # Exponential backoff with jitter
                sleep_time = RETRY_DELAY * (2 ** (attempt - 1)) + random.uniform(0, 1)
                logger.info(f"Retrying in {sleep_time:.2f} seconds...")
                time.sleep(sleep_time)
    
    # If we get here, all attempts failed
    logger.error(f"All {MAX_RETRY_ATTEMPTS} attempts failed for {site_name.name} - {search_term}")
    if last_error:
        logger.error(f"Last error: {last_error}")
    
    # Return empty DataFrame instead of raising exception
    return pd.DataFrame()

@app.post("/scrape-jobs", response_model=JobResponse)
async def scrape_all_jobs(request: JobRequest, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Scraping jobs from {request.site_names} with search terms: {request.search_terms}")
        
        # Convert site names to Site enums
        sites = []
        for site_name in request.site_names:
            site_upper = site_name.upper()
            try:
                sites.append(Site[site_upper])
            except KeyError:
                logger.warning(f"Unknown site name: {site_name}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Unknown site name: {site_name}. Supported sites are: {[s.name.lower() for s in Site]}"
                )
        
        all_jobs = []
        start_time = datetime.now()
        
        # Log exclusion keywords if present
        if request.exclude_keywords:
            logger.info(f"Will exclude jobs containing keywords: {request.exclude_keywords}")
        
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
                    
                    if not jobs_df.empty:
                        logger.info(f"Found {len(jobs_df)} jobs for search term: {search_term} from {site.name}")
                        
                        # Convert DataFrame to records
                        term_jobs = jobs_df.to_dict(orient="records")
                        
                        # Add search query and site to each job
                        for job in term_jobs:
                            job["search_query"] = search_term
                            job["site_source"] = site.name.lower()
                            
                            # Convert all date fields to ISO format strings
                            for field in job.keys():
                                if isinstance(job[field], pd.Timestamp):
                                    job[field] = job[field].isoformat()
                                elif field.lower().endswith('date') and job[field] is not None:
                                    if isinstance(job[field], (datetime, pd.Timestamp)):
                                        job[field] = job[field].isoformat()
                        
                        all_jobs.extend(term_jobs)
                    else:
                        logger.warning(f"No jobs found for search term: {search_term} from {site.name}")
                
                except Exception as e:
                    logger.error(f"Error scraping term '{search_term}' from {site.name}: {str(e)}")
                    # Continue with next site/term instead of failing completely
        
        # Process the final results
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Create metadata
        metadata = {
            "search_terms": request.search_terms,
            "sites": request.site_names,
            "location": request.location,
            "duration_seconds": duration,
            "timestamp": datetime.now().isoformat(),
            "source": "jobspy",
            "jobs_per_term": {term: len([j for j in all_jobs if j.get("search_query") == term]) for term in request.search_terms},
            "jobs_per_site": {site: len([j for j in all_jobs if j.get("site_source") == site.lower()]) for site in request.site_names}
        }
        
        logger.info(f"Scraping complete. Found {len(all_jobs)} total jobs.")
        
        return {
            "jobs": all_jobs,
            "count": len(all_jobs),
            "metadata": metadata
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions directly
        raise
    except Exception as e:
        logger.exception(f"Error during job scraping: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during job scraping: {str(e)}"
        )

# Maintain backward compatibility with the old indeed-only endpoint
@app.post("/scrape-indeed", response_model=JobResponse)
async def scrape_indeed(request: JobRequest, background_tasks: BackgroundTasks):
    request.site_names = ["indeed"]
    return await scrape_all_jobs(request, background_tasks)

# Run the API server if executed directly
if __name__ == "__main__":
    logger.info(f"Starting JobSpy bridge on http://{HOST}:{PORT} (IPv4 only)")
    try:
        # Get socket info for localhost to verify it's resolving to IPv4
        try:
            addr_info = socket.getaddrinfo("localhost", PORT, socket.AF_INET, socket.SOCK_STREAM)
            logger.info(f"localhost resolves to: {addr_info[0][4][0]}")
        except Exception as e:
            logger.warning(f"Could not resolve localhost: {e}")
        
        try:
            addr_info = socket.getaddrinfo("127.0.0.1", PORT, socket.AF_INET, socket.SOCK_STREAM)
            logger.info(f"127.0.0.1 resolves to: {addr_info[0][4][0]}")
        except Exception as e:
            logger.warning(f"Could not resolve 127.0.0.1: {e}")
            
        # Create server with IPv4 binding
        import socket
        config = uvicorn.Config(app="jobspy_bridge:app", host=HOST, port=PORT, log_level="info")
        server = uvicorn.Server(config)
        server.run()
    except Exception as e:
        logger.error(f"Failed to start JobSpy bridge: {str(e)}")
        # Try alternative approaches if the server won't start
        try:
            logger.info("Trying alternative server configuration...")
            uvicorn.run(app, host=HOST, port=PORT, log_level="info")
        except Exception as e2:
            logger.error(f"Alternative server configuration also failed: {str(e2)}")
            logger.error("Unable to start the JobSpy bridge server.") 