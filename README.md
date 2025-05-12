# Remote Desk Work

A comprehensive remote job scraping system focused on data entry, administrative, and customer service roles.

## Project Overview

This project consists of a job scraper that collects remote job listings from multiple sources, filters them for quality, and stores them in a MongoDB database. The system is designed to run automatically on a daily schedule.

## Components

- **Remote Job Scraper**: Core scraping engine that collects job data from various sources
- **MongoDB Database**: Stores job listings with automatic deduplication
- **Quality Filtering**: Scores and filters jobs based on relevance and quality criteria
- **Scheduled Execution**: Runs daily via GitHub Actions

## Technical Stack

- Node.js
- MongoDB/Mongoose
- Playwright for web scraping
- GitHub Actions for CI/CD

## Sources

The scraper collects data from:
- We Work Remotely
- Remote.co
- Indeed

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Install Playwright browsers: `npx playwright install`
4. Set up environment variables in `.env` file
5. Run the scraper: `npm start`

## Environment Variables

Create a `.env` file with the following variables:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
INDEED_API_KEY=your_indeed_api_key (optional)
LOG_LEVEL=info
QUALITY_THRESHOLD=5
FEATURED_THRESHOLD=8
TTL_DAYS=30
```

## GitHub Actions Setup

For automatic daily scraping, set up the following GitHub secrets:
- `MONGODB_URI`: Your MongoDB connection string 