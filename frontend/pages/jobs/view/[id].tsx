import React, { useRef, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { differenceInDays, format } from 'date-fns';

// Import serialization utilities
import { serializeObject } from '../../../utils/serialization';

// Import engagement components
import StatusBadges from '../../../components/engagement/StatusBadges';
import ReadingProgressIndicator from '../../../components/engagement/ReadingProgressIndicator';
import TrustIndicators, { JobSafetyTip, VerificationProcessExplanation } from '../../../components/engagement/TrustIndicators';
import { SimilarJobs, PeopleAlsoViewed, RelatedCategories, JobsYouMightLike, useRecentlyViewedJobs } from '../../../components/engagement/DiscoveryEnhancement';
import { ApplicationInstructions, CopyToClipboard } from '../../../components/engagement/UserHelpers';

// Import job types
import { EnhancedJobListing } from '../../../types/job';
import InternalLinking from '../../../components/seo/InternalLinking';
import Layout from '../../../components/layout/Layout';
// import ShareButton from '../../../components/common/ShareButton';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import JobCard from '../../../components/common/JobCard';
import { connectToDatabase } from '../../../utils/mongodb';
import { formatJobDate, formatJobDescription } from '../../../utils/jobUtils';
import SchemaHead from '../../../components/seo/SchemaHead';
import { generateJobPostingSchema, generateBreadcrumbSchema, JobData, BreadcrumbItem } from '../../../utils/schemaGenerator';
import { ObjectId } from 'mongodb';
import { wasJobDeleted, getDeletedJobInfo } from '../../../utils/deletedJobsTracker';

// Utility function to create SEO-friendly page titles
const createSEOTitle = (jobTitle: string, company: string): string => {
  const suffix = ' | ClickClickJob.com';
  const maxLength = 60;
  const availableLength = maxLength - suffix.length;
  
  // If the full title fits, use it
  const fullTitle = `${jobTitle} at ${company}`;
  if (fullTitle.length <= availableLength) {
    return fullTitle + suffix;
  }
  
  // Try to truncate the job title while keeping the company
  const companyPart = ` at ${company}`;
  const maxJobTitleLength = availableLength - companyPart.length;
  
  if (maxJobTitleLength > 10) { // Ensure we have enough space for a meaningful job title
    const truncatedJobTitle = jobTitle.length > maxJobTitleLength 
      ? jobTitle.substring(0, maxJobTitleLength - 3) + '...'
      : jobTitle;
    return truncatedJobTitle + companyPart + suffix;
  }
  
  // If company is too long, truncate both
  const maxTotalLength = availableLength - 5; // Reserve space for " at " and "..."
  const halfLength = Math.floor(maxTotalLength / 2);
  
  const truncatedTitle = jobTitle.length > halfLength 
    ? jobTitle.substring(0, halfLength - 1) + '...'
    : jobTitle;
  const truncatedCompany = company.length > halfLength 
    ? company.substring(0, halfLength - 1) + '...'
    : company;
  
  return `${truncatedTitle} at ${truncatedCompany}${suffix}`;
};

interface JobDetailsPageProps {
  job: EnhancedJobListing | null;
  similarJobs: EnhancedJobListing[];
  peopleAlsoViewed: EnhancedJobListing[];
  relatedCategories: Array<{ name: string; slug: string; jobCount: number; }>;
  relatedJobs: EnhancedJobListing[];
  moreFromCompany: EnhancedJobListing[];
  error?: string;
  deletedInfo?: {
    deletedAt: string;
    originalTitle: string;
    originalCompany: string;
  } | null;
  isStale?: boolean;
}

const JobDetailsPage: React.FC<JobDetailsPageProps> = ({
  job,
  similarJobs,
  peopleAlsoViewed,
  relatedCategories,
  relatedJobs,
  moreFromCompany,
  error,
  deletedInfo,
  isStale
}) => {
  const router = useRouter();
  const descriptionRef = useRef<HTMLDivElement>(null);
  const { addJobToRecentlyViewed } = useRecentlyViewedJobs();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  
  // Handle 410 Gone - job was deleted or expired
  if (error === 'gone') {
    return (
      <Layout>
        <Head>
          <title>Job No Longer Available | ClickClickJob.com</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Job No Longer Available</h1>
          <p className="text-gray-600 mb-6">
            {deletedInfo ? (
              <>This job posting for <strong>{deletedInfo.originalTitle}</strong> at <strong>{deletedInfo.originalCompany}</strong> has been removed and is no longer available.</>
            ) : (
              <>This job posting has been removed and is no longer available.</>
            )}
          </p>
          <p className="text-gray-500 mb-8">
            This position may have been filled or the listing has expired.
          </p>
          <div className="space-x-4">
            <Link href="/jobs" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Browse All Jobs
            </Link>
            <Link href="/" className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300">
              Go to Homepage
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle server errors (DB connection failure, transient errors)
  if (error === 'server_error') {
    return (
      <Layout>
        <Head>
          <title>Temporarily Unavailable | ClickClickJob.com</title>
          <meta name="robots" content="noindex" />
        </Head>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Temporarily Unavailable</h1>
          <p className="text-gray-600 mb-8">
            This page is temporarily unavailable. Please try again in a few minutes.
          </p>
          <div className="space-x-4">
            <Link href="/jobs" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              Browse All Jobs
            </Link>
            <Link href="/" className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300">
              Go to Homepage
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (job?._id) {
      // Add to recently viewed jobs in local storage
      addJobToRecentlyViewed(job._id);
      
      // Track job view in analytics
      fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'job_view',
          jobId: job._id,
          jobTitle: job.title,
          company: job.company,
          source: job.source,
          referrer: typeof window !== 'undefined' ? document.referrer : ''
        }),
      }).catch(err => console.error('Analytics error:', err));
    }
  }, [job, addJobToRecentlyViewed]);

  useEffect(() => {
    if (job) {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedJobs') || '[]');
      setIsBookmarked(bookmarks.includes(job._id));
    }
  }, [job]);

  const toggleBookmark = () => {
    if (!job) return;
    
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedJobs') || '[]');
    let newBookmarks;
    
    if (isBookmarked) {
      newBookmarks = bookmarks.filter((id: string) => id !== job._id);
    } else {
      newBookmarks = [...bookmarks, job._id];
    }
    
    localStorage.setItem('bookmarkedJobs', JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);
  };

  const isVerified = job?.qualityScore ? job.qualityScore >= 8 : false;

  // Create SEO-optimized meta description
  const createMetaDescription = (job: EnhancedJobListing): string => {
    const baseText = `Apply for this remote ${job.title} position at ${job.company}`;
    const locationText = job.location ? ` (${job.location})` : '';
    const endingText = '. Find more legitimate remote admin and data entry jobs at ClickClickJob.com.';
    
    // Start with base text
    let metaDesc = baseText + locationText;
    
    // Calculate remaining space for description snippet
    const remainingSpace = 150 - metaDesc.length - endingText.length;
    
    // Add description snippet if there's meaningful space (at least 20 chars)
    if (remainingSpace > 20) {
      const description = job.descriptionText || job.description || '';
      if (description) {
        const snippet = description.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const truncatedSnippet = snippet.substring(0, remainingSpace - 3); // 3 for "..."
        metaDesc += `. ${truncatedSnippet}...`;
      }
    }
    
    metaDesc += endingText;
    
    // Final safety check - truncate to exactly 150 chars
    return metaDesc.substring(0, 150);
  };

  if (error || !job) {
    return (
      <Layout
        title="Job Not Found | ClickClickJob"
        description="The requested job listing could not be found."
      >
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-8">
            The job listing you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/jobs')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Jobs
          </button>
        </div>
      </Layout>
    );
  }

  // Prepare job data for schema
  const jobData: JobData = {
    _id: job._id,
    title: job.title,
    company: job.company,
    location: job.location || 'Remote',
    description: job.description || `${job.title} position at ${job.company}. Remote work opportunity with competitive compensation and benefits.`,
    salary: job.salary,
    postedDate: typeof job.postedDate === 'string' ? job.postedDate : new Date().toISOString().split('T')[0],
    url: job.url,
    employmentType: (job as any).employmentType || 'FULL_TIME',
    experienceLevel: job.experienceLevel,
    benefits: (job as any).benefits || ['Remote work', 'Flexible schedule', 'Work-life balance']
  };

  // Prepare breadcrumb data
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', url: baseUrl },
    { name: 'Jobs', url: `${baseUrl}/jobs` },
    { name: job.title, url: `${baseUrl}/jobs/view/${job._id}` }
  ];

  // Generate schema markup
  const schemas = [
    generateJobPostingSchema(jobData),
    generateBreadcrumbSchema(breadcrumbs)
  ];

  const pageTitle = createSEOTitle(job.title, job.company);
  const pageDescription = createMetaDescription(job);

  return (
    <>
      <SchemaHead
        schemas={schemas}
        title={pageTitle}
        description={pageDescription}
        canonical={`${baseUrl}/jobs/view/${job._id}`}
        openGraph={{
          title: pageTitle,
          description: pageDescription,
          type: 'article',
          url: `${baseUrl}/jobs/view/${job._id}`,
          image: `${baseUrl}/images/job-og.jpg`
        }}
      />
      {isStale && (
        <Head>
          <meta name="robots" content="noindex" />
        </Head>
      )}
      
      <Layout
        title={pageTitle}
        description={pageDescription}
      >
        {/* Breadcrumb Navigation */}
        <nav className="max-w-7xl mx-auto px-4 py-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-gray-900 font-medium">{crumb.name}</span>
                ) : (
                  <a href={crumb.url} className="hover:text-blue-600 transition-colors">
                    {crumb.name}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <main className="bg-white min-h-screen">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <nav className="flex" aria-label="Breadcrumb">
                    <ol role="list" className="flex items-center space-x-4">
                      <li>
                        <div>
                          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                            Home
                          </Link>
                        </div>
                      </li>
                      <li>
                        <div className="flex items-center">
                          <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <Link href="/jobs" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                            Jobs
                          </Link>
                        </div>
                      </li>
                    </ol>
                  </nav>
                  <h1 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    {job.title}
                  </h1>
                  <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 13.197l-4.419 2.617A1 1 0 014 15V4zm2-1a1 1 0 00-1 1v10.566l3.419-2.021a1 1 0 011.162 0L13 14.566V4a1 1 0 00-1-1H6z" clipRule="evenodd" />
                      </svg>
                      {job.company}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {job.location}
                    </div>
                    {job.salary && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        {job.salary}
                      </div>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Posted {format(new Date(job.postedDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-col sm:flex-row gap-3 lg:mt-0 lg:ml-4">
                  {job.url && job.url.startsWith('http') ? (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => {
                        // Track apply click in analytics
                        fetch('/api/analytics', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            event: 'job_apply_click',
                            jobId: job._id,
                            jobTitle: job.title,
                            company: job.company,
                            source: job.source,
                            destinationUrl: job.url
                          }),
                        }).catch(err => console.error('Analytics error:', err));
                      }}
                    >
                      Apply Now
                      <svg className="ml-2 -mr-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  ) : (
                    <span 
                      className="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-500 bg-gray-100 cursor-not-allowed"
                      title="Please see job description for application instructions"
                    >
                      See Description for Apply Instructions
                      <svg className="ml-2 -mr-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                  <CopyToClipboard 
                    textToCopy={currentUrl} 
                    label="Share Job" 
                    className="inline-flex justify-center" 
                  />
                </div>
              </div>

              <div className="mt-4">
                <StatusBadges job={job} />
              </div>
            </div>
          </header>

          {/* Reading progress indicator */}
          <div className="sticky top-0 z-10">
            <ReadingProgressIndicator target={descriptionRef} />
          </div>

          <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {/* Sidebar for mobile - will be hidden on desktop */}
            <div className="lg:hidden mb-8">
              <TrustIndicators job={job} showAll={false} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main job content */}
              <div className="lg:col-span-2">
                <article 
                  ref={descriptionRef} 
                  className="prose max-w-none bg-white p-6 rounded-lg shadow-sm border border-gray-200 job-description"
                >
                  {/* Format description with proper markdown to HTML conversion */}
                  {job.description ? (
                    <div dangerouslySetInnerHTML={{ __html: formatJobDescription(job.description) }} />
                  ) : job.descriptionText ? (
                    <div dangerouslySetInnerHTML={{ __html: formatJobDescription(job.descriptionText) }} />
                  ) : (
                    <p className="text-gray-500 italic">No job description available.</p>
                  )}
                  
                  {/* Preserve links and special formatting for listings from LinkedIn and other sources */}
                  {job.source === 'linkedin' && job.url && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="font-medium text-gray-900">For the complete job description and to apply, please visit:</p>
                      <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        {job.url}
                      </a>
                    </div>
                  )}
                </article>

                {/* Job Details Section */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {job.jobType && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Job Type</h3>
                        <p className="mt-1 text-sm text-gray-900">{job.jobType}</p>
                      </div>
                    )}
                    {job.experienceLevel && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Experience Level</h3>
                        <p className="mt-1 text-sm text-gray-900">{job.experienceLevel}</p>
                      </div>
                    )}
                    {job.jobCategory && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Category</h3>
                        <p className="mt-1 text-sm text-gray-900">{job.jobCategory}</p>
                      </div>
                    )}
                    {job.salary && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Salary</h3>
                        <p className="mt-1 text-sm text-green-600 font-medium">{job.salary}</p>
                      </div>
                    )}
                  </div>
                  
                  {job.skills && job.skills.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {job.softwareRequirements && job.softwareRequirements.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Software Requirements</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.softwareRequirements.map((software, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                            {software}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-8">
                  <ApplicationInstructions job={job} />
                </div>

                {/* Add original source attribution if available */}
                {job.source && (
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Original job posting from: {job.source.charAt(0).toUpperCase() + job.source.slice(1)}</p>
                  </div>
                )}

                <div className="mt-8">
                  <SimilarJobs
                    currentJob={job}
                    similarJobs={similarJobs}
                    className="mb-8"
                  />

                  <PeopleAlsoViewed 
                    currentJob={job}
                    viewedJobs={peopleAlsoViewed}
                  />

                  {/* Related Jobs Section */}
                  {relatedJobs && relatedJobs.length > 0 && (
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Jobs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {relatedJobs.slice(0, 12).map((relatedJob) => (
                          <div key={relatedJob._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                              <Link href={`/jobs/view/${relatedJob._id}`} className="hover:text-blue-600">
                                {relatedJob.title}
                              </Link>
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">{relatedJob.company}</p>
                            <p className="text-xs text-gray-500">{relatedJob.location}</p>
                            {relatedJob.salary && (
                              <p className="text-xs text-green-600 font-medium mt-1">{relatedJob.salary}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-center">
                        <Link
                          href="/jobs"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Browse All Jobs
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* More Jobs from Company */}
                  {moreFromCompany && moreFromCompany.length > 0 && (
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        More Jobs from {job.company}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {moreFromCompany.slice(0, 8).map((companyJob) => (
                          <div key={companyJob._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                              <Link href={`/jobs/view/${companyJob._id}`} className="hover:text-blue-600">
                                {companyJob.title}
                              </Link>
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">{companyJob.company}</p>
                            <p className="text-xs text-gray-500">{companyJob.location}</p>
                            {companyJob.salary && (
                              <p className="text-xs text-green-600 font-medium mt-1">{companyJob.salary}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Internal Linking Component for SEO */}
                  <InternalLinking
                    currentJob={job}
                    relatedJobs={relatedJobs}
                    category={job.jobCategory}
                    showJobSuggestions={true}
                    showCategoryLinks={true}
                    className="mb-6"
                  />
                </div>
              </div>

              {/* Sidebar - desktop only */}
              <div className="hidden lg:block space-y-6">
                <TrustIndicators job={job} showAll={true} />
                
                <RelatedCategories 
                  categories={relatedCategories}
                />
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  const { res } = context;
  
  if (!id || typeof id !== 'string') {
    return { 
      redirect: {
        destination: '/jobs',
        permanent: false,
      }
    };
  }

  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      console.error('Failed to connect to database');
      // Return 503 instead of redirecting — redirects during Google validation
      // cause "Page with redirect" failures in GSC
      res.statusCode = 503;
      res.setHeader('Retry-After', '300'); // Tell Google to retry in 5 minutes
      return {
        props: {
          job: null,
          similarJobs: [],
          peopleAlsoViewed: [],
          relatedCategories: [],
          relatedJobs: [],
          moreFromCompany: [],
          error: 'server_error',
        },
      };
    }
    
    // Check if this job was previously deleted
    // Return 410 Gone for deleted jobs (better for SEO than redirect)
    const wasDeleted = await wasJobDeleted(id);
    
    if (wasDeleted) {
      console.log(`Job ${id} was previously deleted, returning 410 Gone`);
      const deletedInfo = await getDeletedJobInfo(id);
      
      // Set 410 status and cache headers
      res.statusCode = 410; // Gone - indicates resource was deleted
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.setHeader('X-Robots-Tag', 'noindex, nofollow'); // Tell search engines not to index
      
      // Return props with deleted flag to show appropriate message
      return {
        props: {
          job: null,
          similarJobs: [],
          peopleAlsoViewed: [],
          relatedCategories: [],
          relatedJobs: [],
          moreFromCompany: [],
          error: 'gone',
          deletedInfo: deletedInfo ? {
            deletedAt: deletedInfo.deletedAt.toISOString(),
            originalTitle: deletedInfo.originalTitle || 'Job',
            originalCompany: deletedInfo.originalCompany || 'Unknown Company'
          } : null
        },
      };
    }
    
    // Find the job by ID or uniqueIdentifier
    // Try to convert to ObjectId first, then fallback to string search
    let job = null;
    
    // Try ObjectId format first
    try {
      if (ObjectId.isValid(id)) {
        job = await db.collection('jobs').findOne({ _id: new ObjectId(id) });
      }
    } catch (e) {
      console.log('Not a valid ObjectId, trying string search');
    }
    
    // If not found by ObjectId, try string search
    if (!job) {
      job = await db.collection('jobs').findOne({
        $or: [
          { _id: id },
          { uniqueIdentifier: id }
        ]
      });
    }

    // If job still not found, return 410 Gone for valid ObjectIDs (expired jobs)
    // or 404 for invalid/malformed IDs
    if (!job) {
      const isValidObjectId = ObjectId.isValid(id) && /^[a-f0-9]{24}$/.test(id);

      if (isValidObjectId) {
        // Valid ObjectID that doesn't exist = expired/deleted job → 410 Gone
        // This tells Google to stop re-checking and remove from index
        console.log(`Job ${id} not found (valid ObjectId), returning 410 Gone`);
        res.statusCode = 410;
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.setHeader('X-Robots-Tag', 'noindex, nofollow');

        return {
          props: {
            job: null,
            similarJobs: [],
            peopleAlsoViewed: [],
            relatedCategories: [],
            relatedJobs: [],
            moreFromCompany: [],
            error: 'gone',
            deletedInfo: null,
          },
        };
      }

      // Invalid/malformed ID → standard 404
      console.log(`Job not found for invalid ID: ${id}, returning 404`);
      res.statusCode = 404;
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');

      return {
        notFound: true,
      };
    }

    // Get related jobs (same category or similar title words)
    const titleWords = job.title.toLowerCase().split(' ')
      .filter((word: string) => word.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(word))
      .slice(0, 3);
    
    const relatedJobsQuery: any = {
      _id: { $ne: job._id },
      $or: [
        { jobCategory: job.jobCategory },
        { title: { $regex: new RegExp(titleWords.join('|'), 'i') } }
      ]
    };

    const relatedJobs = await db.collection('jobs')
      .find(relatedJobsQuery)
      .limit(12)
      .sort({ qualityScore: -1, postedDate: -1 })
      .toArray();

    // Get more jobs from the same company
    const moreFromCompany = await db.collection('jobs')
      .find({
        _id: { $ne: job._id },
        company: job.company
      })
      .limit(8)
      .sort({ postedDate: -1 })
      .toArray();

    // Noindex stale job pages (older than 60 days) to prevent thin/outdated content indexing
    const jobDate = new Date(job.postedDate || job.scrapedDate || job.createdAt);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const isStale = jobDate < sixtyDaysAgo;

    if (isStale) {
      res.setHeader('X-Robots-Tag', 'noindex');
    }

    return {
      props: {
        job: JSON.parse(JSON.stringify(job)),
        similarJobs: [],
        peopleAlsoViewed: [],
        relatedCategories: [],
        relatedJobs: JSON.parse(JSON.stringify(relatedJobs)),
        moreFromCompany: JSON.parse(JSON.stringify(moreFromCompany)),
        isStale: isStale,
      },
    };
  } catch (error) {
    console.error('Error fetching job:', error);
    // Return 500 error page instead of redirecting to /jobs
    // Redirecting on transient errors (DB timeout) causes GSC "Page with redirect" failures
    // because Google re-validates and sees a redirect instead of the actual page
    res.statusCode = 500;
    return {
      props: {
        job: null,
        similarJobs: [],
        peopleAlsoViewed: [],
        relatedCategories: [],
        relatedJobs: [],
        moreFromCompany: [],
        error: 'server_error',
      },
    };
  }
};

export default JobDetailsPage; 