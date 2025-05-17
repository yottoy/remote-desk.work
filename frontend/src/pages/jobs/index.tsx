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

    // Get the absolute URL base
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL || 
      (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3002'
        : `https://${context.req.headers.host}`);
    
    // Fetch jobs from API
    const queryParams = new URLSearchParams();
    if (searchQuery) {
      queryParams.append('search', searchQuery);
    }
    if (Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, values]) => {
        queryParams.append(key, values.join(','));
      });
    }
    
    const apiUrl = `${baseUrl}/api/jobs?${queryParams.toString()}`;
    console.log('Fetching jobs from:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ClickClickJob/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      const jobs = result.jobs || [];
      const total = result.pagination?.totalJobs || jobs.length;
      
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
  const router = useRouter();
  
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<Error | null>(error ? new Error(error) : null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(initialFilters);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'relevance'>('newest');
  
  // Apply filters and search when dependencies change
  useEffect(() => {
    const applyFiltersAndSearch = async () => {
      try {
        setIsLoading(true);
        
        // Get the absolute URL base
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || (
          process.env.NODE_ENV === 'development' 
            ? 'http://localhost:3002'
            : window.location.origin
        );
        
        // Build query params
        const queryParams = new URLSearchParams();
        if (searchQuery) {
          queryParams.append('q', searchQuery);
        }
        if (Object.keys(activeFilters).length > 0) {
          Object.entries(activeFilters).forEach(([key, values]) => {
            if (values.length > 0) {
              queryParams.append(key, values.join(','));
            }
          });
        }
        
        // Add sorting
        queryParams.append('sort', sortBy);
        
        // Fetch jobs from API
        console.log('Fetching jobs from:', `${baseUrl}/api/jobs?${queryParams.toString()}`);
        const response = await fetch(`${baseUrl}/api/jobs?${queryParams.toString()}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ClickClickJob/1.0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const result = await response.json();
        
        // Track search/filter analytics
        if (searchQuery || Object.keys(activeFilters).length > 0) {
          if (searchQuery) {
            analytics.trackSearch({
              query: searchQuery,
              resultCount: result.length,
              filters: activeFilters
            });
          }
          
          if (Object.keys(activeFilters).length > 0) {
            Object.entries(activeFilters).forEach(([filterType, values]) => {
              if (values.length > 0) {
                analytics.trackFilterUsage({
                  filterType,
                  values,
                  resultCount: result.length,
                  searchQuery
                });
              }
            });
          }
        }
        
        setFilteredJobs(result);
        setJobs(result);
        setApiError(null);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setApiError(err instanceof Error ? err : new Error('Failed to load jobs'));
      } finally {
        setIsLoading(false);
      }
    };
    
    applyFiltersAndSearch();
  }, [searchQuery, activeFilters, sortBy]);
  
  // Handle filter changes
  const handleFilterChange = (filterType: string, values: string[]) => {
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
    
    router.push({
      pathname: router.pathname,
      query: newQuery
    }, undefined, { shallow: true });
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    if (query !== searchQuery) {
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

  return (
    <Layout 
      title={pageTitle}
      description={pageDescription}
    >
      <ErrorBoundary>
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Top ad banner */}
            <div className="mb-6">
              <AdBanner 
                adSlotId="1234567890" 
                adFormat="leaderboard" 
                className="mx-auto"
              />
            </div>
            
            {/* Search bar */}
            <div className="mb-6">
              <SearchBar 
                placeholder="Search for remote admin and data entry jobs..."
                defaultValue={searchQuery}
                onSearch={handleSearch}
                className="max-w-4xl mx-auto"
              />
            </div>
            
            {/* Main content */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Filters sidebar */}
              <div className="w-full md:w-64 flex-shrink-0">
                {/* Mobile filter button */}
                <div className="md:hidden mb-4">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    Filters
                    {getActiveFilterCount() > 0 && (
                      <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full px-2 py-0.5">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </button>
                </div>
                
                {/* Desktop filters */}
                <div className="hidden md:block">
                  <AdvancedFilters 
                    onFilterChange={handleFilterChange}
                    selectedFilters={activeFilters}
                    showCounts={true}
                  />
                </div>
                
                {/* Mobile filters (toggle) */}
                <div className="md:hidden">
                  {isMobileFiltersOpen && (
                    <AdvancedFilters 
                      onFilterChange={handleFilterChange}
                      selectedFilters={activeFilters}
                      showCounts={true}
                      mobileView={true}
                    />
                  )}
                </div>
                
                {/* Side ad */}
                <div className="hidden md:block mt-6">
                  <AdBanner 
                    adSlotId="9876543210" 
                    adFormat="mediumRectangle"
                  />
                </div>
              </div>
              
              {/* Job listings */}
              <div className="flex-1">
                <JobList 
                  jobs={filteredJobs} 
                  title={`${filteredJobs.length} Remote Admin & Data Entry Jobs`}
                  isLoading={isLoading}
                  error={apiError}
                />
                
                {/* Between listings ad */}
                {filteredJobs.length > 3 && (
                  <div className="my-6">
                    <AdBanner 
                      adSlotId="5555555555" 
                      adFormat="leaderboard"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </Layout>
  );
};

export default JobListingsPage; 