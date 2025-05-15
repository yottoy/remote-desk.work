import React, { useState } from 'react';
import JobCard from './JobCard';

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
}

const JobList: React.FC<JobListProps> = ({
  jobs,
  showFilters = true,
  title = 'Remote Admin & Data Entry Jobs',
  emptyMessage = 'No jobs match your criteria. Try adjusting your filters.'
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'relevance'>('newest');

  // Dynamic classes based on view mode
  const containerClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
    : 'space-y-4';

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header with filtering options */}
      {(title || showFilters) && (
        <div className="border-b border-gray-200 p-4 sm:px-6 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            {title && (
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
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
        {jobs.length > 0 ? (
          <div className={containerClasses}>
            {jobs.map((job) => (
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
          </div>
        )}
      </div>
    </div>
  );
};

export default JobList; 