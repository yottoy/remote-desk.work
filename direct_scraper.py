#!/usr/bin/env python3
'''
Direct JobSpy scraper - no bridges, no complexity, just direct use of the JobSpy library
'''

import os
import sys
import json
import logging
import traceback
from datetime import datetime

# Set up logging to both file and console
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/direct_scraper.log")
    ]
)
logger = logging.getLogger("direct_scraper")

# Ensure results directory exists with proper permissions
def ensure_directories():
    """Make sure all required directories exist and are writeable"""
    logger.info("Setting up directories")
    try:
        if not os.path.exists("results"):
            os.makedirs("results", exist_ok=True)
            logger.info("Created results directory")
            
        # Create a test file to verify write permissions
        test_file = "results/test_write.txt"
        with open(test_file, "w") as f:
            f.write("Test write permissions: " + datetime.now().isoformat())
        logger.info(f"Write test successful: {test_file}")
        
        # List the directory contents
        logger.info(f"Directory contents (results): {os.listdir('results')}")
        logger.info(f"Current working directory: {os.getcwd()}")
        
        return True
    except Exception as e:
        logger.error(f"Directory setup error: {str(e)}")
        logger.error(traceback.format_exc())
        return False

# Create a baseline empty result file - ensures we always have output files
def create_empty_result_file(site_name, error_message="No scraping attempted"):
    """Create an empty result file for a given site"""
    try:
        filename = f"results/{site_name}-results.json"
        with open(filename, "w") as f:
            json.dump({
                "source": site_name,
                "scrape_date": datetime.now().isoformat(),
                "error": error_message,
                "jobs_count": 0,
                "jobs": []
            }, f, indent=2)
        logger.info(f"Created empty result file: {filename}")
        return True
    except Exception as e:
        logger.error(f"Failed to create empty result file for {site_name}: {str(e)}")
        logger.error(traceback.format_exc())
        return False

