import React, { useRef, useEffect } from 'react';
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

// Mock API function - this would be replaced by actual API call
async function getJobById(id: string): Promise<EnhancedJobListing> {
  // This is a mock function that would be replaced with an actual API call
  return {
    _id: id,
    title: 'Remote Data Entry Specialist',
    company: 'TechCorp Solutions',
    location: 'Remote (United States)',
    description: '<p>We are seeking a detail-oriented Data Entry Specialist to join our remote team. The ideal candidate will have strong typing skills and attention to detail.</p><h3>Responsibilities:</h3><ul><li>Enter data from various sources into company database</li><li>Maintain data accuracy and integrity</li><li>Process paperwork and maintain filing systems</li><li>Generate reports as needed</li></ul><h3>Requirements:</h3><ul><li>High school diploma or equivalent</li><li>1+ years of data entry experience</li><li>Typing speed of at least 50 WPM</li><li>Proficiency in Microsoft Office</li><li>Strong attention to detail</li></ul><h3>To Apply:</h3><p>Please submit your resume and cover letter through our online portal. Include "Data Entry Specialist" in the subject line.</p>',
    descriptionText: 'We are seeking a detail-oriented Data Entry Specialist to join our remote team. The ideal candidate will have strong typing skills and attention to detail. Responsibilities: Enter data from various sources into company database, maintain data accuracy and integrity, process paperwork and maintain filing systems, generate reports as needed. Requirements: High school diploma or equivalent, 1+ years of data entry experience, typing speed of at least 50 WPM, proficiency in Microsoft Office, strong attention to detail. To Apply: Please submit your resume and cover letter through our online portal. Include "Data Entry Specialist" in the subject line.',
    url: 'https://example.com/jobs/remote-data-entry-specialist',
    salary: '$15-18/hour',
    postedDate: new Date('2025-05-10'),
    scrapedDate: new Date('2025-05-11'),
    expiresAt: new Date('2025-06-10'),
    source: 'indeed',
    sourceId: 'abc123',
    qualityScore: 8.5,
    relevanceScore: 9.0,
    qualityIndicatorScore: 8.0,
    credibilityScore: 9.0,
    recencyScore: 9.5,
    featured: true,
    tags: ['data-entry', 'remote', 'entry-level'],
    uniqueIdentifier: 'techcorp-remote-data-entry-specialist',
    createdAt: new Date('2025-05-11'),
    updatedAt: new Date('2025-05-11'),
    engagementMetrics: {
      clickCount: 75,
      viewCount: 120,
      applicationCount: 25,
      lastClicked: new Date('2025-05-12'),
      lastViewed: new Date('2025-05-12')
    }
  };
}

// Mock function to get similar jobs
async function getSimilarJobs(jobId: string): Promise<EnhancedJobListing[]> {
  return [
    {
      _id: 'job2',
      title: 'Virtual Data Entry Clerk',
      company: 'Admin Solutions Inc.',
      location: 'Remote (Worldwide)',
      description: 'Job description...',
      descriptionText: 'Job description text...',
      url: 'https://example.com/jobs/virtual-data-entry-clerk',
      postedDate: new Date('2025-05-09'),
      scrapedDate: new Date('2025-05-10'),
      expiresAt: new Date('2025-06-09'),
      source: 'weworkremotely',
      qualityScore: 7.5,
      featured: false,
      tags: ['data-entry', 'remote', 'entry-level'],
      uniqueIdentifier: 'adminsolutions-virtual-data-entry-clerk',
      createdAt: new Date('2025-05-10'),
      updatedAt: new Date('2025-05-10')
    },
    {
      _id: 'job3',
      title: 'Remote Administrative Assistant',
      company: 'Global Services LLC',
      location: 'Remote (US Only)',
      description: 'Job description...',
      descriptionText: 'Job description text...',
      url: 'https://example.com/jobs/remote-administrative-assistant',
      postedDate: new Date('2025-05-11'),
      scrapedDate: new Date('2025-05-11'),
      expiresAt: new Date('2025-06-11'),
      source: 'remote.co',
      qualityScore: 8.0,
      featured: true,
      tags: ['administrative', 'remote', 'assistant'],
      uniqueIdentifier: 'globalservices-remote-administrative-assistant',
      createdAt: new Date('2025-05-11'),
      updatedAt: new Date('2025-05-11')
    }
  ];
}

