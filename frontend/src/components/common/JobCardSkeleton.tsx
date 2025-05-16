import React from 'react';

interface JobCardSkeletonProps {
  variant?: 'default' | 'compact' | 'featured';
}

const JobCardSkeleton: React.FC<JobCardSkeletonProps> = ({ variant = 'default' }) => {
  if (variant === 'compact') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-[140px] flex flex-col animate-pulse">
        <div className="flex justify-between items-start">
          <div className="w-4/5">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/4"></div>
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }
  
  if (variant === 'featured') {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white animate-pulse">
        <div className="border-l-4 border-blue-200 px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div className="mb-2 sm:mb-0 sm:w-4/5">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="mt-4">
            <div className="flex flex-wrap gap-4 mt-1">
              <div className="h-4 bg-gray-200 rounded w-32 flex-shrink-0"></div>
              <div className="h-4 bg-gray-200 rounded w-24 flex-shrink-0"></div>
              <div className="h-4 bg-gray-200 rounded w-36 flex-shrink-0"></div>
            </div>
          </div>
          <div className="mt-4 h-10 bg-gray-200 rounded w-full"></div>
          <div className="mt-4">
            <div className="h-9 bg-gray-200 rounded w-28"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Default variant
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white animate-pulse">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
        <div className="mb-2 sm:mb-0 sm:w-4/5">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
      </div>
      <div className="mt-3">
        <div className="flex flex-wrap gap-4 mt-1">
          <div className="h-4 bg-gray-200 rounded w-24 flex-shrink-0"></div>
          <div className="h-4 bg-gray-200 rounded w-16 flex-shrink-0"></div>
          <div className="h-4 bg-gray-200 rounded w-32 flex-shrink-0"></div>
        </div>
      </div>
      <div className="mt-3 h-8 bg-gray-200 rounded w-full"></div>
      <div className="mt-4">
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
};

export default JobCardSkeleton; 