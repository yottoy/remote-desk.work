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
import Layout from '../../components/layout/Layout';

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
          referrer: typeof window !== 'undefined' ? document.referrer : ''
        }),
      }).catch(err => console.error('Analytics error:', err));
    }
  }, [job, addJobToRecentlyViewed]);

  const isVerified = job?.qualityScore >= 8;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

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
                className="prose max-w-none bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                itemProp="description"
              >
                {/* Preserve formatting by using pre-wrap for plain text descriptions */}
                {job.description ? (
                  <div dangerouslySetInnerHTML={{ __html: job.description }} />
                ) : job.descriptionText ? (
                  <pre className="whitespace-pre-wrap font-sans text-base text-gray-700">{job.descriptionText}</pre>
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
    return { notFound: true };
  }

  try {
    // Direct API URL - don't try to be clever with URLs
    const apiUrl = `https://clickclickjob.vercel.app/api/jobs/${id}`;
    console.log(`Fetching job details from: ${apiUrl}`);
    
    // Test direct API access first
    try {
      const testResponse = await fetch(apiUrl, {
        method: 'HEAD',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!testResponse.ok) {
        console.error(`API endpoint returned ${testResponse.status}`);
      } else {
        console.log('API endpoint is accessible');
      }
    } catch (e) {
      console.error('Error pre-testing API endpoint:', e);
    }
    
    // Fetch job details with more verbose error handling
    const jobResponse = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'ClickClickJob/1.0',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!jobResponse.ok) {
      const errorText = await jobResponse.text();
      console.error(`Failed to fetch job: ${jobResponse.status}`, errorText);
      return { notFound: true };
    }
    
    let job;
    try {
      job = await jobResponse.json();
    } catch (e) {
      console.error('Error parsing job JSON:', e);
      return { notFound: true };
    }
    
    // Validate job data
    if (!job || !job._id) {
      console.error('Invalid job data received:', job);
      return { notFound: true };
    }

    // Ensure all required fields are present
    if (!job.title || !job.company) {
      console.error('Job missing required fields:', job._id);
      return { notFound: true };
    }

    // Normalize dates
    const normalizeDate = (date: string | Date | null) => {
      if (!date) return null;
      try {
        return new Date(date).toISOString();
      } catch (e) {
        return null;
      }
    };

    job.postedDate = normalizeDate(job.postedDate);
    job.scrapedDate = normalizeDate(job.scrapedDate);
    job.expiresAt = normalizeDate(job.expiresAt);
    job.createdAt = normalizeDate(job.createdAt);
    job.updatedAt = normalizeDate(job.updatedAt);

    // Ensure description exists
    if (!job.description) {
      job.description = `<p>Apply for this ${job.title} position at ${job.company}.</p>
      <p>This is a remote role with competitive compensation.</p>`;
    }

    // Ensure apply URL is valid
    if (!job.url || job.url.includes('example.com') || !job.url.startsWith('http')) {
      job.url = job.sourceUrl || (job.company?.careerUrl ? job.company.careerUrl : '');
    }
    
    // Ensure job skills are populated
    if (!job.skills || !Array.isArray(job.skills) || job.skills.length === 0) {
      // Generate some reasonable default skills based on job title
      const defaultSkills = [];
      
      if (job.title.toLowerCase().includes('data entry')) {
        defaultSkills.push('Data Entry', 'Typing', 'Attention to Detail', 'Microsoft Office');
      } else if (job.title.toLowerCase().includes('assistant')) {
        defaultSkills.push('Communication', 'Organization', 'Time Management', 'Microsoft Office');
      } else if (job.title.toLowerCase().includes('bookkeeping')) {
        defaultSkills.push('QuickBooks', 'Accounting', 'Financial Reporting', 'Data Entry');
      } else if (job.title.toLowerCase().includes('customer')) {
        defaultSkills.push('Customer Service', 'Communication', 'Problem Solving', 'CRM Software');
      } else {
        defaultSkills.push('Remote Work', 'Communication', 'Time Management', 'Organization');
      }
      
      job.skills = defaultSkills;
    }
    
    // Ensure job type is populated
    if (!job.jobType) {
      // Try to infer job type from the title or description
      if (job.title.toLowerCase().includes('part-time') || 
          (job.description && job.description.toLowerCase().includes('part-time'))) {
        job.jobType = 'Part-time';
      } else if (job.title.toLowerCase().includes('contract') || 
                (job.description && job.description.toLowerCase().includes('contract'))) {
        job.jobType = 'Contract';
      } else {
        job.jobType = 'Full-time';
      }
    }
    
    console.log(`Successfully fetched job: ${job.title}`);
    
    // Manually added similar jobs for fallback
    const similarJobs: EnhancedJobListing[] = [];
    
    return {
      props: {
        job,
        similarJobs,
        peopleAlsoViewed: [], 
        relatedCategories: [
          { name: 'Data Entry Jobs', slug: 'data-entry', jobCount: 56 },
          { name: 'Administrative Assistant', slug: 'administrative-assistant', jobCount: 42 },
          { name: 'Customer Service', slug: 'customer-service', jobCount: 78 }
        ],
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      notFound: true
    };
  }
};

export default JobDetailsPage; 