#!/usr/bin/env python3
import os
import json
import logging
import random
import time
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
GITHUB_ACTIONS = os.environ.get('GITHUB_ACTIONS') == 'true'
HOST = os.environ.get('JOBSPY_BRIDGE_HOST', '0.0.0.0' if GITHUB_ACTIONS else '127.0.0.1')
PORT = int(os.environ.get('JOBSPY_BRIDGE_PORT', '8000'))
MAX_RETRY_ATTEMPTS = int(os.environ.get('MAX_RETRY_ATTEMPTS', '3'))
RETRY_DELAY = int(os.environ.get('RETRY_DELAY', '5'))
MIN_REQUEST_INTERVAL = float(os.environ.get('MIN_REQUEST_INTERVAL', '2.0'))  # Minimum seconds between requests
USE_RANDOM_USER_AGENTS = os.environ.get('USE_RANDOM_USER_AGENTS', 'true').lower() in ('true', '1', 'yes')

# Track last request time per site to implement rate limiting
last_request_time = {}

# Random User-Agent list for rotation
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Safari/537.36 Edg/91.0.864.71'
]

# Disable pydantic validation warnings if requested
if os.environ.get('DISABLE_PYDANTIC_VALIDATION_WARNINGS', 'false').lower() in ('true', '1', 'yes'):
    import warnings
    from pydantic import PydanticDeprecatedSince20
    warnings.filterwarnings("ignore", category=PydanticDeprecatedSince20)

app = FastAPI(title="JobSpy Bridge API", description="Bridge API for JobSpy job scrapers")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    
    @validator('search_terms')
    def validate_search_terms(cls, v):
        if not v or len(v) == 0:
            raise ValueError("At least one search term is required")
        return v
    
    @validator('results_wanted')
    def validate_results_wanted(cls, v):
        if v <= 0:
            raise ValueError("results_wanted must be a positive integer")
        return min(v, 100)  # Cap at 100 to avoid excessive requests

class JobResponse(BaseModel):
    jobs: List[Dict[str, Any]]
    count: int
    metadata: Dict[str, Any]

@app.get("/")
async def root():
    return {"message": "JobSpy Bridge API is running", "status": "ok", "version": "1.1.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/supported-sites")
async def supported_sites():
    try:
        sites = [site.name.lower() for site in Site]
        return {"supported_sites": sites}
    except Exception as e:
        logger.exception(f"Error getting supported sites: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting supported sites: {str(e)}"
        )

def get_random_user_agent():
    """Get a random user agent for requests"""
    return random.choice(USER_AGENTS) if USE_RANDOM_USER_AGENTS else None

def apply_rate_limiting(site_name: str):
    """Apply rate limiting for specific sites"""
    now = time.time()
    if site_name in last_request_time:
        elapsed = now - last_request_time[site_name]
        if elapsed < MIN_REQUEST_INTERVAL:
            sleep_time = MIN_REQUEST_INTERVAL - elapsed + random.uniform(0.5, 2.0)  # Add randomness
            logger.info(f"Rate limiting for {site_name}, sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
    
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
    description_format: str
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
                        description_format=request.description_format
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
    logger.info(f"Starting JobSpy bridge on http://{HOST}:{PORT}")
    try:
        uvicorn.run("jobspy_bridge:app", host=HOST, port=PORT, reload=True)
    except Exception as e:
        logger.error(f"Failed to start JobSpy bridge: {str(e)}") 