import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import ImprovedJobCard from '../components/common/ImprovedJobCard';
import { EnhancedJobListing } from '../types/job';

export default function Custom404() {
  const [recentJobs, setRecentJobs] = useState<EnhancedJobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent jobs client-side
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs?limit=6');
        if (response.ok) {
          const data = await response.json();
          const jobs = Array.isArray(data) ? data : data.jobs || [];
          setRecentJobs(jobs.slice(0, 6));
        }
      } catch (error) {
        console.error('Error fetching jobs for 404 page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);
  return (
    <Layout
      title="Job Not Available | ClickClickJob.com"
      description="The job you are looking for is no longer available. Browse similar remote opportunities."
    >
      <div className="min-h-[70vh] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Looks like the job you were looking for isn't available anymore
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The position may have been filled or the listing has expired. 
              Check out these other relevant opportunities below.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/jobs"
                className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse all jobs
              </Link>
              
              <Link
                href="/"
                className="px-6 py-3 bg-white text-blue-600 border border-blue-300 rounded-md font-medium shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go back home
              </Link>
            </div>
          </div>

          {/* Similar Jobs Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Here are other relevant jobs
            </h2>
            
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : recentJobs && recentJobs.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recentJobs.map((job) => (
                    <ImprovedJobCard 
                      key={job._id} 
                      job={job}
                      variant="compact" 
                    />
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <Link 
                    href="/jobs"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View All Jobs
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="mt-4 text-gray-600">No jobs available at the moment</p>
                <div className="mt-6">
                  <Link 
                    href="/jobs"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Browse All Jobs
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Popular Categories Section */}
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              Browse by Category
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                href="/categories/data-entry" 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all text-center group"
              >
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600">Data Entry</h4>
                <p className="text-sm text-gray-500 mt-1">Remote positions</p>
              </Link>
              
              <Link 
                href="/categories/administrative" 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all text-center group"
              >
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600">Administrative</h4>
                <p className="text-sm text-gray-500 mt-1">Admin roles</p>
              </Link>
              
              <Link 
                href="/categories/customer-service" 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all text-center group"
              >
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600">Customer Service</h4>
                <p className="text-sm text-gray-500 mt-1">Support positions</p>
              </Link>
              
              <Link 
                href="/categories/virtual-assistant" 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all text-center group"
              >
                <h4 className="font-medium text-gray-900 group-hover:text-blue-600">Virtual Assistant</h4>
                <p className="text-sm text-gray-500 mt-1">VA opportunities</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 