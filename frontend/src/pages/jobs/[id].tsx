import React, { useRef, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { differenceInDays, format } from 'date-fns';

// Import serialization utilities
import { serializeObject } from '../../utils/serialization';

// Import engagement components
import StatusBadges from '../../components/engagement/StatusBadges';
import ReadingProgressIndicator from '../../components/engagement/ReadingProgressIndicator';
import TrustIndicators, { JobSafetyTip, VerificationProcessExplanation } from '../../components/engagement/TrustIndicators';
import { SimilarJobs, PeopleAlsoViewed, RelatedCategories, JobsYouMightLike, useRecentlyViewedJobs } from '../../components/engagement/DiscoveryEnhancement';
import { ApplicationInstructions, CopyToClipboard } from '../../components/engagement/UserHelpers';

// Import job types
import { EnhancedJobListing } from '../../types/job';
import Metadata from '../../components/seo/Metadata';
import JobSchema from '../../components/seo/JobSchema';
import OrganizationSchema from '../../components/seo/OrganizationSchema';
import BreadcrumbSchema from '../../components/seo/BreadcrumbSchema';
import FAQSchema from '../../components/seo/FAQSchema';
import InternalLinking from '../../components/seo/InternalLinking';
import Layout from '../../components/layout/Layout';
// import ShareButton from '../../components/common/ShareButton';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import JobCard from '../../components/common/JobCard';
import { connectToDatabase } from '../../utils/mongodb';
import { formatJobDate, formatJobDescription } from '../../utils/jobUtils';

interface JobDetailsPageProps {
  job: EnhancedJobListing | null;
  similarJobs: EnhancedJobListing[];
  peopleAlsoViewed: EnhancedJobListing[];
  relatedCategories: Array<{ name: string; slug: string; jobCount: number; }>;
  relatedJobs: EnhancedJobListing[];
  moreFromCompany: EnhancedJobListing[];
}

const JobDetailsPage: React.FC<JobDetailsPageProps> = ({ 
  job, 
  similarJobs, 
  peopleAlsoViewed, 
  relatedCategories,
  relatedJobs,
  moreFromCompany
}) => {
  const router = useRouter();
  const descriptionRef = useRef<HTMLDivElement>(null);
  const { addJobToRecentlyViewed } = useRecentlyViewedJobs();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  
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

  if (!job) {
    return (
      <Layout
        title="Job Not Found | ClickClickJob.com"
        description="The job you're looking for could not be found. Browse our latest remote opportunities."
      >
        <div className="min-h-[70vh] flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl font-extrabold text-blue-600 mb-4">404</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <p className="text-xl text-gray-600 mb-8">This job posting may have expired or been removed.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/jobs"
                className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse All Jobs
              </Link>
              
              <Link
                href="/"
                className="px-6 py-3 bg-white text-blue-600 border border-blue-300 rounded-md font-medium shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${job.title} at ${job.company} | ClickClickJob.com`}
      description={job.descriptionText || (job.description ? job.description.substring(0, 250) : '')}
    >
      <Metadata 
        jobTitle={job.title}
        companyName={job.company}
        jobDescription={job.descriptionText || (job.description ? job.description.substring(0, 250) : '')}
        location={job.location}
        keywords={job.tags}
      />
      {/* Schema.org structured data for AI optimization */}
      <JobSchema job={job} />
      <OrganizationSchema name="ClickClickJob.com" />
      <BreadcrumbSchema 
        items={[
          { name: 'Home', url: 'https://clickclickjob.com' },
          { name: 'Job Listings', url: 'https://clickclickjob.com/jobs' },
          { name: job.title, url: currentUrl }
        ]} 
      />
      <FAQSchema 
        faqs={[
          { 
            question: "Is this a legitimate remote job?", 
            answer: "Yes, all jobs listed on ClickClickJob.com are verified and checked for legitimacy. We specialize in aggregating genuine remote administrative and data entry positions."
          },
          { 
            question: "How do I apply for this job?", 
            answer: "Click the 'Apply Now' button to go to the original job posting. Follow the application instructions on the employer's website."
          },
          { 
            question: "What skills are needed for this position?", 
            answer: `This ${job.title} position at ${job.company} may require skills such as typing, data entry, administrative support, and proficiency with common office software.`
          }
        ]} 
      />

      <main className="bg-white min-h-screen" itemScope itemType="https://schema.org/JobPosting">
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
                <h1 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate" itemProp="title">
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
                  <a 
                    href={`mailto:apply@clickclickjob.com?subject=Application for ${encodeURIComponent(job.title)} at ${encodeURIComponent(job.company)}&body=I am interested in applying for the ${encodeURIComponent(job.title)} position at ${encodeURIComponent(job.company)}. Job ID: ${encodeURIComponent(job._id)}`}
                    className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Contact for application instructions"
                  >
                    Contact to Apply
                    <svg className="ml-2 -mr-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </a>
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
                itemProp="description"
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
                      {relatedJobs.slice(0, 6).map((relatedJob) => (
                        <div key={relatedJob._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                            <Link href={`/jobs/${relatedJob._id}`} className="hover:text-blue-600">
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
                      {moreFromCompany.slice(0, 4).map((companyJob) => (
                        <div key={companyJob._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                            <Link href={`/jobs/${companyJob._id}`} className="hover:text-blue-600">
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
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  
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
      return { 
        redirect: {
          destination: '/jobs',
          permanent: false,
        }
      };
    }
    
    // Find the job by ID or uniqueIdentifier
    // Try to convert to ObjectId first, then fallback to string search
    const { ObjectId } = require('mongodb');
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

    // If job still not found, redirect to jobs page instead of showing "Job Not Found"
    if (!job) {
      console.log(`Job not found for ID: ${id}, redirecting to /jobs`);
      return {
        redirect: {
          destination: '/jobs',
          permanent: false,
        }
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
      .limit(6)
      .sort({ qualityScore: -1, postedDate: -1 })
      .toArray();

    // Get more jobs from the same company
    const moreFromCompany = await db.collection('jobs')
      .find({
        _id: { $ne: job._id },
        company: job.company
      })
      .limit(4)
      .sort({ postedDate: -1 })
      .toArray();

    return {
      props: {
        job: JSON.parse(JSON.stringify(job)),
        similarJobs: [],
        peopleAlsoViewed: [],
        relatedCategories: [],
        relatedJobs: JSON.parse(JSON.stringify(relatedJobs)),
        moreFromCompany: JSON.parse(JSON.stringify(moreFromCompany)),
      },
    };
  } catch (error) {
    console.error('Error fetching job:', error);
    // On error, redirect to jobs page instead of showing error content
    return {
      redirect: {
        destination: '/jobs',
        permanent: false,
      }
    };
  }
};

export default JobDetailsPage; 