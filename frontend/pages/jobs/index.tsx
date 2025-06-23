import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import SearchBar from '../../components/common/SearchBar';
import JobList from '../../components/common/JobList';
import AdvancedFilters from '../../components/common/AdvancedFilters';
import AdBanner from '../../components/ads/AdBanner';
import analytics from '../../utils/analytics';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import type { Job } from '../../types/job';
import { isVerified } from '../../types/job';

interface JobsPageProps {
  initialJobs: Job[];
  totalJobs: number;
  searchQuery?: string;
  initialFilters?: Record<string, string[]>;
  error?: string;
}

export const getServerSideProps: GetServerSideProps<JobsPageProps> = async (context) => {
  try {
    // Get search query and filters from URL
    const searchQuery = context.query.q as string | undefined;
    let filters: Record<string, string[]> = {};
    
    // Parse filters from query string if present
    if (context.query.filters && typeof context.query.filters === 'string') {
      const filterValues = context.query.filters.split(',');
      filters.keywords = filterValues;
    }
    
    // Parse individual filter categories if present
    const possibleFilters = ['jobCategory', 'jobType', 'experienceLevel', 'payRange', 'location', 'datePosted'];
    possibleFilters.forEach(filter => {
      if (context.query[filter] && typeof context.query[filter] === 'string') {
        filters[filter] = (context.query[filter] as string).split(',');
      }
    });

    // Direct production API URL to avoid URL construction issues
    const apiUrl = process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/?limit=100` 
      : 'https://www.clickclickjob.com/api/jobs/?limit=100';
    console.log('Fetching jobs from:', apiUrl);
    
    try {
      console.log('Making API request...');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'ClickClickJob/1.0',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error(`API request failed with status ${response.status}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API response structure:', Object.keys(data));
      
      // Handle different response formats
      let jobs = [];
      let total = 0;
      
      if (Array.isArray(data)) {
        console.log('API returned array of jobs with length:', data.length);
        jobs = data;
        total = data.length;
      } else if (data.jobs && Array.isArray(data.jobs)) {
        console.log('API returned jobs array with length:', data.jobs.length);
        console.log('First 3 jobs:', data.jobs.slice(0, 3).map((j: any) => `${j.title} at ${j.company}`));
        jobs = data.jobs;
        total = data.pagination?.totalJobs || jobs.length;
      } else {
        console.warn('Unexpected API response format:', data);
        // Try to extract any job-like objects from the response
        if (typeof data === 'object' && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
              console.log(`Found array in key: ${key} with length: ${value.length}`);
              if (value[0].title && value[0].company) {
                console.log(`Using ${key} as jobs array`);
                jobs = value;
                total = value.length;
              }
            }
          });
        }
      }
      
      console.log(`Processed ${jobs.length} jobs for jobs listing page`);
      
      // Return jobs (or empty array if no jobs found)
      return {
        props: {
          initialJobs: jobs,
          totalJobs: total,
          searchQuery: searchQuery || '',
          initialFilters: filters
        }
      };
    } catch (networkError) {
      console.error('Network error fetching jobs:', networkError);
      throw new Error('Network error fetching jobs. Please try again later.');
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialJobs: [],
        totalJobs: 0,
        searchQuery: '',
        initialFilters: {},
        error: error instanceof Error ? error.message : 'Failed to load jobs'
      }
    };
  }
};

interface CustomError extends Error {
  message: string;
}

