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

# Get environment variables with stricter defaults enforcing IPv4
HOST = os.getenv("JOBSPY_BRIDGE_HOST", "127.0.0.1")  # Always use IPv4 loopback
PORT = int(os.getenv("JOBSPY_BRIDGE_PORT", "8000"))
MAX_RETRY_ATTEMPTS = int(os.getenv("MAX_RETRY_ATTEMPTS", "3"))
RETRY_DELAY = float(os.getenv("RETRY_DELAY", "5"))
MIN_REQUEST_INTERVAL = float(os.getenv("MIN_REQUEST_INTERVAL", "2.0"))
USE_RANDOM_USER_AGENTS = os.getenv("USE_RANDOM_USER_AGENTS", "false").lower() == "true"

# Force IPv4 for all connections
if ":" in HOST or HOST.lower() == "localhost":
    logger.warning(f"IPv6 address or 'localhost' detected in HOST: {HOST}. Forcing IPv4 (127.0.0.1).")
    HOST = "127.0.0.1"  # Always use explicit IPv4 loopback

# Configure socket to use IPv4 only
socket.setdefaulttimeout(30)  # 30 second timeout
original_getaddrinfo = socket.getaddrinfo

def getaddrinfo_ipv4_only(*args, **kwargs):
    """Force IPv4 only for all socket connections"""
    kwargs['family'] = socket.AF_INET  # Always force IPv4
    return original_getaddrinfo(*args, **kwargs)

# Override the getaddrinfo function
socket.getaddrinfo = getaddrinfo_ipv4_only 

# Run the API server if executed directly
if __name__ == "__main__":
    logger.info(f"Starting JobSpy bridge on http://{HOST}:{PORT} (IPv4 only)")
    try:
        # Get socket info for localhost to verify it's resolving to IPv4
        try:
            addr_info = socket.getaddrinfo("127.0.0.1", PORT, socket.AF_INET, socket.SOCK_STREAM)
            logger.info(f"127.0.0.1 resolves to: {addr_info[0][4][0]}")
        except Exception as e:
            logger.warning(f"Could not resolve 127.0.0.1: {e}")
            
        # Create server with explicit IPv4 binding
        logger.info(f"Starting server with host={HOST}, port={PORT}")
        # Use socket options to force IPv4
        uvicorn.run(
            app=app, 
            host=HOST, 
            port=PORT, 
            log_level="info",
            # Force IPv4 only with explicit socket options
            loop="asyncio",
            # Add access log for debugging
            access_log=True
        )
    except Exception as e:
        logger.error(f"Failed to start JobSpy bridge: {str(e)}")
        # Try alternative approaches if the server won't start
        try:
            logger.info("Trying alternative server configuration...")
            # Direct socket binding approach as fallback
            import asyncio
            from uvicorn.config import Config
            from uvicorn.server import Server
            
            config = Config(app=app, host="127.0.0.1", port=PORT, log_level="info")
            server = Server(config)
            
            logger.info("Starting with alternative configuration")
            asyncio.run(server.serve())
        except Exception as e2:
            logger.error(f"Alternative server configuration also failed: {str(e2)}")
            logger.error("Unable to start the JobSpy bridge server.") 

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
    
    # Implement exponential backoff with jitter
    def get_retry_delay(attempt_num):
        base_delay = RETRY_DELAY * (2 ** attempt_num)
        jitter = random.uniform(0, RETRY_DELAY)
        return base_delay + jitter
    
    while attempt < MAX_RETRY_ATTEMPTS:
        try:
            # Apply rate limiting
            apply_rate_limiting(site_name.name.lower())
            
            # Get a random user agent
            user_agent = get_random_user_agent()
            
            # Select proxies if available - for some sites, proxies are essential
            selected_proxies = None
            if proxies and len(proxies) > 0:
                # For LinkedIn and Indeed, always try to use proxies if available
                if site_name in [Site.LINKEDIN, Site.INDEED]:
                    proxy_count = min(3, len(proxies))  # Use up to 3 proxies
                    selected_proxies = random.sample(proxies, proxy_count)
                    logger.info(f"Using {len(selected_proxies)} proxies for {site_name.name}")
            
            # Log scraping attempt
            logger.info(f"Attempt {attempt+1}/{MAX_RETRY_ATTEMPTS} - Scraping {site_name.name} for '{search_term}' with proxy: {selected_proxies is not None}")
            
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
                proxies=selected_proxies,
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
                        keyword_lower = keyword.lower()
                        if keyword_lower in title or keyword_lower in description:
                            return True
                    return False
                
                # Apply the filter
                jobs_df = jobs_df[~jobs_df.apply(contains_excluded_keyword, axis=1)]
                
                filtered_count = original_count - len(jobs_df)
                if filtered_count > 0:
                    logger.info(f"Filtered out {filtered_count} jobs containing excluded keywords")
            
            # If we got results, verify they match our requirements
            if not jobs_df.empty:
                # Check if we have remote jobs (if that's what was requested)
                if is_remote:
                    # Count how many jobs explicitly mention remote
                    remote_count = 0
                    for _, row in jobs_df.iterrows():
                        title = str(row.get('title', '')).lower()
                        description = str(row.get('description', '')).lower()
                        location_str = str(row.get('location', '')).lower()
                        
                        if ('remote' in title or 'remote' in description or 
                            'work from home' in title or 'work from home' in description or
                            'remote' in location_str or 'work from home' in location_str):
                            remote_count += 1
                    
                    # Log the remote job percentage
                    remote_percentage = (remote_count / len(jobs_df)) * 100
                    logger.info(f"Found {remote_count}/{len(jobs_df)} ({remote_percentage:.1f}%) jobs that explicitly mention remote work")
                    
                    # If less than 30% mention remote, but remote was requested, this might 
                    # indicate a problem with the search
                    if remote_percentage < 30 and len(jobs_df) > 5:
                        logger.warning(f"Low percentage of remote jobs found ({remote_percentage:.1f}%). Results may not be accurate.")
            
            return jobs_df
            
        except Exception as e:
            attempt += 1
            last_error = e
            error_str = str(e)
            logger.warning(f"Error on attempt {attempt}/{MAX_RETRY_ATTEMPTS} for {site_name.name} - {search_term}: {error_str}")
            
            # Different handling based on error type
            if "captcha" in error_str.lower() or "403" in error_str or "forbidden" in error_str.lower():
                logger.error(f"Possible CAPTCHA or IP blocking detected from {site_name.name}. Try using different proxies.")
            elif "429" in error_str or "too many requests" in error_str.lower() or "rate limit" in error_str.lower():
                logger.error(f"Rate limiting detected from {site_name.name}. Adding extra delay.")
                # Add extra delay for rate limiting
                sleep_time = get_retry_delay(attempt) * 2
                logger.info(f"Rate limit hit. Waiting {sleep_time:.2f} seconds before retry...")
                time.sleep(sleep_time)
                continue
            
            if attempt < MAX_RETRY_ATTEMPTS:
                # Exponential backoff with jitter
                sleep_time = get_retry_delay(attempt - 1)
                logger.info(f"Retrying in {sleep_time:.2f} seconds...")
                time.sleep(sleep_time)
    
    # If we get here, all attempts failed
    logger.error(f"All {MAX_RETRY_ATTEMPTS} attempts failed for {site_name.name} - {search_term}")
    if last_error:
        logger.error(f"Last error: {last_error}")
    
    # Return empty DataFrame instead of raising exception
    return pd.DataFrame() 