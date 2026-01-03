import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';
import Layout from '../components/layout/Layout';
import SearchBar from '../components/common/SearchBar';
import EnhancedJobCard from '../components/common/EnhancedJobCard';
import ImprovedJobCard from '../components/common/ImprovedJobCard';
import CategoryCard from '../components/common/CategoryCard';
import { EmailCaptureForm } from '../components/email-capture/EmailCaptureForm';
import { useRouter } from 'next/router';
import type { Job } from '../types/job';
import { isMockJob } from '../types/job';
import { countRecentJobs } from '../utils/jobUtils';

// Job categories - prioritized based on Google Search Console data
const jobCategories = [
  { name: 'Data Processing', slug: 'data-processing' }, // PRIORITY 1: 561 impressions
  { name: 'Captioning', slug: 'captioning' }, // PRIORITY 2: 143 impressions, high CTR potential
  { name: 'Data Entry', slug: 'data-entry' },
  { name: 'Transcription', slug: 'transcription' },
  { name: 'Administrative', slug: 'administrative' },
  { name: 'Customer Support', slug: 'customer-service' },
  { name: 'Virtual Assistant', slug: 'virtual-assistant' }
];

interface HomePageProps {
  featuredJobs: Job[];
  recentJobsCount: number;
  error?: string;
}

// Function to ensure no mock jobs are ever displayed and only show recent jobs
function filterMockJobs(jobs: any[]): any[] {
  if (!jobs || jobs.length === 0) return [];
  
  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return jobs.filter((job: any) => {
    // If job doesn't exist or is missing critical data, filter it out
    if (!job || !job._id || !job.title || !job.company) return false;
    
    // Explicitly filter out TechCorp Solutions (known mock company)
    if (job.company === 'TechCorp Solutions') return false;
    
    // Filter out mock job IDs
    if (typeof job._id === 'string' && /^job\d+$/.test(job._id)) return false;
    
    // Filter jobs with example.com or mock URLs
    if (job.url && typeof job.url === 'string' && 
        /example\.com|placeholder|test|mock/.test(job.url)) return false;
    
    // Filter jobs with mock flags
    if (job.isMock || job.is_mock_data) return false;
    
    // Filter jobs with mock prefixes in title/company
    if ((job.title && job.title.startsWith('[MOCK]')) || 
        (job.company && job.company.startsWith('[MOCK]'))) return false;
    
    // Make sure job has required fields for display
    if (!job.postedDate) return false;
    
    // Filter out jobs older than 30 days
    const jobDate = new Date(job.postedDate || job.scrapedDate || job.createdAt);
    if (jobDate < thirtyDaysAgo) return false;
    
    // Filter out engineering and other irrelevant job types that don't match our focus
    if (job.title && typeof job.title === 'string') {
      const irrelevantJobPattern = /engineer|developer|software|coding|programming|devops|architect|frontend|backend|fullstack|tech lead|IT manager|sys admin|network admin|security/i;
      if (irrelevantJobPattern.test(job.title)) return false;
    }
    
    // Filter out irrelevant job categories if present
    if (job.jobCategory && typeof job.jobCategory === 'string') {
      const irrelevantCategoryPattern = /engineering|development|programming|IT|security|networking/i;
      if (irrelevantCategoryPattern.test(job.jobCategory)) return false;
    }
    
    // If it passes all checks, it's a real job
    return true;
  });
}

