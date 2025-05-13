import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: {
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
  };
  variant?: 'default' | 'compact' | 'featured';
}

const JobCard: React.FC<JobCardProps> = ({ job, variant = 'default' }) => {
  const isVerified = job.qualityScore && job.qualityScore >= 8;
  const postedDate = new Date(job.postedDate);
  const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });
  
  // Extract a short description snippet if available
  const descriptionSnippet = job.descriptionText
    ? job.descriptionText.substring(0, 120) + (job.descriptionText.length > 120 ? '...' : '')
    : '';
  
  if (variant === 'compact') {
    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 line-clamp-1">
              <Link href={`/jobs/${job._id}`} className="hover:text-blue-600">
                {job.title}
              </Link>
            </h3>
            <p className="text-sm text-gray-600">{job.company}</p>
          </div>
          {isVerified && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Verified
            </span>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-2">
          <span>{job.location}</span>
          {job.salary && <span>• {job.salary}</span>}
          <span>• Posted {timeAgo}</span>
        </div>
      </div>
    );
  }
  
  if (variant === 'featured') {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow">
        <div className="border-l-4 border-blue-500 px-4 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-medium text-gray-900">
                <Link href={`/jobs/${job._id}`} className="hover:text-blue-600">
                  {job.title}
                </Link>
              </h3>
              <p className="text-base text-gray-700 mt-1">{job.company}</p>
            </div>
            {isVerified && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Verified
              </span>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
              <span className="inline-flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}
              </span>
              {job.salary && (
                <span className="inline-flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {job.salary}
                </span>
              )}
              <span className="inline-flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Posted {timeAgo}
              </span>
            </div>
          </div>
          {descriptionSnippet && (
            <p className="mt-3 text-sm text-gray-600 line-clamp-2">{descriptionSnippet}</p>
          )}
          <div className="mt-4">
            <Link
              href={`/jobs/${job._id}`}
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
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            <Link href={`/jobs/${job._id}`} className="hover:text-blue-600">
              {job.title}
            </Link>
          </h3>
          <p className="text-sm text-gray-600 mt-1">{job.company}</p>
        </div>
        {isVerified && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="-ml-0.5 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
              <path d="M10.28 4.305L4.989 9.594 1.695 6.3A1 1 0 00.28 7.712l3.708 3.709a1 1 0 001.414 0l6.3-6.3a1 1 0 00-1.42-1.415h-.001z" />
            </svg>
            Verified
          </span>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-500">
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
          <span>{job.location}</span>
          {job.salary && <span>• {job.salary}</span>}
          <span>• Posted {timeAgo}</span>
        </div>
      </div>
      {descriptionSnippet && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{descriptionSnippet}</p>
      )}
      <div className="mt-4">
        <Link
          href={`/jobs/${job._id}`}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Job
        </Link>
      </div>
    </div>
  );
};

export default JobCard; 