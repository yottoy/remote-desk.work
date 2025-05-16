# Remote Admin/Data Entry Job Scraper

A robust job scraping system for remote administrative and data entry positions. This system provides reliable job data collection from multiple sources with advanced error handling and fallback mechanisms.

## Features

- **Multi-source scraping** - Collects jobs from LinkedIn, Indeed, and other sites
- **Robust error handling** - Multiple layers of fallback mechanisms
- **Deduplication** - Ensures unique job listings
- **Automatic scheduling** - Set up with GitHub Actions
- **Simple deployment** - Easy to set up and run

## Architecture

The system consists of multiple components:

1. **Direct Python Scraper** (`direct_scraper.py`) - Primary scraping engine that directly uses the JobSpy library
2. **Node.js Bridge** (`run-jobspy-direct.js`) - Executes the Python scraper from Node.js
3. **Combined Runner** (`run-all-scrapers.js`) - Orchestrates the entire scraping process
4. **GitHub Actions Workflow** - Handles automatic scheduled runs

## Setup & Installation

### Prerequisites

- Node.js (v16+)
- Python 3.10+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/remote-admin-job-scraper.git
cd remote-admin-job-scraper

# Install dependencies
npm install
python -m pip install numpy==1.24.3 pandas python-jobspy
```

### Configuration

No additional configuration is needed to run the basic scraper. The system is designed to work with default settings.

### Running the Scraper

```bash
# Run the main scraper
npm start
```

Or directly with Node.js:

```bash
node run-all-scrapers.js
```

### Testing

To test the direct scraper:

```bash
npm test
```

## Output

The system generates several output files:

- `combined-results.json` - The main output file with all deduplicated jobs
- `results/scrape-results.json` - Raw results from the scraper
- `results/indeed_linkedin-results.json` - Results specifically from Indeed and LinkedIn

## GitHub Actions Integration

The repository includes a GitHub Actions workflow file (`.github/workflows/scrape-jobs.yml`) that automatically runs the scraper on a schedule (every 12 hours by default).

## Troubleshooting

If you encounter any issues:

1. Check the logs in the `logs/` directory
2. Ensure all dependencies are correctly installed
3. Verify your Python version (Python 3.10+ recommended)
4. Make sure the script has appropriate permissions (`chmod +x direct_scraper.py`)

## Extending the Scraper

To add more job sources or modify the scraping behavior:

1. Edit `direct_scraper.py` to include additional job site scraping logic
2. Update the search terms in the script to target different job types

## License

MIT

## Credits

This project uses the [JobSpy](https://github.com/speedyapply/JobSpy) library for job scraping functionality. 