# Import JobSpy - install if not available
def setup_dependencies():
    """Set up all required Python dependencies"""
    logger.info("Setting up dependencies")
    
    try:
        # First try to import without installing
        try:
            import pandas as pd
            from jobspy import scrape_jobs
            logger.info("Successfully imported JobSpy and dependencies")
            return True
        except ImportError as e:
            logger.warning(f"Missing dependencies: {str(e)}")
            
        # Then try to install missing packages
        logger.info("Attempting to install required packages...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "jobspy", "pandas", "-v"])
        
        # Try importing again
        import pandas as pd
        from jobspy import scrape_jobs
        logger.info("Successfully installed and imported JobSpy and dependencies")
        return True
    except Exception as e:
        logger.error(f"Failed to set up dependencies: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def save_jobs_to_file(df, site_name, search_term):
    """Save job results to a JSON file"""
    try:
        if df is None or len(df) == 0:
            logger.warning(f"No jobs found for {site_name} with search term '{search_term}'")
            jobs_list = []
        else:
            logger.info(f"Found {len(df)} jobs for {site_name} with search term '{search_term}'")
            # Convert DataFrame to list of dictionaries
            try:
                jobs_json = df.to_json(orient="records", date_format="iso")
                jobs_list = json.loads(jobs_json)
            except Exception as e:
                logger.error(f"Error converting DataFrame to JSON: {str(e)}")
                # Fallback conversion
                jobs_list = df.to_dict(orient="records")
        
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
    except Exception as e:
        logger.error(f"Error saving results to file: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Ensure we at least have an empty result file
        create_empty_result_file(site_name, f"Error saving results: {str(e)}")
        return []

def scrape_weworkremotely():
    """Scrape jobs from WeWorkRemotely"""
    logger.info("Starting WeWorkRemotely scraper")
    search_term = "administrative assistant data entry"
    
    # Create an empty result file first, in case of errors
    create_empty_result_file("weworkremotely", "Scraping in progress...")
    
    try:
        from jobspy import scrape_jobs
        logger.info(f"Scraping WeWorkRemotely for '{search_term}'")
        df = scrape_jobs(
            site_name="weworkremotely",
            search_term=search_term,
            results_wanted=20
        )
        
        return save_jobs_to_file(df, "weworkremotely", search_term)
    except Exception as e:
        logger.error(f"Error scraping WeWorkRemotely: {str(e)}")
        logger.error(traceback.format_exc())
        # Update the empty result file with the error
        create_empty_result_file("weworkremotely", f"Error: {str(e)}")
        return []

def scrape_indeed():
    """Scrape jobs from Indeed"""
    logger.info("Starting Indeed scraper")
    search_term = 'remote data entry'
    
    # Create an empty result file first, in case of errors
    create_empty_result_file("indeed", "Scraping in progress...")
    
    try:
        from jobspy import scrape_jobs
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
        logger.error(traceback.format_exc())
        # Update the empty result file with the error
        create_empty_result_file("indeed", f"Error: {str(e)}")
        return []

def scrape_simplyhired():
    """Scrape jobs from SimplyHired"""
    logger.info("Starting SimplyHired scraper")
    search_term = 'data entry assistant remote'
    
    # Create an empty result file first, in case of errors
    create_empty_result_file("simplyhired", "Scraping in progress...")
    
    try:
        from jobspy import scrape_jobs
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
        logger.error(traceback.format_exc())
        # Update the empty result file with the error
        create_empty_result_file("simplyhired", f"Error: {str(e)}")
        return []

def scrape_remoteco():
    """Scrape jobs from RemoteCo (added as a fallback source)"""
    logger.info("Starting RemoteCo scraper")
    search_term = 'data entry'
    
    # Create an empty result file first, in case of errors
    create_empty_result_file("remoteco", "Scraping in progress...")
    
    try:
        from jobspy import scrape_jobs
        logger.info(f"Scraping RemoteCo for '{search_term}'")
        df = scrape_jobs(
            site_name="remoteco",
            search_term=search_term,
            results_wanted=20,
        )
        
        return save_jobs_to_file(df, "remoteco", search_term)
    except Exception as e:
        logger.error(f"Error scraping RemoteCo: {str(e)}")
        logger.error(traceback.format_exc())
        # Update the empty result file with the error
        create_empty_result_file("remoteco", f"Error: {str(e)}")
        return []

def merge_results():
    """Merge all scraped job results into a single file"""
    logger.info("Merging results from all scrapers")
    all_jobs = []
    
    # Default empty combined results in case of error
    combined_results = {
        "scrape_date": datetime.now().isoformat(),
        "total_jobs": 0,
        "jobs": []
    }
    
    try:
        # Get a list of all result files
        result_files = []
        for filename in os.listdir("results"):
            if filename.endswith("-results.json"):
                result_files.append(os.path.join("results", filename))
        logger.info(f"Found {len(result_files)} result files: {result_files}")
        
        # Load all result files
        for filepath in result_files:
            site = os.path.basename(filepath).replace("-results.json", "")
            try:
                with open(filepath, "r") as f:
                    data = json.load(f)
                    if "jobs" in data and isinstance(data["jobs"], list):
                        # Add source information to each job
                        for job in data["jobs"]:
                            job["site_source"] = site
                        all_jobs.extend(data["jobs"])
                        logger.info(f"Added {len(data['jobs'])} jobs from {site}")
            except Exception as e:
                logger.error(f"Error loading results from {filepath}: {str(e)}")
                logger.error(traceback.format_exc())
        
        # Update combined results
        combined_results = {
            "scrape_date": datetime.now().isoformat(),
            "total_jobs": len(all_jobs),
            "jobs": all_jobs
        }
    except Exception as e:
        logger.error(f"Error merging results: {str(e)}")
        logger.error(traceback.format_exc())
    
    # Save combined results (even if empty)
    try:
        with open("results/combined-results.json", "w") as f:
            json.dump(combined_results, f, indent=2)
        logger.info(f"Saved {len(all_jobs)} jobs to results/combined-results.json")
    except Exception as e:
        logger.error(f"Error saving combined results: {str(e)}")
        logger.error(traceback.format_exc())

def main():
    """Run all scrapers and merge results"""
    logger.info("=== STARTING DIRECT JOBSPY SCRAPER ===")
    
    # Set up directories and dependencies first
    if not ensure_directories():
        logger.critical("Failed to set up directories, cannot continue")
        return False
        
    if not setup_dependencies():
        logger.critical("Failed to set up dependencies, cannot continue")
        # Create empty result files so we have artifacts
        create_empty_result_file("combined", "Failed to set up dependencies")
        create_empty_result_file("weworkremotely", "Failed to set up dependencies")
        create_empty_result_file("indeed", "Failed to set up dependencies")
        create_empty_result_file("simplyhired", "Failed to set up dependencies")
        return False
    
    # Start with a simple test file for the artifact upload
    with open("results/test-result.json", "w") as f:
        json.dump({"test": "This is a test file", "timestamp": datetime.now().isoformat()}, f)
    
    try:
        # Try all scrapers, but don't fail if one fails
        wwr_jobs = []
        simplyhired_jobs = []
        indeed_jobs = []
        remoteco_jobs = []
        
        try:
            # Always try WeWorkRemotely first (most reliable)
            wwr_jobs = scrape_weworkremotely()
        except Exception as e:
            logger.error(f"WeWorkRemotely scraper failed: {str(e)}")
            logger.error(traceback.format_exc())
        
        try:
            # Try SimplyHired
            simplyhired_jobs = scrape_simplyhired()
        except Exception as e:
            logger.error(f"SimplyHired scraper failed: {str(e)}")
            logger.error(traceback.format_exc())
        
        try:
            # Try RemoteCo as another alternative
            remoteco_jobs = scrape_remoteco()
        except Exception as e:
            logger.error(f"RemoteCo scraper failed: {str(e)}")
            logger.error(traceback.format_exc())
        
        try:
            # Try Indeed last (most problematic)
            indeed_jobs = scrape_indeed()
        except Exception as e:
            logger.error(f"Indeed scraper failed: {str(e)}")
            logger.error(traceback.format_exc())
        
        # Merge all results, regardless of individual scraper success
        merge_results()
        
        logger.info("=== SCRAPING COMPLETED ===")
        total_jobs = len(wwr_jobs) + len(indeed_jobs) + len(simplyhired_jobs) + len(remoteco_jobs)
        logger.info(f"Total jobs found: {total_jobs}")
        
        # List all files in the results directory to confirm they exist
        logger.info(f"Results directory contents: {os.listdir('results')}")
        
        return total_jobs > 0  # Success if we found at least one job
    except Exception as e:
        logger.error(f"Unhandled error in main: {str(e)}")
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    try:
        # Start with directories and test files to ensure we have artifacts
        ensure_directories()
        with open("results/script-started.json", "w") as f:
            json.dump({"status": "Script started", "timestamp": datetime.now().isoformat()}, f)
        
        # Run the main function
        success = main()
        
        # Create a final status file
        with open("results/script-status.json", "w") as f:
            json.dump({
                "status": "Completed" if success else "Failed",
                "timestamp": datetime.now().isoformat(),
                "success": success
            }, f)
        
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.critical(f"Critical error: {str(e)}")
        logger.critical(traceback.format_exc())
        
        # Create a final status file even on critical error
        try:
            ensure_directories()
            with open("results/script-error.json", "w") as f:
                json.dump({
                    "status": "Critical Error",
                    "timestamp": datetime.now().isoformat(),
                    "error": str(e)
                }, f)
        except:
            pass
        
        sys.exit(1) 