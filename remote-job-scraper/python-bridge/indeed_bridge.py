#!/usr/bin/env python3
import os
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from jobspy import scrape_jobs

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("python-bridge/jobspy_bridge.log")
    ]
)
logger = logging.getLogger("indeed_bridge")

app = FastAPI(title="JobSpy Bridge API", description="Bridge API for JobSpy Indeed scraper")

class JobRequest(BaseModel):
    search_terms: List[str]
    location: str
    results_wanted: int = 20
    hours_old: Optional[int] = 72
    country_indeed: str = "USA"
    job_type: Optional[str] = None
    is_remote: Optional[bool] = True
    distance: Optional[int] = 50
    proxies: Optional[List[str]] = None

class JobResponse(BaseModel):
    jobs: List[Dict[str, Any]]
    count: int
    metadata: Dict[str, Any]

@app.get("/")
async def root():
    return {"message": "JobSpy Indeed Bridge API is running"}

@app.post("/scrape-indeed", response_model=JobResponse)
async def scrape_indeed(request: JobRequest):
    try:
        logger.info(f"Scraping Indeed with search terms: {request.search_terms}")
        
        all_jobs = []
        start_time = datetime.now()
        
        # Scrape each search term
        for search_term in request.search_terms:
            try:
                # Run JobSpy scraper for Indeed only
                jobs_df = scrape_jobs(
                    site_name=["indeed"],
                    search_term=search_term,
                    location=request.location,
                    results_wanted=request.results_wanted,
                    hours_old=request.hours_old,
                    country_indeed=request.country_indeed,
                    job_type=request.job_type,
                    is_remote=request.is_remote,
                    distance=request.distance,
                    proxies=request.proxies,
                    verbose=2  # Full logging
                )
                
                if not jobs_df.empty:
                    logger.info(f"Found {len(jobs_df)} jobs for search term: {search_term}")
                    
                    # Convert DataFrame to records
                    term_jobs = jobs_df.to_dict(orient="records")
                    
                    # Add search query to each job
                    for job in term_jobs:
                        job["search_query"] = search_term
                        
                        # Convert date fields to ISO format strings if present
                        if "date_posted" in job and job["date_posted"] is not None:
                            if isinstance(job["date_posted"], pd.Timestamp):
                                job["date_posted"] = job["date_posted"].isoformat()
                    
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
            "location": request.location,
            "country": request.country_indeed,
            "duration_seconds": duration,
            "timestamp": datetime.now().isoformat(),
            "source": "jobspy-indeed"
        }
        
        return {
            "jobs": all_jobs,
            "count": len(all_jobs),
            "metadata": metadata
        }
    
    except Exception as e:
        logger.exception(f"Error during Indeed scraping: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during Indeed scraping: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("JOBSPY_BRIDGE_PORT", 8000))
    host = os.environ.get("JOBSPY_BRIDGE_HOST", "127.0.0.1")
    uvicorn.run("indeed_bridge:app", host=host, port=port, reload=True) 