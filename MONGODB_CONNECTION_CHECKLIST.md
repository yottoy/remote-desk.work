# MongoDB Connection Checklist for ClickClickJob.com

This checklist ensures that the live site is properly connected to MongoDB and can retrieve job data.

## Prerequisites

- [ ] MongoDB Atlas account (or other MongoDB hosting)
- [ ] MongoDB connection string (URI) stored securely
- [ ] MongoDB database created with `jobs` collection
- [ ] Valid data in the `jobs` collection

## Environment Variables Setup

- [ ] Set `MONGODB_URI` in Vercel project settings
  - Add as an environment variable in the Vercel dashboard
  - Format: `mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority`
- [ ] Set `MONGODB_DB` in Vercel project settings (default is "clickclickjob")
- [ ] Verify environment variables are properly set in production

## MongoDB Atlas Configuration

- [ ] Allow access from all IP addresses (0.0.0.0/0) or specific Vercel IP ranges
- [ ] Create a dedicated database user with read privileges
- [ ] Enable network access for Vercel deployment

## API Testing

Before deploying to production:

- [ ] Run `test-mongodb-connection.js` to verify direct MongoDB connectivity
  ```
  node test-mongodb-connection.js
  ```
- [ ] Run the API connection test script to verify API endpoints can access MongoDB
  ```
  ./test-api-connection.sh
  ```
- [ ] Check that both admin and regular job data can be retrieved

## Vercel Deployment

- [ ] Ensure `vercel.json` includes MongoDB environment variables
- [ ] Deploy to Vercel using the deploy script or UI
  ```
  cd frontend && npm run build && vercel --prod
  ```
- [ ] Verify deployment succeeded without errors

## Post-Deployment Verification

- [ ] Visit the live site at https://www.clickclickjob.com
- [ ] Check the health endpoint: https://www.clickclickjob.com/api/health
  - Verify `"connected": true` in the response
- [ ] Test the jobs API: https://www.clickclickjob.com/api/jobs?limit=5
  - Verify jobs are returned in the response
- [ ] Test the admin jobs API: https://www.clickclickjob.com/api/admin-jobs?limit=5
  - Verify admin jobs are returned in the response

## Troubleshooting

If the site cannot connect to MongoDB:

1. **Check environment variables:**
   - Verify `MONGODB_URI` is correctly set in Vercel
   - Ensure no typos or encoding issues in the connection string

2. **Check MongoDB Atlas access:**
   - Verify IP access list includes Vercel deployment servers
   - Test connection from other locations

3. **Check logs:**
   - View Vercel logs for connection errors
   - Look for specific MongoDB error messages

4. **Test connection string:**
   - Try the connection string locally
   - Verify database user credentials

5. **Check data:**
   - Verify the jobs collection exists and contains data
   - Check for proper indexing on frequently queried fields

## Monitoring

- [ ] Set up uptime monitoring for the API endpoints
- [ ] Create alerts for MongoDB connection failures
- [ ] Monitor API response times for potential performance issues 