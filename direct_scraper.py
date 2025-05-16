#!/usr/bin/env python3
'''
Direct JobSpy scraper - no bridges, no complexity, just direct use of the JobSpy library
'''

import os
import sys
import json
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("direct_scraper")

# Ensure results directory exists
os.makedirs("results", exist_ok=True)

# Import JobSpy - install if not available
try:
    import pandas as pd
    from jobspy import scrape_jobs
    logger.info("Successfully imported JobSpy and dependencies")
except ImportError as e:
    logger.error(f"Missing required packages: {e}")
    logger.info("Attempting to install required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "jobspy", "pandas"])
    import pandas as pd
    from jobspy import scrape_jobs
    logger.info("Successfully installed and imported JobSpy and dependencies")

def save_jobs_to_file(df, site_name, search_term):
    """Save job results to a JSON file"""
    if df is None or len(df) == 0:
        logger.warning(f"No jobs found for {site_name} with search term '{search_term}'")
        jobs_list = []
    else:
        logger.info(f"Found {len(df)} jobs for {site_name} with search term '{search_term}'")
        # Convert DataFrame to list of dictionaries
        jobs_json = df.to_json(orient="records", date_format="iso")
        jobs_list = json.loads(jobs_json)
    
    # Add metadata
    results = {
        "source": site_name,
        "search_term": search_term,
        "scrape_date": datetime.now().isoformat(),
        "jobs_count": len(jobs_list),
        "jobs": jobs_list
    }
    
    # Save to file
    filename = f"results/{site_name}-results.json"
    with open(filename, "w") as f:
        json.dump(results, f, indent=2)
    logger.info(f"Saved results to {filename}")
    return jobs_list

def scrape_weworkremotely():
    """Scrape jobs from WeWorkRemotely"""
    logger.info("Starting WeWorkRemotely scraper")
    search_term = "administrative assistant data entry"
    
    try:
        logger.info(f"Scraping WeWorkRemotely for '{search_term}'")
        df = scrape_jobs(
            site_name="weworkremotely",
            search_term=search_term,
            results_wanted=20
        )
        
        return save_jobs_to_file(df, "weworkremotely", search_term)
    except Exception as e:
        logger.error(f"Error scraping WeWorkRemotely: {str(e)}")
        # Create empty results file
        with open("results/weworkremotely-results.json", "w") as f:
            json.dump({
                "source": "weworkremotely",
                "search_term": search_term,
                "scrape_date": datetime.now().isoformat(),
                "error": str(e),
                "jobs_count": 0,
                "jobs": []
            }, f, indent=2)
        return []

def scrape_indeed():
    """Scrape jobs from Indeed"""
    logger.info("Starting Indeed scraper")
    search_term = 'remote data entry'
    
    try:
        logger.info(f"Scraping Indeed for '{search_term}'")
        df = scrape_jobs(
            site_name="indeed",
            search_term=search_term,
            location="Remote",
            results_wanted=20,
            country="USA",
            job_type="fulltime",
            remote=True
        )
        
        return save_jobs_to_file(df, "indeed", search_term)
    except Exception as e:
        logger.error(f"Error scraping Indeed: {str(e)}")
        # Create empty results file
        with open("results/indeed-results.json", "w") as f:
            json.dump({
                "source": "indeed",
                "search_term": search_term,
                "scrape_date": datetime.now().isoformat(),
                "error": str(e),
                "jobs_count": 0,
                "jobs": []
            }, f, indent=2)
        return []

def scrape_simplyhired():
    """Scrape jobs from SimplyHired"""
    logger.info("Starting SimplyHired scraper")
    search_term = 'data entry assistant remote'
    
    try:
        logger.info(f"Scraping SimplyHired for '{search_term}'")
        df = scrape_jobs(
            site_name="simplyhired",
            search_term=search_term,
            location="Remote",
            results_wanted=20,
        )
        
        return save_jobs_to_file(df, "simplyhired", search_term)
    except Exception as e:
        logger.error(f"Error scraping SimplyHired: {str(e)}")
        # Create empty results file
        with open("results/simplyhired-results.json", "w") as f:
            json.dump({
                "source": "simplyhired",
                "search_term": search_term,
                "scrape_date": datetime.now().isoformat(),
                "error": str(e),
                "jobs_count": 0,
                "jobs": []
            }, f, indent=2)
        return []

def merge_results():
    """Merge all scraped job results into a single file"""
    logger.info("Merging results from all scrapers")
    all_jobs = []
    
    # Load all result files
    for site in ["weworkremotely", "indeed", "simplyhired"]:
        filename = f"results/{site}-results.json"
        try:
            if os.path.exists(filename):
                with open(filename, "r") as f:
                    data = json.load(f)
                    if "jobs" in data and isinstance(data["jobs"], list):
                        # Add source information to each job
                        for job in data["jobs"]:
                            job["site_source"] = site
                        all_jobs.extend(data["jobs"])
                        logger.info(f"Added {len(data['jobs'])} jobs from {site}")
        except Exception as e:
            logger.error(f"Error loading results from {filename}: {str(e)}")
    
    # Save merged results
    with open("results/combined-results.json", "w") as f:
        json.dump({
            "scrape_date": datetime.now().isoformat(),
            "total_jobs": len(all_jobs),
            "jobs": all_jobs
        }, f, indent=2)
    logger.info(f"Saved {len(all_jobs)} jobs to results/combined-results.json")

def main():
    """Run all scrapers and merge results"""
    logger.info("=== STARTING DIRECT JOBSPY SCRAPER ===")
    
    try:
        # Always try WeWorkRemotely first (most reliable)
        wwr_jobs = scrape_weworkremotely()
        
        # Try other sites
        simplyhired_jobs = scrape_simplyhired()
        
        # Try Indeed last (most problematic)
        indeed_jobs = scrape_indeed()
        
        # Merge all results
        merge_results()
        
        logger.info("=== SCRAPING COMPLETED SUCCESSFULLY ===")
        total_jobs = len(wwr_jobs) + len(indeed_jobs) + len(simplyhired_jobs)
        logger.info(f"Total jobs found: {total_jobs}")
        return True
    except Exception as e:
        logger.error(f"Unhandled error in main: {str(e)}")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Critical error: {str(e)}")
        sys.exit(1) 