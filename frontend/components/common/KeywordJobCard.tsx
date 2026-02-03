import React, { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { EnhancedJobListing } from '../../types/job';
import JobApplicationModal from './JobApplicationModal';
import TimezoneCompatibility from './TimezoneCompatibility';
import CurrencyDisplay from './CurrencyDisplay';
import RegionalJobTitle from './RegionalJobTitle';
import { keywordTracking } from './KeywordAnalytics';
import { formatJobDescription } from '../../utils/jobUtils';

interface KeywordJobCardProps {
  job: EnhancedJobListing;
  keyword: string;
}

const KeywordJobCard: React.FC<KeywordJobCardProps> = ({ job, keyword }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Use explicit verified flag if available, otherwise use qualityScore as a fallback
  const isVerified = job.verified || (job.qualityScore && job.qualityScore >= 8);
  
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
  const formattedSalary = job.salary ? (
    <span className="font-medium text-green-700 whitespace-nowrap">
      <CurrencyDisplay 
        amount={job.salary} 
        currency="USD" 
        period="hour" 
      />
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
    
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  };
  
  const descriptionSnippet = getDescriptionSnippet();
    
  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Track application click
    keywordTracking.trackJobApplication(keyword, job._id, job.title);
    setIsModalOpen(true);
  };

  return (
    <>
      <div 
        className="job-card border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
        data-testid="job-card"
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="md:w-3/4">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-700">
                <Link href={`/jobs/view/${job._id}`} className="hover:text-blue-600">
                  <RegionalJobTitle baseTitle={job.title} showVariation={true} />
                </Link>
              </h2>
              {isVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                  <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">{job.company}</span>
              {job.location && <span> • {job.location}</span>}
            </div>
            
            {formattedSalary && (
              <div className="text-sm mb-2">
                {formattedSalary}
                {job.jobType && <span className="text-gray-600 ml-2">{job.jobType}</span>}
              </div>
            )}
            
            <div className="text-sm text-gray-500 mb-4">
              Posted {timeAgo} • {job.experienceLevel || 'All levels'}
            </div>
            
            <div className="text-sm text-gray-700 mb-4">
              {descriptionSnippet || 'No description available.'}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {job.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {job.category}
                </span>
              )}
              {job.timezone && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {job.timezone}
                </span>
              )}
              {job.experienceLevel === 'no-experience' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  No Experience Required
                </span>
              )}
            </div>
          </div>
          
          <div className="md:w-1/4 flex flex-col items-start md:items-end">
            <button
              onClick={handleApplyClick}
              className="w-full md:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label={`Apply for ${job.title} at ${job.company}`}
            >
              Apply Now
            </button>
            
            <Link 
              href={`/jobs/view/${job._id}`}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Details
            </Link>
            
            <div className="mt-4 w-full">
              <TimezoneCompatibility jobTimezone={job.timezone} />
            </div>
          </div>
        </div>
      </div>
      
      <JobApplicationModal
        job={job}
        keyword={keyword}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default KeywordJobCard;
