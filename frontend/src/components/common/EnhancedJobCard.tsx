import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
  requirements?: string[];
  softwareRequirements?: string[];
  timezone?: string;
  applicationLink?: string;
  jobCategory?: string;
  isMock?: boolean;
  is_mock_data?: boolean;
}

interface EnhancedJobCardProps {
  job: Job;
  showDetails?: boolean;
}

const EnhancedJobCard: React.FC<EnhancedJobCardProps> = ({ 
  job, 
  showDetails = false 
}) => {
  // SAFETY: Never render TechCorp jobs or jobs with ID job1, etc.
  if (!job || 
      job.company === 'TechCorp Solutions' || 
      (job.company && job.company.includes('TechCorp')) ||
      job._id === 'job1' ||
      (typeof job._id === 'string' && /^job\d+$/.test(job._id))
  ) {
    return null; // Don't render anything for mock jobs
  }

  const isVerified = job.qualityScore && job.qualityScore >= 8;
  const postedDate = new Date(job.postedDate);
  const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });
  
  // Generate job type badges from job data rather than inferring from title
  const jobTypeBadges = [];
  
  // Use explicit job category if available
  if (job.jobCategory) {
    jobTypeBadges.push(job.jobCategory);
  } 
  // Only fallback to title-based inference if no explicit category
  else {
    const title = job.title.toLowerCase();
    if (title.includes('data entry') || title.includes('data processing')) {
      jobTypeBadges.push('Data Entry');
    }
    if (title.includes('admin') || title.includes('assistant') || title.includes('coordinator')) {
      jobTypeBadges.push('Administrative');
    }
  }
  
  // Add employment type badges from actual data
  if (job.jobType === 'full-time') jobTypeBadges.push('Full-time');
  if (job.jobType === 'part-time') jobTypeBadges.push('Part-time');
  if (job.jobType === 'contract') jobTypeBadges.push('Contract');
  if (job.experienceLevel === 'no-experience') jobTypeBadges.push('No Experience');
  if (job.experienceLevel === 'entry-level') jobTypeBadges.push('Entry Level');

  // Extract a short description snippet
  const descriptionSnippet = job.descriptionText
    ? job.descriptionText.substring(0, 150) + (job.descriptionText.length > 150 ? '...' : '')
    : '';

  // Check if application link is valid or use job details page instead
  const getApplicationLink = () => {
    // If we have a valid application link that's external, use it
    if (job.applicationLink && 
        (job.applicationLink.startsWith('http://') || 
         job.applicationLink.startsWith('https://'))) {
      return job.applicationLink;
    }
    
    // Otherwise fallback to the job details page
    return `/jobs/${job._id}`;
  };

  // For job detail links, ensure we have a valid ID
  const getJobDetailLink = () => {
    if (job._id && typeof job._id === 'string' && job._id.length > 0) {
      return `/jobs/${job._id}`;
    }
    // If no valid ID, fallback to jobs listing
    return '/jobs';
  };

  const jobDetailLink = getJobDetailLink();
  const applicationLink = getApplicationLink();

  // Prepare data attributes for CSS-based filtering as a last defense mechanism
  const dataAttributes = {
    'data-job-id': job._id,
    'data-company': job.company,
    'data-mock': job.isMock || job.is_mock_data || job._id === 'job1' || (typeof job._id === 'string' && /^job\d+$/.test(job._id)) || job.company === 'TechCorp Solutions' ? 'true' : 'false',
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow" {...dataAttributes}>
      {/* Card Header - Job Title, Company, Verification Badge */}
      <div className={`px-4 py-3 ${job.featured ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
              <Link href={jobDetailLink}>
                {job.title}
              </Link>
            </h3>
            <p className="text-sm text-gray-600 mt-1">{job.company}</p>
          </div>
          
          {isVerified && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
              High Quality
            </span>
          )}
        </div>
        
        {/* Job Type Badges */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {jobTypeBadges.map((badge, index) => (
            <span 
              key={index} 
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
      
      {/* Job Details */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center text-gray-500">
            <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{job.location}</span>
          </div>
          
          {job.salary && (
            <div className="flex items-center text-gray-500">
              <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{job.salary}</span>
            </div>
          )}
          
          <div className="flex items-center text-gray-500">
            <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Posted {timeAgo}</span>
          </div>
          
          {job.timezone && (
            <div className="flex items-center text-gray-500">
              <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{job.timezone}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Description */}
      {descriptionSnippet && (
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">{descriptionSnippet}</p>
        </div>
      )}
      
      {/* Extra Details Section (shown conditionally) */}
      {showDetails && (
        <div className="px-4 py-3 border-t border-gray-100">
          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Software Requirements */}
          {job.softwareRequirements && job.softwareRequirements.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Software</h4>
              <div className="flex flex-wrap gap-1.5">
                {job.softwareRequirements.map((software, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs"
                  >
                    {software}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Call to Action */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <Link 
            href={jobDetailLink}
            className="inline-flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View Details
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          
          <Link
            href={applicationLink}
            target={applicationLink !== jobDetailLink ? "_blank" : undefined}
            rel={applicationLink !== jobDetailLink ? "noopener noreferrer" : undefined}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EnhancedJobCard; 