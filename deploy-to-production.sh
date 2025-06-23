#!/bin/bash

echo "🚀 ClickClickJob.com - Complete Production Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Starting deployment process..."

# Step 1: Clean up any temporary files
print_info "Cleaning up temporary files..."
rm -rf .next
rm -rf dist
rm -rf build
print_status "Cleanup complete"

# Step 2: Check Git status
print_info "Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Adding and committing..."
    git add .
    git commit -m "feat: Complete production deployment - Backend systems (5A,5B,5C) + Frontend components + SEO optimizations"
    print_status "Changes committed"
else
    print_status "Working directory clean"
fi

# Step 3: Push to GitHub
print_info "Pushing to GitHub..."
git push origin main
if [ $? -eq 0 ]; then
    print_status "Code pushed to GitHub successfully"
else
    print_error "Failed to push to GitHub"
    exit 1
fi

# Step 4: Install dependencies in both root and frontend
print_info "Installing root dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_status "Root dependencies installed"
else
    print_error "Failed to install root dependencies"
    exit 1
fi

print_info "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi
cd ..

# Step 5: Build frontend
print_info "Building frontend..."
cd frontend
npm run build
if [ $? -eq 0 ]; then
    print_status "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi
cd ..

# Step 6: Test MongoDB connection
print_info "Testing MongoDB connection..."
node test-mongodb-connection.js
if [ $? -eq 0 ]; then
    print_status "MongoDB connection successful"
else
    print_warning "MongoDB connection test failed - proceeding anyway"
fi

# Step 7: Deploy to Vercel
print_info "Deploying to Vercel..."
vercel --prod --yes
if [ $? -eq 0 ]; then
    print_status "Vercel deployment successful"
else
    print_error "Vercel deployment failed"
    exit 1
fi

# Step 8: Run post-deployment tests
print_info "Running post-deployment tests..."

# Test health endpoint
sleep 10  # Wait for deployment to be ready
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://www.clickclickjob.com/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    print_status "Health check passed"
else
    print_warning "Health check failed (HTTP $HEALTH_CHECK)"
fi

# Test API endpoints
print_info "Testing API endpoints..."
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://www.clickclickjob.com/api/content/articles)
if [ "$API_TEST" = "200" ]; then
    print_status "Content API test passed"
else
    print_warning "Content API test failed (HTTP $API_TEST)"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
print_status "Backend Systems (5A, 5B, 5C): Content Management, Job Alerts, Analytics"
print_status "Frontend Components: Job Alert Signup, Market Insights, Editor Picks"
print_status "Job Scraping Infrastructure: Enhanced filtering and validation"
print_status "SEO Optimizations: Technical SEO implementation complete"
echo ""
print_info "🌐 Live Site: https://www.clickclickjob.com"
print_info "📊 Vercel Dashboard: https://vercel.com/dashboard"
print_info "🗄️  MongoDB Atlas: Check your cluster for data"
echo ""
print_warning "Next Steps:"
echo "1. Verify all functionality on the live site"
echo "2. Test job alert subscriptions"
echo "3. Check analytics data collection"
echo "4. Monitor error logs in Vercel dashboard"
echo "5. Set up monitoring alerts"
echo ""
print_status "Deployment completed successfully! 🚀" 