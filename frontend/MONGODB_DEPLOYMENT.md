# MongoDB Deployment Guide for ClickClickJob on Vercel

This guide provides step-by-step instructions to ensure your Vercel deployment of ClickClickJob uses the live MongoDB database.

## Prerequisites

- MongoDB Atlas account with a cluster set up
- Vercel account
- ClickClickJob frontend codebase

## Step 1: Prepare MongoDB Connection

1. Your MongoDB connection string has been configured as:
   ```
   mongodb+srv://username:password@cluster0.mjemntb.mongodb.net/clickclickjob?retryWrites=true&w=majority&appName=Cluster0&ssl=true
   ```

2. Ensure the database name is explicitly set to `clickclickjob` in the URI (as shown above)

3. Verify collection access:
   - The main collection for jobs is `jobs`
   - The collection should contain your job listings

## Step 2: Set Up Vercel Environment Variables

1. Log in to the Vercel dashboard at https://vercel.com/dashboard

2. Navigate to your ClickClickJob project

3. Go to "Settings" > "Environment Variables"

4. Add the following environment variables:
   - Name: `MONGODB_URI`
     Value: `mongodb+srv://username:password@cluster0.mjemntb.mongodb.net/clickclickjob?retryWrites=true&w=majority&appName=Cluster0&ssl=true`
     (Use your actual MongoDB connection string)
   
   - Name: `MONGODB_DB`
     Value: `clickclickjob`

5. Save the changes

## Step 3: Deploy to Vercel

1. From the `frontend` directory, run:
   ```bash
   npm run build
   vercel --prod
   ```

2. Or use our deployment script:
   ```bash
   ./scripts/deploy-vercel.sh
   ```

3. Alternatively, deploy through the Vercel GitHub integration for automatic deployments

## Step 4: Verify Deployment

1. After deployment, check your API's health endpoint:
   ```
   https://your-vercel-domain.vercel.app/api/health
   ```

2. Verify the API can access jobs:
   ```
   https://your-vercel-domain.vercel.app/api/jobs
   ```

3. If you see job listings from your MongoDB database, the deployment was successful

## Troubleshooting

If you encounter issues with MongoDB connectivity:

1. **Connection String**: 
   - Ensure your connection string includes the database name (`/clickclickjob`)
   - Confirm username and password are correct
   - Check for any special characters that might need encoding

2. **Network Access**:
   - In MongoDB Atlas, allow access from Vercel's IP ranges
   - Alternatively, allow access from all IP addresses (0.0.0.0/0) for testing

3. **Deployment Logs**:
   - Check Vercel deployment logs for connection errors
   - Look for specific MongoDB error messages

4. **API Response**:
   - If `/api/health` returns `"connected": false`, there's a connection issue
   - Check the error message in the response

5. **Environment Variables**:
   - Verify environment variables are correctly set in Vercel
   - Rebuild and redeploy if you've updated the variables

## Ongoing Maintenance

1. **Monitor Connection**: 
   - Set up regular checks of your API health endpoint
   - Consider implementing alerting for database connection failures

2. **Database Backups**:
   - Ensure MongoDB Atlas is configured for regular backups
   - Test restoration procedures periodically

By following this guide, your ClickClickJob deployment on Vercel should successfully connect to the live MongoDB database and display the most current job listings from your database. 