const JobListingsPage: React.FC<JobsPageProps> = ({ 
  initialJobs, 
  totalJobs, 
  searchQuery = '',
  initialFilters = {},
  error = undefined
}) => {
  console.log('JobListingsPage received initialJobs:', initialJobs.length);
  console.log('First 3 initialJobs:', initialJobs.slice(0, 3).map((j: Job) => `${j.title} at ${j.company}`));
  
  const router = useRouter();
  
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [apiError, setApiError] = useState<Error | null>(null); // Don't show initial error
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(initialFilters);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'relevance'>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jobsPerPage, setJobsPerPage] = useState<number>(24);
  const [hasMoreJobs, setHasMoreJobs] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  
  // Create a stable job list title that won't be undefined
  const jobListTitle = `Remote Admin & Data Entry Jobs`;
  
  // Apply filters and search when dependencies change
  useEffect(() => {
    const applyFiltersAndSearch = async () => {
      console.log('Applying filters:', activeFilters);
      
      // Log all active filters to help with debugging
      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
          console.log(`Active filter ${key}:`, values.join(', '));
        }
      });
      
      // Skip client-side fetching if this is the initial render and we have enough jobs already
      // and we're not trying to apply any filters
      if (!searchQuery && 
          Object.values(activeFilters).every(values => !values || values.length === 0) && 
          initialJobs.length > 50 && 
          !isLoading) {
        console.log('Using server-provided initialJobs, skipping client-side fetch');
        // Sort initial jobs by verified status, quality score, and then date
        const sortedJobs = [...initialJobs].sort((a, b) => {
          // First sort by verified status
          const aVerified = isVerified(a);
          const bVerified = isVerified(b);
          
          if (aVerified && !bVerified) return -1;
          if (!aVerified && bVerified) return 1;
          
          // Then sort by qualityScore
          const aQuality = a.qualityScore || 0;
          const bQuality = b.qualityScore || 0;
          
          if (aQuality !== bQuality) return bQuality - aQuality;
          
          // Finally sort by date
          const aDate = new Date(a.postedDate).getTime();
          const bDate = new Date(b.postedDate).getTime();
          
          return bDate - aDate;
        });
        
        setFilteredJobs(sortedJobs);
        setJobs(sortedJobs);
        return;
      }

      // Always fetch from API when filters are active
      try {
        setIsLoading(true);
        
        // Use direct production API URL
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.clickclickjob.com';
        
        // Build query params
        const queryParams = new URLSearchParams();
        if (searchQuery) {
          queryParams.append('q', searchQuery);
        }
        
        // Add pagination parameters
        queryParams.append('page', currentPage.toString());
        queryParams.append('limit', jobsPerPage.toString());
        
        // Add all active filters as query parameters with better debugging
        if (Object.keys(activeFilters).length > 0) {
          Object.entries(activeFilters).forEach(([key, values]) => {
            if (values && values.length > 0) {
              console.log(`Adding filter ${key}:`, values);
              
              // For jobCategory, also add as 'category' parameter since API primarily looks for that
              if (key === 'jobCategory') {
                queryParams.append('category', values.join(','));
                console.log('Added as category parameter:', values.join(','));
              }
              
              // Always add with original key as well
              queryParams.append(key, values.join(','));
            }
          });
        }
        
        // Add sorting
        queryParams.append('sort', sortBy);
        
        // Fetch jobs from API
        const apiUrl = `${baseUrl}/api/jobs?${queryParams.toString()}`;
        console.log('Fetching jobs with filters from:', apiUrl);
        
        try {
          const response = await fetch(apiUrl, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'ClickClickJob/1.0',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            console.error(`API request failed with status ${response.status}`);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          const result = await response.json();
          console.log('Client-side API response structure:', Object.keys(result));
          
          // Extract jobs from the response, handling both array and object formats
          let fetchedJobs: Job[] = [];
          let totalJobsCount = 0;
          
          if (Array.isArray(result)) {
            console.log('API returned array of jobs with length:', result.length);
            fetchedJobs = result;
            totalJobsCount = result.length;
          } else if (result.jobs && Array.isArray(result.jobs)) {
            console.log('API returned jobs array with length:', result.jobs.length);
            console.log('First 3 fetched jobs:', result.jobs.slice(0, 3).map((j: any) => `${j.title} at ${j.company}`));
            fetchedJobs = result.jobs;
            
            // Get pagination data from the API response
            if (result.pagination) {
              totalJobsCount = result.pagination.totalJobs || fetchedJobs.length;
              const totalPages = result.pagination.totalPages || 1;
              setHasMoreJobs(currentPage < totalPages);
            } else {
              totalJobsCount = fetchedJobs.length;
              setHasMoreJobs(fetchedJobs.length >= jobsPerPage);
            }
          } else {
            console.warn('Unexpected API response format:', result);
            // Try to extract any job-like objects from the response
            if (typeof result === 'object' && result !== null) {
              Object.entries(result).forEach(([key, value]) => {
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                  console.log(`Found array in key: ${key} with length: ${value.length}`);
                  if (value[0].title && value[0].company) {
                    console.log(`Using ${key} as jobs array`);
                    fetchedJobs = value;
                  }
                }
              });
            }
          }
          
          // Set jobs based on whether we're loading more or doing a new search
          if (currentPage > 1 && isLoadingMore) {
            // Append new jobs to existing ones
            setFilteredJobs(prev => [...prev, ...fetchedJobs]);
            setJobs(prev => [...prev, ...fetchedJobs]);
          } else {
            // New search, replace all jobs
            setFilteredJobs(fetchedJobs);
            setJobs(fetchedJobs);
          }
          
          // Update the total jobs count
          setApiError(null);
          setIsLoadingMore(false);
        } catch (fetchError) {
          console.error('Error fetching from API:', fetchError);
          
          // Use initial jobs as fallback if they exist, otherwise show empty state
          if (initialJobs.length > 0) {
            console.log(`Using ${initialJobs.length} initialJobs as fallback instead of showing error`);
            setFilteredJobs(initialJobs);
            setJobs(initialJobs);
          } else {
            console.log('No jobs available to display');
            setFilteredJobs([]);
            setJobs([]);
          }
          
          // Don't set the error so we don't show the error message
          setApiError(null);
        }
      } catch (err) {
        console.error('Unexpected error in job fetching:', err);
        
        // Always prefer initialJobs if available
        if (initialJobs.length > 0) {
          console.log(`Using ${initialJobs.length} initialJobs as fallback`);
          setFilteredJobs(initialJobs);
          setJobs(initialJobs);
        } else {
          console.log('No jobs available to display');
          setFilteredJobs([]);
          setJobs([]);
        }
        
        setApiError(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    applyFiltersAndSearch();
  }, [searchQuery, activeFilters, sortBy, currentPage, jobsPerPage]);
  
  // Handle filter changes
  const handleFilterChange = (filterType: string, values: string[]) => {
    console.log(`Filter changed: ${filterType}`, values);
    
    // Reset pagination when filters change
    setCurrentPage(1);
    setHasMoreJobs(true);
    
    // Update the active filters state
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
    
    // Update URL to reflect the new filters
    const newQuery = {
      ...router.query,
      [filterType]: values.length > 0 ? values.join(',') : undefined
    };
    
    // Remove empty filter params
    Object.keys(newQuery).forEach(key => {
      if (newQuery[key] === undefined || newQuery[key] === '') {
        delete newQuery[key];
      }
    });
    
    // Use shallow routing to avoid full page reload
    router.push({
      pathname: router.pathname,
      query: newQuery
    }, undefined, { shallow: true });
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    if (query !== searchQuery) {
      // Reset pagination when search query changes
      setCurrentPage(1);
      setHasMoreJobs(true);
      
      router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          q: query || undefined
        }
      });
    }
  };
  
  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce(
      (count, filters) => count + (filters ? filters.length : 0),
      0
    );
  };

  // Generate meta title and description based on filters/search
  const pageTitle = searchQuery 
    ? `${searchQuery} Remote Jobs | ClickClickJob.com` 
    : "Remote Admin & Data Entry Jobs | ClickClickJob.com";
    
  const pageDescription = searchQuery 
    ? `Browse ${filteredJobs.length} remote ${searchQuery} jobs. Work from home opportunities updated daily.` 
    : "Find verified remote data entry & administrative jobs. Work from home opportunities updated daily.";

  // Function to load more jobs
  const loadMoreJobs = () => {
    setIsLoadingMore(true);
    setCurrentPage(prevPage => prevPage + 1);
  };

  return (
    <Layout 
      title={pageTitle}
      description={pageDescription}
    >
      <ErrorBoundary>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{jobListTitle}</h1>
          
          <div className="mb-6">
            <SearchBar
              defaultValue={searchQuery}
              onSearch={handleSearch}
              placeholder="Search admin & data entry jobs..."
            />
          </div>
          
          {/* Fixed height container to prevent layout shifts */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ minHeight: '800px' }}>
            {/* Sidebar filters - Desktop */}
            <div className="hidden lg:block lg:col-span-1">
              <AdvancedFilters
                onFilterChange={handleFilterChange}
                selectedFilters={activeFilters}
              />
            </div>
            
            {/* Main content area */}
            <div className="lg:col-span-3">
              {/* Mobile filter button */}
              <div className="lg:hidden mb-4">
                <button
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsMobileFiltersOpen(true)}
                >
                  <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                  Filter Jobs
                </button>
              </div>
              
              {/* Top ad banner - fixed height */}
              <div className="mb-6" style={{ height: '90px', overflow: 'hidden' }}>
                <AdBanner 
                  adSlotId="1234567890" 
                  adFormat="horizontal"
                />
              </div>
              
              {/* Job listings with proper error handling */}
              <ErrorBoundary>
                <JobList 
                  jobs={filteredJobs.map(job => ({
                    ...job,
                    _id: job._id || '',
                    postedDate: job.postedDate || new Date()
                  }))}
                  title={jobListTitle}
                  isLoading={isLoading}
                  error={apiError}
                  onLoadMore={loadMoreJobs}
                  hasMore={hasMoreJobs}
                  isLoadingMore={isLoadingMore}
                  totalJobs={totalJobs}
                />
              </ErrorBoundary>
              
              {/* Bottom ad banner - fixed height */}
              <div className="mt-6" style={{ height: '250px', overflow: 'hidden' }}>
                <AdBanner 
                  adSlotId="0987654321" 
                  adFormat="rectangle"
                />
              </div>
            </div>
          </div>
          
          {/* Mobile filters drawer */}
          {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-40 flex lg:hidden">
              <div className="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" onClick={() => setIsMobileFiltersOpen(false)}></div>
              <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl">
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                  <button
                    type="button"
                    className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400"
                    onClick={() => setIsMobileFiltersOpen(false)}
                  >
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4 px-4">
                  <AdvancedFilters
                    onFilterChange={handleFilterChange}
                    selectedFilters={activeFilters}
                    mobileView={true}
                  />
                  
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      className="text-sm text-gray-500 hover:text-gray-700"
                      onClick={() => {
                        // Clear all filters and close
                        Object.keys(activeFilters).forEach(key => {
                          handleFilterChange(key, []);
                        });
                        setIsMobileFiltersOpen(false);
                      }}
                    >
                      Clear All
                    </button>
                    <button
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsMobileFiltersOpen(false)}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </Layout>
  );
};

export default JobListingsPage; 