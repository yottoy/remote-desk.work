# Vercel Dashboard Deployment Guide for MongoDB Integration

Follow these steps to deploy ClickClickJob to Vercel with proper MongoDB connection:

## Step 1: Prepare MongoDB Connection

1. Ensure your MongoDB Atlas account is set up with:
   - A cluster
   - A database called `clickclickjob`
   - A collection called `jobs` with job data
   - A database user with read/write access
   - Network access allowed from Vercel's IP ranges (or 0.0.0.0/0 for testing)

2. Verify your MongoDB connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/clickclickjob?retryWrites=true&w=majority&ssl=true
   ```
   
   **IMPORTANT**: The `/clickclickjob` part must be included to specify the database name.

3. Test your connection locally:
   ```bash
   export MONGODB_URI="your_connection_string"
   node test-connection.js
   ```

## Step 2: Access the Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Sign in to your Vercel account or create a new one

## Step 3: Import Your Project

1. Click on "Add New..." > "Project"
2. Select the Git provider where your code is hosted (GitHub, GitLab, Bitbucket)
3. Grant necessary permissions if prompted
4. Find and select the `remote-desk.work` repository

## Step 4: Configure Project Settings

1. In the "Configure Project" screen, set the following:
   - **Name**: clickclickjob (or your preferred name)
   - **Framework Preset**: Next.js
   - **Root Directory**: frontend
   - **Build and Output Settings**: Leave as default

2. Most importantly, add your **Environment Variables**:
   - Click on "Environment Variables"
   - Add the following variables:
     - **Name**: `MONGODB_URI`  
       **Value**: Your MongoDB connection string with database name: `mongodb+srv://username:password@cluster.mongodb.net/clickclickjob?retryWrites=true&w=majority`
       
       Check "Encrypt" option to store as a secret
       
     - **Name**: `MONGODB_DB`  
       **Value**: `clickclickjob`

3. Click "Deploy"

## Step 5: Wait for Deployment

1. Vercel will build and deploy your project
2. This process typically takes 1-2 minutes

## Step 6: Verify MongoDB Connection

1. Once deployment is complete, click on "Visit" to open your deployed site
2. Test your MongoDB connection by accessing:
   - Health endpoint: `https://your-deployment-url.vercel.app/api/health`
   - Look for `"connected": true` in the response
   - Check `"collectionCounts"` to ensure job data is accessible
   
3. Test the Jobs API:
   - Jobs endpoint: `https://your-deployment-url.vercel.app/api/jobs?limit=5`
   - Verify jobs are being returned from MongoDB

## Step 7: Configure Custom Domain

1. In your project dashboard, go to "Settings" > "Domains"
2. Add your domain: `clickclickjob.com`
3. Select "Vercel DNS" for DNS Management
4. Follow instructions to set up nameservers if you haven't already

## Troubleshooting MongoDB Connection Issues

If your API routes return 404 errors or cannot connect to MongoDB:

1. **Check Database Name**:
   - Ensure the database name (`/clickclickjob`) is included in your MongoDB URI
   - URI should look like: `mongodb+srv://username:password@cluster.mongodb.net/clickclickjob?options...`

2. **Verify Environment Variables**:
   - Go to "Settings" > "Environment Variables"
   - Confirm MONGODB_URI and MONGODB_DB are set correctly
   - Check that MONGODB_URI is encrypted as a secret

3. **Network Access**:
   - In MongoDB Atlas, ensure Vercel's IP ranges have access
   - For testing, you can allow access from anywhere (0.0.0.0/0)

4. **Check Logs**:
   - Go to "Deployments" > Latest Deployment > "View Logs"
   - Look for MongoDB connection errors

5. **Redeploy If Needed**:
   - After fixing issues, click "Redeploy" from the "Deployments" page
   
6. **Use Automated Tool**:
   - Run `./verify-mongodb-connection.sh` to check connection issues

## Monitoring and Maintenance

1. Set up regular health checks for your API
2. Monitor MongoDB Atlas metrics for performance issues
3. Set up alerts for connection failures

By following these steps, your ClickClickJob site on Vercel should successfully connect to your MongoDB database and display live job data. 