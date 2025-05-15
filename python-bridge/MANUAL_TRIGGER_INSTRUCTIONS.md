# Manual Workflow Trigger Instructions

To manually trigger the JobSpy scraper workflow:

1. Navigate to the GitHub repository's Actions tab:
   [https://github.com/yottoy/remote-desk.work/actions/workflows/jobspy-scraper.yml](https://github.com/yottoy/remote-desk.work/actions/workflows/jobspy-scraper.yml)

2. Click on the "Run workflow" button (on the right side of the screen)

3. Optional: You can set the following parameters:
   - **debug**: Set to 'true' to enable debug mode
   - **use_proxies**: Set to 'true' to use proxies from the GitHub secrets

4. Select the branch to run the workflow on (usually "main")

5. Click the green "Run workflow" button to start the process

6. The workflow will start running and you can monitor its progress on the Actions tab

## Troubleshooting

If you encounter issues with the workflow:

1. Check the logs by clicking on the workflow run and navigating to the specific job that failed
2. Ensure all required secrets are set up in the GitHub repository:
   - `MONGODB_URI`: Connection string for your MongoDB database
   - `PROXY_LIST`: List of proxies if using the proxy option

## Notes

- The workflow is also scheduled to run automatically every 6 hours
- Results and logs will be available as artifacts after the workflow completes 