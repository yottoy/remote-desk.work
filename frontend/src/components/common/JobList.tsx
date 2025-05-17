import React, { useState } from 'react';
import JobCard from './JobCard';
import ErrorBoundary from './ErrorBoundary';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  postedDate: Date;
  qualityScore?: number;
  featured?: boolean;
  description?: string;
  descriptionText?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[];
  applicationLink?: string;
}

interface JobListProps {
  jobs: Job[];
  showFilters?: boolean;
  title?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  error?: Error | null;
}

const JobList: React.FC<JobListProps> = ({
  jobs,
  showFilters = true,
  title = 'Available Remote Jobs',
  emptyMessage = 'No jobs match your criteria. Try adjusting your filters.',
  isLoading = false,
  error = null
}) => {
  // Default view mode is 'list' to ensure salary is clearly visible
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'newest' | 'relevance'>('newest');
  
  // Make sure jobs is always an array even if we receive null/undefined
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  // Dynamic classes based on view mode
  const containerClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
    : 'space-y-4';

  // Format the title properly, ensuring no undefined values
  const formattedTitle = title.replace('undefined', '');

  // If there's an error, show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center py-12">
          <svg 
            className="mx-auto h-12 w-12 text-red-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-900">Error loading jobs</p>
          <p className="mt-2 text-sm text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header with filtering options */}
        {(formattedTitle || showFilters) && (
          <div className="border-b border-gray-200 p-4 sm:px-6 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {formattedTitle && (
                <h2 className="text-xl font-semibold text-gray-800">{formattedTitle}</h2>
              )}
              
              {showFilters && (
                <div className="mt-3 sm:mt-0 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="sort-by" className="text-sm text-gray-500">
                      Sort by:
                    </label>
                    <select
                      id="sort-by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'relevance')}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    >
                      <option value="newest">Newest</option>
                      <option value="relevance">Relevance</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">View:</span>
                    <div className="flex items-center rounded-md shadow-sm border border-gray-300 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        disabled={isLoading}
                        className={`px-3 py-1.5 text-sm ${
                          viewMode === 'grid'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        disabled={isLoading}
                        className={`px-3 py-1.5 text-sm ${
                          viewMode === 'list'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Job listings */}
        <div className="p-4 sm:p-6">
          {isLoading ? (
            // Show skeleton loading state
            <div className={containerClasses}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="w-3/4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="mt-3">
                    <div className="flex space-x-2 mt-1">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="mt-3 h-20 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : safeJobs && safeJobs.length > 0 ? (
            <div className={containerClasses}>
              {safeJobs.map((job) => (
                <JobCard 
                  key={job._id} 
                  job={job} 
                  variant={viewMode === 'list' ? 'default' : 'compact'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                />
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-600">{emptyMessage}</p>
              <p className="mt-2 text-sm text-gray-500">Try refreshing the page or checking back later.</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default JobList; 