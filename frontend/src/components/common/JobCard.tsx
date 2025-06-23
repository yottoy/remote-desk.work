import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { formatJobDescription } from '../../utils/jobUtils';

interface JobCardProps {
  job: {
    _id: string;
    title: string;
    company: string;
    location: string;
    postedDate: Date;
    description?: string;
    [key: string]: any; // Allow additional properties
  };
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
}

const JobCard: React.FC<JobCardProps> = React.memo(({ job, className = '', variant = 'default' }) => {
  // SAFETY: Never render TechCorp jobs or jobs with ID job1, etc.
  if (!job || 
      job.company === 'TechCorp Solutions' || 
      (job.company && job.company.includes('TechCorp')) ||
      job._id === 'job1' ||
      (typeof job._id === 'string' && /^job\d+$/.test(job._id))
  ) {
    return null; // Don't render anything for mock jobs
  }
  
  // Use explicit verified flag if available, otherwise use qualityScore as a fallback
  const isVerified = (job as any).verified || ((job as any).qualityScore && (job as any).qualityScore >= 8);
  
  // Prepare data attributes for CSS-based filtering as a last defense mechanism
  const dataAttributes = {
    'data-job-id': job._id,
    'data-company': job.company,
    'data-mock': job.isMock || job.is_mock_data || job._id === 'job1' || (typeof job._id === 'string' && /^job\d+$/.test(job._id)) || job.company === 'TechCorp Solutions' ? 'true' : 'false',
  };
  
  // Handle potential date formatting errors
  let timeAgo = '';
  try {
    // Ensure postedDate is a proper Date object
    const postedDate = job.postedDate instanceof Date ? 
      job.postedDate : 
      new Date(job.postedDate);
    
    if (isNaN(postedDate.getTime())) {
      // If date is invalid, fall back to a generic message
      timeAgo = 'recently';
    } else {
      timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });
    }
  } catch (error) {
    timeAgo = 'recently';
    console.error('Date formatting error:', error);
  }
  
  // Format salary to be more visible/prominent if available
  const formattedSalary = (job as any).salary ? (
    <span className="font-medium text-green-700 whitespace-nowrap">
      {(job as any).salary}
    </span>
  ) : null;
  
  // Extract a short description snippet if available, with cleaned formatting
  const getDescriptionSnippet = () => {
    let text = (job as any).descriptionText || job.description || '';
    if (!text) return '';
    
    // Strip HTML tags and markdown for snippet
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/\*(.*?)\*/g, '$1');
    text = text.replace(/\n+/g, ' ');
    text = text.trim();
    
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  };
  
  const descriptionSnippet = getDescriptionSnippet();
  
  if (variant === 'compact') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white min-h-[140px] flex flex-col" {...dataAttributes}>
        <div className="flex justify-between items-start">
          <div className="w-4/5">
            <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
              <Link href={`/jobs/${job._id}/`} className="hover:text-blue-600">
                {job.title}
              </Link>
            </h3>
            <p className="text-sm text-gray-600 line-clamp-1">{job.company}</p>
          </div>
          {isVerified && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
              <svg className="-ml-0.5 mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Verified
            </span>
          )}
        </div>
        {/* Ensure salary is visible in a separate line */}
        {formattedSalary && (
          <div className="mt-1 text-sm">
            {formattedSalary}
          </div>
        )}
        <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-2">
          <span className="line-clamp-1">{job.location}</span>
          <span className="whitespace-nowrap">• Posted {timeAgo}</span>
        </div>
      </div>
    );
  }
  
  if (variant === 'featured') {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow" {...dataAttributes}>
        <div className="border-l-4 border-blue-500 px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div className="mb-2 sm:mb-0 sm:w-4/5">
              <h3 className="text-xl font-medium text-gray-900 line-clamp-2">
                <Link href={`/jobs/${job._id}/`} className="hover:text-blue-600">
                  {job.title}
                </Link>
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{job.company}</p>
              {formattedSalary && (
                <p className="mt-1">{formattedSalary}</p>
              )}
            </div>
            {isVerified && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                <svg className="-ml-0.5 mr-1.5 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Verified
              </span>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
              <span className="inline-flex items-center">
                <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">{job.location}</span>
              </span>
              <span className="inline-flex items-center whitespace-nowrap">
                <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Posted {timeAgo}
              </span>
            </div>
          </div>
          {descriptionSnippet && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2 h-10">{descriptionSnippet}</p>
          )}
          <div className="mt-4">
            <Link
              href={`/jobs/${job._id}/`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Default variant
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white" {...dataAttributes}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
        <div className="mb-2 sm:mb-0 sm:w-4/5">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
            <Link href={`/jobs/${job._id}/`} className="hover:text-blue-600">
              {job.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{job.company}</p>
          {formattedSalary && (
            <p className="mt-1">{formattedSalary}</p>
          )}
        </div>
        {isVerified && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
            <svg className="-ml-0.5 mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            Verified
          </span>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-500">
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          <span className="line-clamp-1">{job.location}</span>
          {formattedSalary && (
            <span className="whitespace-nowrap">• {formattedSalary}</span>
          )}
          <span className="whitespace-nowrap">• Posted {timeAgo}</span>
        </div>
      </div>
      {descriptionSnippet && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2 h-10">{descriptionSnippet}</p>
      )}
      <div className="mt-4">
        <Link
          href={`/jobs/${job._id}/`}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Job
        </Link>
      </div>
    </div>
  );
});

export default JobCard; 