export const getServerSideProps = async () => {
  try {
    // Use environment variable for API URL, fallback to localhost for dev, production URL for prod
    const apiUrl = process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/jobs`
      : (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000/api/jobs'
        : 'https://clickclickjob.vercel.app/api/jobs');
    console.log('Fetching jobs from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'ClickClickJob/1.0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API Response structure:', Object.keys(result));
    
    // Extract jobs from the response, handling both array and object formats
    let jobs = [];
    if (Array.isArray(result)) {
      console.log('Result is an array with length:', result.length);
      jobs = result;
    } else if (result.jobs && Array.isArray(result.jobs)) {
      console.log('Result contains jobs array with length:', result.jobs.length);
      jobs = result.jobs;
    } else {
      console.warn('Unexpected API response format:', result);
      jobs = [];
    }
    
    // Filter out any mock jobs
    const validJobs = filterMockJobs(jobs.filter((job: any) => !isMockJob(job)));
    console.log(`Processed ${validJobs.length} valid jobs for display after filtering out mock data`);
    
    // Count jobs added in the past 7 days (changed from 14 to 7 days)
    const recentJobsCount = countRecentJobs(validJobs, 7);
    console.log(`Found ${recentJobsCount} jobs added in the past 7 days`);
    
    if (validJobs.length > 0) {
      console.log('First job sample:', {
        id: validJobs[0]._id,
        title: validJobs[0].title,
        company: validJobs[0].company,
        fields: Object.keys(validJobs[0])
      });
    }
    
    return {
      props: {
        featuredJobs: validJobs.slice(0, 50), // Increased from 15 to 50 jobs to create more internal links
        recentJobsCount
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        featuredJobs: [],
        recentJobsCount: 0,
        error: error instanceof Error ? error.message : 'Failed to load jobs'
      }
    };
  }
};

const HomePage: React.FC<HomePageProps> = ({ featuredJobs, recentJobsCount, error }) => {
  const router = useRouter();
  
  // Display error if present
  if (error) {
    console.error('Error loading jobs:', error);
  }
  
  // Log the number of jobs received for debugging
  console.log(`Rendering homepage with ${featuredJobs.length} featured jobs`);
  
  const filterChips = [
    { label: 'Entry-Level', value: 'entry-level' },
    { label: 'Part-Time', value: 'part-time' },
    { label: 'No Experience', value: 'no-experience' },
    { label: 'US Only', value: 'us-only' }
  ];

  const handleSearch = (query: string) => {
    router.push({
      pathname: '/jobs',
      query: { q: query }
    });
  };

  const handleFilterChange = (filters: string[]) => {
    router.push({
      pathname: '/jobs',
      query: { filters: filters.join(',') }
    });
  };

  return (
    <Layout
      title="Remote Admin Jobs Hiring Now | Entry Level Welcome | ClickClickJob"
      description="Remote administrative assistant and data entry jobs from verified employers. Entry-level positions available. No scams. Free daily job alerts."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Remote Admin Jobs Hiring Now
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Real opportunities updated daily. Entry-level positions available. No experience required jobs included. Always Free.
          </p>
          
          <div className="max-w-3xl mx-auto mt-8">
            <SearchBar 
              placeholder="Search for job titles, skills, or companies..."
              filterChips={filterChips}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">Featured Jobs</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              High-Quality Opportunities
            </span>
          </h2>
          
          {/* Add error message display if needed */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading jobs</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Show empty state if no jobs */}
          {featuredJobs.length === 0 && !error ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs available</h3>
              <p className="mt-2 text-sm text-gray-500">
                We're currently updating our job listings. Please check back soon.
              </p>
            </div>
          ) : (
            <>
              {/* First row of featured jobs (show first 6) */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={{
                      ...job,
                      _id: job._id || '', // Ensure _id is always a string
                      postedDate: job.postedDate || new Date() // Ensure postedDate exists
                    }} 
                    variant="compact" 
                  />
                ))}
              </div>

              {/* Email Capture Section - moved here */}
              <div className="mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                <div className="max-w-2xl mx-auto text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Want fresh jobs delivered to your inbox every Monday?
                  </h2>
                  <EmailCaptureForm
                    source="homepage"
                    variant="inline"
                    className="max-w-md mx-auto"
                  />
                </div>
              </div>
            </>
          )}

          {/* Recent Jobs Quick Links */}
          {featuredJobs && featuredJobs.length > 6 && (
            <div className="mt-10 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">More Recent Opportunities</h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {featuredJobs.slice(6, 30).map((job) => (
                  <div key={job._id} className="bg-white rounded-md p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                      <Link href={`/jobs/${job._id}`} className="hover:text-blue-600">
                        {job.title}
                      </Link>
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{job.company}</p>
                    {(job as any).salary && (
                      <p className="text-xs text-green-600 font-medium mt-1">{(job as any).salary}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/jobs"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View all recent jobs →
                </Link>
              </div>
            </div>
          )}

          {/* Recently Posted Jobs - Additional links for orphan pages */}
          {featuredJobs && featuredJobs.length > 30 && (
            <div className="mt-10 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Posted Jobs</h3>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                {featuredJobs.slice(30, 50).map((job) => (
                  <div key={job._id} className="bg-white rounded-md p-2 border border-gray-200 hover:border-blue-300 transition-colors">
                    <h4 className="text-xs font-medium text-gray-900 line-clamp-2">
                      <Link href={`/jobs/${job._id}`} className="hover:text-blue-600">
                        {job.title}
                      </Link>
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">{job.company}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/jobs"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Browse all job opportunities →
                </Link>
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link 
              href="/jobs"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse All Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Job Searches Section - NEW */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              🔥 Most Searched Remote Jobs
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our most popular job categories and specialized searches. Find exactly what you're looking for.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Top 3 - Featured */}
            <Link 
              href="/remote-jobs-near-me"
              className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-400 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white mb-2">
                    Most Popular
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                    Remote Jobs Near Me
                  </h3>
                  <p className="text-sm text-gray-600">
                    Find work-from-home opportunities in your area
                  </p>
                </div>
                <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link 
              href="/part-time-remote-admin-jobs"
              className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-400 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-white mb-2">
                    Trending
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600">
                    Part-Time Admin Jobs
                  </h3>
                  <p className="text-sm text-gray-600">
                    Flexible scheduling for work-life balance
                  </p>
                </div>
                <svg className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link 
              href="/work-from-home-administrative-jobs"
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 hover:shadow-lg hover:border-green-400 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white mb-2">
                    High Demand
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600">
                    Work from Home Admin
                  </h3>
                  <p className="text-sm text-gray-600">
                    100% remote administrative positions
                  </p>
                </div>
                <svg className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Rest of searches - Standard cards */}
            <Link 
              href="/data-processing-jobs-remote"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600">
                Data Processing Jobs
              </h3>
              <p className="text-sm text-gray-600">
                Entry-level friendly positions
              </p>
            </Link>

            <Link 
              href="/remote-medical-administrative-jobs"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600">
                Medical Admin Jobs
              </h3>
              <p className="text-sm text-gray-600">
                Healthcare administration roles
              </p>
            </Link>

            <Link 
              href="/remote-captioning-jobs"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600">
                Captioning Jobs
              </h3>
              <p className="text-sm text-gray-600">
                Transcription & media captioning
              </p>
            </Link>

            <Link 
              href="/remote-proofreading-jobs"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600">
                Proofreading Jobs
              </h3>
              <p className="text-sm text-gray-600">
                Editing & content review
              </p>
            </Link>

            <Link 
              href="/remote-school-administrative-jobs"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600">
                School Admin Jobs
              </h3>
              <p className="text-sm text-gray-600">
                K-12 & higher education roles
              </p>
            </Link>

            <Link 
              href="/usps-remote-jobs"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600">
                USPS Remote Jobs
              </h3>
              <p className="text-sm text-gray-600">
                Government & postal opportunities
              </p>
            </Link>

            <Link 
              href="/remote-admin-jobs-texas"
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-blue-600">
                Texas Remote Jobs 🤠
              </h3>
              <p className="text-sm text-gray-600">
                Admin positions for TX residents
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Browse Jobs by Category
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobCategories.map((category, index) => (
              <CategoryCard 
                key={index} 
                name={category.name}
                slug={category.slug}
              />
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <Link 
              href="/categories"
              className="inline-flex items-center px-6 py-3 border border-gray-300 bg-white text-base font-medium rounded-md shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse All Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Why Choose ClickClickJob
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Quality Listings</h3>
              <p className="text-gray-600">Listings filtered for relevance to admin and data entry roles</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Scams</h3>
              <p className="text-gray-600">We filter out suspicious listings to protect job seekers</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Regular Updates</h3>
              <p className="text-gray-600">New listings added as they become available</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Specialized Focus</h3>
              <p className="text-gray-600">Dedicated to admin and data entry remote positions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Remote Work Guide
            </h2>
            <Link 
              href="/resources/remote-work-guide"
              className="text-blue-600 hover:text-blue-800 font-medium hidden md:block"
            >
              Read our full guide →
            </Link>
          </div>
          
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How to find legitimate remote opportunities:</h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Research company reputation before applying</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Be wary of jobs requiring upfront payments</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Look for detailed job descriptions with clear requirements</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Verify company contact information and website</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Watch for unrealistic salary promises</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Check for secure application processes</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center md:hidden">
                <Link 
                  href="/resources/remote-work-guide"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Read our full guide →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Start Your Remote Career Today
          </h2>
          <p className="text-blue-100 mb-8 max-w-3xl mx-auto">
            Browse through our collection of administrative and data entry remote jobs, curated for remote workers seeking quality opportunities.
          </p>
          <Link 
            href="/jobs"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white"
          >
            Browse All Jobs
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage; 