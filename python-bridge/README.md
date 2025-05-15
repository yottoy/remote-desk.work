# JobSpy Bridge for Remote Admin/Data Entry Jobs

This module provides an integration between our application and the [JobSpy](https://github.com/speedyapply/JobSpy) Python library to scrape remote admin and data entry jobs from various job boards.

## Features

- **Optimized for Admin/Data Entry Jobs**: Pre-configured to search for remote admin, data entry, and virtual assistant positions
- **Rate Limiting and Anti-Ban Measures**: Smart request throttling, proxy rotation, and user-agent rotation
- **Multiple Job Sources**: Scrapes from Indeed, LinkedIn, and other job sites
- **Configurable Search Keywords**: Easy-to-customize keywords and job types
- **Proxy Support**: Optional proxy usage to avoid IP bans
- **Robust Error Handling**: Automatic retries with exponential backoff
- **GitHub Workflow Integration**: Automated scraping on a schedule

## Requirements

- Python 3.10+
- Node.js 18+
- Python libraries as specified in `requirements.txt`
- Node.js libraries as specified in project's `package.json`

## Local Setup

1. Install Python dependencies:
   ```bash
   cd python-bridge
   pip install -r requirements.txt
   ```

2. Configure environment variables by creating a `.env` file in the python-bridge directory:
   ```
   JOBSPY_BRIDGE_HOST=0.0.0.0
   JOBSPY_BRIDGE_PORT=8000
   MAX_RETRY_ATTEMPTS=3
   RETRY_DELAY=5
   MIN_REQUEST_INTERVAL=2.5
   USE_RANDOM_USER_AGENTS=true
   USE_PROXIES=false
   ```

3. (Optional) Add proxies to `proxies.txt` if you need to avoid rate limiting

## Run the Bridge Locally

1. Start the JobSpy bridge:
   ```bash
   cd python-bridge
   python jobspy_bridge.py
   ```

2. In a separate terminal, run the scraper:
   ```bash
   cd python-bridge
   node scrape-all-jobs.js
   ```

## Running on GitHub

For a more reliable operation that's not dependent on your local machine, the bridge is configured to run on GitHub Actions:

1. Navigate to [https://github.com/yottoy/remote-desk.work/actions/workflows/jobspy-scraper.yml](https://github.com/yottoy/remote-desk.work/actions/workflows/jobspy-scraper.yml)
2. Click "Run workflow" to manually trigger a scraping job
3. Select options (enable debug mode or proxy usage) as needed
4. Monitor the job execution log for any issues
5. The workflow will automatically run every 6 hours

For more detailed instructions, see `MANUAL_TRIGGER_INSTRUCTIONS.md`.

## Customizing Keywords and Job Types

The bridge can be customized to search for specific types of admin and data entry jobs:

1. Edit `admin-data-entry-keywords.json` to add or modify:
   - Job types (administrative assistant, data entry, etc.)
   - Search keywords (remote, work from home, etc.)
   - Locations to search in
   - Keywords to exclude
   - Specific search combinations

2. Changes to this file will be automatically picked up by the scraper on the next run

## Managing the JobSpy Bridge

We've provided a helpful management script to make common tasks easier:

```bash
# Make the script executable
chmod +x manage-jobspy.sh

# Check GitHub workflow status
./manage-jobspy.sh status

# Open the manual trigger page
./manage-jobspy.sh trigger

# View local logs
./manage-jobspy.sh logs

# Update code from GitHub
./manage-jobspy.sh update

# Push local changes to GitHub
./manage-jobspy.sh push

# Show help
./manage-jobspy.sh help
```

## Troubleshooting

- **Rate Limiting Issues**: If you encounter rate limiting, consider:
  - Increasing the delay between requests
  - Using proxies by setting `USE_PROXIES=true` and adding proxies to the proxies.txt file
  - Reducing the number of search combinations

- **Missing Results**: Ensure that your search keywords are appropriate for the type of admin and data entry jobs you're looking for

- **Bridge Not Starting**: Check if the port 8000 is already in use by another application

## GitHub Workflow Output

After a GitHub workflow run, you can:

1. Download log files to check for any errors
2. Access scraped job data in the workflow artifacts
3. Check the MongoDB update status (if connected to a MongoDB database)

## Need Help?

For any issues or questions about the JobSpy bridge, please contact the development team or create an issue on GitHub. 