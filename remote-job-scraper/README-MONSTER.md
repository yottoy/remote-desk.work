# Monster.com Job Source Integration

This document provides information about using Monster.com as a job source in the remote job scraper system.

## Overview

Unlike Indeed's web scraping approach, our Monster integration uses their official Job Search API, which provides a more reliable and compliant method for accessing job listings.

## Requirements

To use the Monster job source, you'll need:

1. **API Key**: Register as a partner at [Monster's Developer Portal](https://partner.monster.com/developers) to obtain an API key
2. **Axios**: The HTTP client used for API requests (already included in project dependencies)

## Configuration

### Environment Variables

Add these to your `.env` file:

```
# Monster API configuration
MONSTER_API_KEY=your_monster_api_key_here
ENABLE_MONSTER_SCRAPER=true
```

### Configuration Settings

The Monster API integration can be configured in `config/config.js`:

```javascript
monster: {
  enabled: process.env.ENABLE_MONSTER_SCRAPER === 'true' || false,
  baseUrl: 'https://api.jobs.com/v3',
  apiKey: process.env.MONSTER_API_KEY || '',
  queries: [
    'remote data entry',
    'remote administrative assistant',
    'remote virtual assistant',
    'remote customer service representative'
  ],
  maxJobsPerQuery: 100,
  jobType: 'FullTime',
  credibilityScore: 8
}
```

## Technical Details

### Authentication

Monster's API uses token-based authentication:

1. The system requests an authentication token by calling the `/auth/token` endpoint with your API credentials
2. The token is stored and used for subsequent job search requests
3. If the token expires, the system will automatically request a new one

### Search Parameters

The API supports various search parameters, including:

- `keywords`: Search terms (we include "remote" to find remote jobs)
- `country`: Country code (defaults to "US")
- `jobType`: Job type - FullTime, PartTime, Contract, etc.
- `age`: How many days old listings can be (defaults to 30)
- `page` & `perPage`: For pagination

### Rate Limiting

Monster enforces rate limits on their API. Our implementation:

- Adds delays between API requests
- Limits the number of jobs fetched per query
- Handles errors gracefully

## Verification

Run the following to check your Monster integration:

```bash
node check-monster-requirements.js
```

This will verify:
- Axios is installed
- API key is configured
- Monster scraper is enabled in config

## Troubleshooting

Common issues:

1. **Authentication Errors**:
   - Verify your API key is correctly set in `.env`
   - Check that your Monster partner account is active

2. **No Results Returned**:
   - Try different search queries
   - Check if your API access includes the job categories you're interested in

3. **Rate Limiting**:
   - If you encounter rate limiting, the system will log these errors
   - Consider reducing `maxJobsPerQuery` or adding more delay between requests

## Comparison with Indeed

Unlike Indeed, where we attempted browser automation to scrape their website (which faced anti-scraping measures), Monster offers an official API that provides:

- **Better Reliability**: Direct access to job data without anti-bot detection issues
- **Compliance**: Using the API complies with Monster's terms of service
- **Structured Data**: The API returns well-formatted job data with consistent fields
- **Easier Maintenance**: Less likely to break when Monster updates their website

## Support

If you need assistance with Monster API integration:

1. Check [Monster's Partner Documentation](https://partner.monster.com/developers)
2. Contact Monster's partner support for API-specific questions
3. Consult with your API provider for any credential issues 