// Mock function to get popular/related jobs based on view data
async function getPeopleAlsoViewedJobs(jobId: string): Promise<EnhancedJobListing[]> {
  return [
    {
      _id: 'job4',
      title: 'Remote Customer Service Representative',
      company: 'Support Heroes',
      location: 'Remote (US Only)',
      description: 'Job description...',
      descriptionText: 'Job description text...',
      url: 'https://example.com/jobs/remote-customer-service',
      postedDate: new Date('2025-05-08'),
      scrapedDate: new Date('2025-05-09'),
      expiresAt: new Date('2025-06-08'),
      source: 'indeed',
      qualityScore: 8.5,
      featured: false,
      tags: ['customer-service', 'remote', 'entry-level'],
      uniqueIdentifier: 'supportheroes-remote-customer-service',
      createdAt: new Date('2025-05-09'),
      updatedAt: new Date('2025-05-09')
    },
    {
      _id: 'job5',
      title: 'Work from Home Data Analyst',
      company: 'Data Insights Co.',
      location: 'Remote (Worldwide)',
      description: 'Job description...',
      descriptionText: 'Job description text...',
      url: 'https://example.com/jobs/remote-data-analyst',
      postedDate: new Date('2025-05-10'),
      scrapedDate: new Date('2025-05-10'),
      expiresAt: new Date('2025-06-10'),
      source: 'remoteok',
      qualityScore: 9.0,
      featured: true,
      tags: ['data-analysis', 'remote', 'experienced'],
      uniqueIdentifier: 'datainsights-remote-data-analyst',
      createdAt: new Date('2025-05-10'),
      updatedAt: new Date('2025-05-10')
    }
  ];
}

// Mock function to get related categories for this job
async function getRelatedCategories(): Promise<Array<{ name: string; slug: string; jobCount: number; }>> {
  return [
    { name: 'Data Entry Jobs', slug: 'data-entry', jobCount: 56 },
    { name: 'Administrative Assistant', slug: 'administrative-assistant', jobCount: 42 },
    { name: 'Customer Service', slug: 'customer-service', jobCount: 78 }
  ];
}

interface JobDetailsPageProps {
  job: EnhancedJobListing;
  similarJobs: EnhancedJobListing[];
  peopleAlsoViewed: EnhancedJobListing[];
  relatedCategories: Array<{ name: string; slug: string; jobCount: number; }>;
}

