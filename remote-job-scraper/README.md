# Remote Job Scraper

A comprehensive system to scrape, filter, and store remote data entry and administrative job listings from multiple sources. This powers a niche job board website focused on quality remote opportunities.

## Features

- **Multi-Source Scraping**: Scrapes job listings from We Work Remotely, Remote.co, and Indeed
- **Quality Filtering**: Implements a sophisticated scoring system (0-10) based on:
  - Relevance to data entry/admin positions
  - Job post quality and completeness
  - Source credibility
  - Recency of posting
- **MongoDB Integration**: Stores filtered jobs with proper indexing and automatic expiration
- **Daily Automation**: Uses GitHub Actions for scheduled scraping
- **Error Handling**: Comprehensive logging and error recovery

## Project Structure

```
remote-job-scraper/
├── config/              # Configuration files
├── logs/                # Log output directory
├── results/             # Scrape results directory
├── src/
│   ├── controllers/     # Main controller logic
│   ├── models/          # MongoDB models
│   ├── scrapers/        # Source-specific scrapers
│   └── utils/           # Utility functions
├── .env                 # Environment variables (not committed)
├── .github/workflows/   # GitHub Actions workflow
└── package.json         # Dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB Atlas account (free tier is sufficient)
- GitHub account (for Actions)
- Indeed API key (optional)

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/remote-job-scraper.git
   cd remote-job-scraper
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/remote-jobs?retryWrites=true&w=majority
   INDEED_API_KEY=your_indeed_api_key
   LOG_LEVEL=info
   QUALITY_THRESHOLD=5
   FEATURED_THRESHOLD=8
   TTL_DAYS=30
   ```

### Running Locally

To run the scraper on your local machine:

```
node src/index.js
```

### Scheduling with GitHub Actions

The scraper is configured to run daily at 2:00 AM UTC via GitHub Actions.

To set this up:

1. Push your code to GitHub
2. Add your secrets in the GitHub repository:
   - Go to Settings > Secrets
   - Add `MONGODB_URI` and `INDEED_API_KEY` (optional)
3. The workflow will automatically run according to the schedule

## Configuration

You can customize the scraper by modifying `config/config.js`:

- Change source URLs and categories
- Adjust quality scoring thresholds and weights
- Modify keywords for relevance scoring
- Update the list of red flags
- Configure rate limiting and retry behavior

## Adding New Sources

To add a new source:

1. Create a new scraper class in `src/scrapers/` by extending `BaseScraper`
2. Implement the required methods: `scrape()` and any source-specific helpers
3. Add the source configuration to `config/config.js`
4. Import and instantiate your scraper in `src/controllers/scrapeController.js`

## Quality Filtering

Jobs are scored on a scale of 0-10 based on multiple factors:

- **Relevance Score**: Matches keywords in title and description
- **Quality Indicator Score**: Evaluates description length, formatting, and completeness
- **Credibility Score**: Rates the trustworthiness of the source
- **Recency Score**: Gives higher scores to fresher listings

Jobs scoring below the threshold (default: 5) are filtered out. Jobs with red flags (MLM, unrealistic pay, upfront fees) are automatically rejected regardless of score.

## License

MIT

## Support

For questions or support, please open an issue on GitHub.

---

*This project was built to power a niche job board for remote data entry and administrative positions.* 