#!/usr/bin/env python3
import os
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any, Union

import pandas as pd
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field, validator
from dotenv import load_dotenv
from jobspy import scrape_jobs, Site

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

app = FastAPI(title="JobSpy Bridge API", description="Bridge API for JobSpy job scrapers")

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
    return {"message": "JobSpy Bridge API is running", "status": "ok", "version": "1.0.0"}

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

@app.post("/scrape-jobs", response_model=JobResponse)
async def scrape_all_jobs(request: JobRequest):
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
            try:
                # Run JobSpy scraper for specified sites
                jobs_df = scrape_jobs(
                    site_name=sites,
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
                    verbose=2  # Full logging
                )
                
                if not jobs_df.empty:
                    logger.info(f"Found {len(jobs_df)} jobs for search term: {search_term}")
                    
                    # Convert DataFrame to records
                    term_jobs = jobs_df.to_dict(orient="records")
                    
                    # Add search query to each job
                    for job in term_jobs:
                        job["search_query"] = search_term
                        
                        # Convert all date fields to ISO format strings
                        for field in job.keys():
                            if isinstance(job[field], pd.Timestamp):
                                job[field] = job[field].isoformat()
                            elif field.lower().endswith('date') and job[field] is not None:
                                if isinstance(job[field], (datetime, pd.Timestamp)):
                                    job[field] = job[field].isoformat()
                    
                    all_jobs.extend(term_jobs)
                else:
                    logger.warning(f"No jobs found for search term: {search_term}")
            
            except Exception as e:
                logger.error(f"Error scraping term '{search_term}': {str(e)}")
                # Continue with next search term instead of failing completely
        
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
            "jobs_per_term": {term: len([j for j in all_jobs if j.get("search_query") == term]) for term in request.search_terms}
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
async def scrape_indeed(request: JobRequest):
    request.site_names = ["indeed"]
    return await scrape_all_jobs(request)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("JOBSPY_BRIDGE_PORT", 8000))
    host = os.environ.get("JOBSPY_BRIDGE_HOST", "127.0.0.1")
    
    logger.info(f"Starting JobSpy bridge on http://{host}:{port}")
    try:
        uvicorn.run("jobspy_bridge:app", host=host, port=port, reload=True)
    except Exception as e:
        logger.error(f"Failed to start JobSpy bridge: {str(e)}") 