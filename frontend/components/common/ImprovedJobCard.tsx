import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { formatJobDescription } from '../../src/utils/jobUtils';

interface JobCardProps {
  job: {
    _id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    postedDate: Date | string;
    qualityScore?: number;
    featured?: boolean;
    description?: string;
    descriptionText?: string;
    verified?: boolean;
    isMock?: boolean;
    is_mock_data?: boolean;
    jobType?: string;
    skills?: string[];
    applyUrl?: string;
  };
  variant?: 'default' | 'compact' | 'featured' | 'keyword';
  keyword?: string;
}

const ImprovedJobCard: React.FC<JobCardProps> = ({ job, variant = 'default', keyword }) => {
  // Skip rendering mock jobs on production
  if (process.env.NODE_ENV === 'production' &&
      (job.company === 'TechCorp Solutions' || 
      (job.company && job.company.includes('TechCorp')) ||
      job._id === 'job1' ||
      (typeof job._id === 'string' && /^job\d+$/.test(job._id)))
  ) {
    return null;
  }
  
  // Use explicit verified flag if available, otherwise use qualityScore as a fallback
  const isVerified = job.verified || (job.qualityScore && job.qualityScore >= 0.8);
  
  // Handle potential date formatting errors
  let timeAgo = '';
  try {
    // Convert string dates to Date objects if needed
    const postedDate = typeof job.postedDate === 'string' 
      ? new Date(job.postedDate)
      : job.postedDate;
    
    if (isNaN(postedDate.getTime())) {
      timeAgo = 'recently';
    } else {
      timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });
    }
  } catch (error) {
    timeAgo = 'recently';
    console.error('Date formatting error:', error);
  }
  
  // Format salary if available
  const formattedSalary = job.salary ? (
    <span className="font-medium text-green-700 whitespace-nowrap">
      {job.salary}
    </span>
  ) : null;
  
  // Extract a short description snippet with cleaned formatting
  const getDescriptionSnippet = () => {
    let text = job.descriptionText || job.description || '';
    if (!text) return '';
    
    // Strip HTML tags and markdown for snippet
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/\*(.*?)\*/g, '$1');
    text = text.replace(/\n+/g, ' ');
    text = text.trim();
    
    return text.length > 140 ? text.substring(0, 140) + '...' : text;
  };
  
  const descriptionSnippet = getDescriptionSnippet();
  
  // Get job link - handle both keyword pages and regular job pages
  const getJobLink = () => {
    if (keyword) {
      return job.applyUrl || `#job-${job._id}`;
    }
    return `/jobs/${job._id}/`;
  };
  
  // For compact cards (e.g. in a grid)
  if (variant === 'compact') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white h-full flex flex-col">
        <div className="flex justify-between items-start">
          <div className="w-4/5">
            <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
              <Link href={getJobLink()} className="hover:text-blue-600">
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
        
        {formattedSalary && (
          <div className="mt-1 text-sm">
            {formattedSalary}
          </div>
        )}
        
        <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-2">
          <span className="line-clamp-1">{job.location}</span>
          <span className="whitespace-nowrap">• Posted {timeAgo}</span>
        </div>
        
        {/* Push button to bottom of card */}
        <div className="mt-auto pt-4">
          <Link
            href={getJobLink()}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none"
          >
            View Details
          </Link>
        </div>
      </div>
    );
  }
  
  // For featured cards (with border highlight)
  if (variant === 'featured') {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow">
        <div className="border-l-4 border-blue-500 p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div className="mb-2 sm:mb-0 sm:w-4/5">
              <h3 className="text-xl font-medium text-gray-900 line-clamp-2">
                <Link href={getJobLink()} className="hover:text-blue-600">
                  {job.title}
                </Link>
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">{job.company}</p>
              {formattedSalary && <p className="mt-1">{formattedSalary}</p>}
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
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">{descriptionSnippet}</p>
          )}
          
          {/* Fixed height container for buttons */}
          <div className="mt-4 flex">
            <Link
              href={getJobLink()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // For keyword pages - enhanced card with skills
  if (variant === 'keyword') {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {job.featured && (
          <div className="bg-blue-500 text-white text-xs font-bold uppercase tracking-wide py-1 px-2 text-center">
            Featured Opportunity
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-medium text-gray-900 mb-1">{job.title}</h3>
              <p className="text-gray-600 mb-2">{job.company}</p>
              <div className="flex flex-wrap items-center text-sm text-gray-500 mb-4">
                <span className="mr-4 flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location}
                </span>
                {job.jobType && (
                  <span className="mr-4 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {job.jobType}
                  </span>
                )}
                {job.salary && (
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {job.salary}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {timeAgo}
              </span>
            </div>
          </div>
          
          <p className="text-gray-700 mb-4">{descriptionSnippet}</p>
          
          {job.skills && job.skills.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Fixed height button area */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {isVerified ? (
                <span className="inline-flex items-center text-green-800">
                  <svg className="h-4 w-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Verified Employer
                </span>
              ) : 'Posted: ' + timeAgo}
            </span>
            
            <a 
              href={getJobLink()} 
              target={job.applyUrl ? "_blank" : undefined} 
              rel={job.applyUrl ? "noopener noreferrer" : undefined}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Apply Now
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Default variant - fixed the whitespace issue
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
        <div className="mb-2 sm:mb-0 sm:w-4/5">
          <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
            <Link href={getJobLink()} className="hover:text-blue-600">
              {job.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{job.company}</p>
          {formattedSalary && <p className="mt-1">{formattedSalary}</p>}
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
          {job.jobType && <span className="whitespace-nowrap">• {job.jobType}</span>}
          <span className="whitespace-nowrap">• Posted {timeAgo}</span>
        </div>
      </div>
      
      {descriptionSnippet && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{descriptionSnippet}</p>
      )}
      
      {/* No fixed height, only margin-top to ensure proper spacing */}
      <div className="mt-4 flex">
        <Link
          href={getJobLink()}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none"
        >
          View Details
        </Link>
        
        {job.applyUrl && (
          <a 
            href={job.applyUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            Apply Now
          </a>
        )}
      </div>
    </div>
  );
};

export default ImprovedJobCard;
