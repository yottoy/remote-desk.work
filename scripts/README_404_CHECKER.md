# 404 Link Checker for ClickClickJob.com

This tool helps maintain the quality of the ClickClickJob.com website by identifying and reporting broken links (404s) across the site.

## Features

- Automatically crawls the entire website to find broken links
- Generates detailed reports with source pages for each broken link
- Can be run manually or via a scheduled cron job
- Helps prevent users from encountering dead ends while browsing

## Usage

### Manual Check

To run a manual check for 404 links:

```bash
npm run check-404
```

The script will crawl the site and generate a report in the `reports` directory.

### Setting Up Automated Checks

To set up a weekly cron job that checks for 404 links:

```bash
npm run cron-setup
```

This will schedule the script to run every Sunday at 1:00 AM.

## Implementation Details

The 404 checker was implemented to address issues with:

1. Invalid category links on the categories page
2. Job links that lead to 404 errors
3. Other website navigation issues

### Preventive Measures

In addition to detecting broken links, we implemented safeguards in the UI components:

1. **CategoryCard Component**: 
   - Added a list of valid category slugs
   - Redirects invalid categories to the jobs page instead of showing 404s

2. **EnhancedJobCard Component**:
   - Added validation for job IDs and application links
   - Provides fallbacks when links would be invalid

## Script Output

The script generates two files in the `reports` directory:

1. A detailed Markdown report with all findings
2. A plain text list of broken URLs for quick reference

## Maintenance

Regular maintenance should include:

1. Running the script before significant updates
2. Reviewing and fixing any reported broken links
3. Ensuring the cron job is active by checking `crontab -l`

## Cron Job Configuration

The cron job is set up to:
- Run weekly (every Sunday at 1:00 AM)
- Log output to the `logs/404-check-cron.log` file
- Automatically create the reports directory if needed 