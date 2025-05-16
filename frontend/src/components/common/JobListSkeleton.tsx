import React from 'react';
import JobCardSkeleton from './JobCardSkeleton';

interface JobListSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
  showHeader?: boolean;
}

const JobListSkeleton: React.FC<JobListSkeletonProps> = ({
  count = 6,
  viewMode = 'grid',
  showHeader = true
}) => {
  // Generate an array of specified count
  const skeletons = Array.from({ length: count }, (_, i) => i);
  
  // Dynamic classes based on view mode
  const containerClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
    : 'space-y-4';

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header with filtering options */}
      {showHeader && (
        <div className="border-b border-gray-200 p-4 sm:px-6 sm:py-5 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="mt-3 sm:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 rounded w-10"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Job listings skeletons */}
      <div className="p-4 sm:p-6">
        <div className={containerClasses}>
          {skeletons.map((index) => (
            <JobCardSkeleton 
              key={index} 
              variant={viewMode === 'list' ? 'default' : 'compact'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default JobListSkeleton; 