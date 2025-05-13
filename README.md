# ClickClickJob.com

A sophisticated remote job aggregation platform built to scrape, filter, and present high-quality remote job listings from multiple sources.

## Overview

ClickClickJob.com (previously RemoteDesk.work) is designed to help remote job seekers find quality job listings by:

1. Scraping multiple job sites for remote positions
2. Filtering and scoring jobs based on quality metrics
3. Presenting listings through a clean, user-friendly interface
4. Enabling advanced search and filtering capabilities

## Repository Structure

- `python-bridge/` - Python-Node.js bridge for JobSpy integration
- `scripts/` - Automation scripts for running scrapers
- `frontend/` - Next.js frontend application
- `remote-job-scraper/` - Node.js backend scrapers and API
- `CODEBASE_REVIEW.md` - Comprehensive codebase review

## Core Technologies

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Scraping**: JobSpy (Python), Playwright, Axios
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.10+
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/clickclickjob.git
   cd clickclickjob
   ```

2. Install dependencies:
   ```bash
   npm install
   cd python-bridge && pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development environment:
   ```bash
   # Start the Python bridge
   npm run bridge
   
   # In another terminal, start the scrapers
   npm run scrape
   
   # In another terminal, start the frontend
   npm run dev
   ```

## Features

- Multi-source job scraping (Indeed, LinkedIn, Naukri, etc.)
- Quality filtering and ranking
- User-friendly search interface
- Comprehensive job details
- Mobile-responsive design

## Architecture

The system is comprised of three main components:

1. **Job Scrapers**: Python and Node.js scrapers that collect job listings
2. **Processing Pipeline**: Filters, deduplicates, and scores job listings
3. **Frontend Application**: User interface for browsing and searching jobs

## Running the Scrapers

Use the comprehensive scraper script:

```bash
npm run full-scrape
```

This will start the Python bridge, run all configured scrapers, and save results to MongoDB.

## Development

See the specific README files in each directory for detailed development instructions:

- [Python Bridge README](python-bridge/README.md)
- [Scripts README](scripts/README.md)
- [Frontend README](frontend/README.md)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- JobSpy library for Python job scraping capabilities
- All contributors and maintainers 