const JobDetailsPage: React.FC<JobDetailsPageProps> = ({ 
  job, 
  similarJobs, 
  peopleAlsoViewed, 
  relatedCategories 
}) => {
  const router = useRouter();
  const descriptionRef = useRef<HTMLDivElement>(null);
  const { addJobToRecentlyViewed } = useRecentlyViewedJobs();
  
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
          referrer: document.referrer
        }),
      }).catch(err => console.error('Analytics error:', err));
    }
  }, [job, addJobToRecentlyViewed]);

  const isVerified = job?.qualityScore >= 8;

  if (!job) {
    return (
      <div>
        <Head>
          <title>Job Not Found | ClickClickJob.com</title>
        </Head>
        <p>Loading job details or job not found...</p>
      </div>
    );
  }

  return (
    <>
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
          { name: job.title, url: typeof window !== 'undefined' ? window.location.href : '' }
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
        {/* Job details header */}
        <header className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="flex items-center justify-between mb-4">
              <Link href="/jobs" className="text-blue-600 hover:text-blue-800 flex items-center">
                <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to search results
              </Link>
              <time dateTime={job.postedDate ? new Date(job.postedDate).toISOString() : ''} className="text-gray-500 text-sm">
                Posted {job.postedDate ? differenceInDays(new Date(), new Date(job.postedDate)) === 0 ? 'today' : differenceInDays(new Date(), new Date(job.postedDate)) === 1 ? 'yesterday' : `${differenceInDays(new Date(), new Date(job.postedDate))} days ago` : ''}
              </time>
            </nav>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" itemProp="title">{job.title}</h1>
                <div className="mt-2 flex items-center">
                  <span className="text-lg text-gray-700" itemProp="hiringOrganization" itemScope itemType="https://schema.org/Organization">
                    <span itemProp="name">{job.company}</span>
                  </span>
                  {isVerified && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <svg className="h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center text-sm text-gray-600">
                  <div className="mr-4 mb-2" itemProp="jobLocation" itemScope itemType="https://schema.org/Place">
                    <svg className="w-4 h-4 inline mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span itemProp="address">{job.location || 'Remote'}</span>
                    <meta itemProp="jobLocationType" content="TELECOMMUTE" />
                  </div>
                  {job.salary && (
                    <div className="mr-4 mb-2" itemProp="baseSalary" itemScope itemType="https://schema.org/MonetaryAmount">
                      <svg className="w-4 h-4 inline mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <span itemProp="value" itemScope itemType="https://schema.org/QuantitativeValue">
                        <span itemProp="value">{job.salary}</span>
                        <meta itemProp="unitText" content="HOUR" />
                      </span>
                      <meta itemProp="currency" content="USD" />
                    </div>
                  )}
                  <div className="mb-2">
                    <svg className="w-4 h-4 inline mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span itemProp="datePosted">
                      Posted {job.postedDate ? format(new Date(job.postedDate), 'MMMM d, yyyy') : ''}
                    </span>
                    {job.expiresAt && (
                      <meta itemProp="validThrough" content={new Date(job.expiresAt).toISOString()} />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <meta itemProp="employmentType" content="REMOTE" />
                {job.jobType && <meta itemProp="employmentType" content={job.jobType.toUpperCase()} />}
                {job.url ? (
                  <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => {
                      // Track application click
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
                  <button 
                    className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-500 cursor-not-allowed"
                    disabled
                    title="Application link unavailable"
                  >
                    Link Unavailable
                    <svg className="ml-2 -mr-1 w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                <CopyToClipboard 
                  textToCopy={window.location.href} 
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main job content */}
            <div className="lg:col-span-2">
              <article 
                ref={descriptionRef} 
                className="prose max-w-none bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-h-[70vh] overflow-y-auto"
                itemProp="description"
                dangerouslySetInnerHTML={{ __html: job.description || '' }}
              />

              <div className="mt-8">
                <ApplicationInstructions job={job} />
              </div>

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
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <TrustIndicators job={job} showAll={true} />
              
              <RelatedCategories 
                categories={relatedCategories}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  
  try {
    // Get the absolute URL base from request headers or environment variables
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `${protocol}://${host}`;
    
    // Fetch job details from real API endpoint
    const jobResponse = await fetch(`${baseUrl}/api/jobs/${id}`);
    
    if (!jobResponse.ok) {
      throw new Error(`Failed to fetch job: ${jobResponse.status}`);
    }
    
    const job = await jobResponse.json();
    
    // Check and filter out example.com URLs
    if (job && job.url && job.url.includes('example.com')) {
      job.url = ''; // Clear invalid URL
      job.urlValidationFailed = true;
    }
    
    // Fetch similar jobs
    const similarJobsResponse = await fetch(`${baseUrl}/api/jobs?limit=3&excludeId=${id}`);
    const similarJobsData = await similarJobsResponse.json();
    const similarJobs = similarJobsData.jobs || [];
    
    // Filter out example.com URLs from similar jobs
    similarJobs.forEach((job: any) => {
      if (job.url && job.url.includes('example.com')) {
        job.url = '';
        job.urlValidationFailed = true;
      }
    });
    
    // For related data, use a simplified approach to minimize potential issues
    const relatedCategories = [
      { name: 'Data Entry Jobs', slug: 'data-entry', jobCount: 56 },
      { name: 'Administrative Assistant', slug: 'administrative-assistant', jobCount: 42 },
      { name: 'Customer Service', slug: 'customer-service', jobCount: 78 }
    ];
    
    // Use the serialization utility to handle all date objects
    return {
      props: {
        job: serializeObject(job),
        similarJobs: serializeObject(similarJobs),
        peopleAlsoViewed: serializeObject(similarJobs.slice(0, 2)), // Reuse similar jobs for now
        relatedCategories
      }
    };
  } catch (error) {
    console.error('Error fetching job details:', error);
    return {
      notFound: true
    };
  }
};

export default JobDetailsPage; 