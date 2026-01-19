import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import ImprovedJobCard from '../components/common/ImprovedJobCard';
import SearchBar from '../components/common/SearchBar';
import { EmailCaptureForm } from '../components/email-capture/EmailCaptureForm';
import type { Job } from '../types/job';

interface PageProps {
  jobs: Job[];
  recentJobsCount: number;
  error?: string;
}

const USPSRemoteJobsPage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filterChips = [
    { label: 'Data Entry', value: 'data-entry' },
    { label: 'Mail Processing', value: 'mail-processing' },
    { label: 'Customer Service', value: 'customer-service' },
    { label: 'Administrative', value: 'administrative' },
    { label: 'Entry Level', value: 'entry-level' }
  ];

  // Filter jobs for USPS and government positions with broad fallback
  let uspsJobs = jobs.filter(job => {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    const company = job.company?.toLowerCase() || '';
    const fullText = `${title} ${description} ${company}`;
    
    return fullText.includes('usps') || 
           fullText.includes('postal') ||
           fullText.includes('mail') ||
           company.includes('postal') ||
           company.includes('usps');
  });
  
  // Fallback to government and administrative jobs if no USPS-specific jobs found
  if (uspsJobs.length < 8) {
    const relatedJobs = jobs.filter(job => {
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      const company = job.company?.toLowerCase() || '';
      const fullText = `${title} ${description} ${company}`;
      
      return fullText.includes('government') ||
             fullText.includes('federal') ||
             fullText.includes('data entry') ||
             fullText.includes('processing') ||
             fullText.includes('clerk') ||
             fullText.includes('administrative') ||
             fullText.includes('customer service');
    });
    uspsJobs = [...uspsJobs, ...relatedJobs].slice(0, 24);
  }
  
  // Final fallback to show any jobs
  if (uspsJobs.length === 0) {
    uspsJobs = jobs.slice(0, 12);
  }

  const filteredJobs = activeFilter 
    ? uspsJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        if (activeFilter === 'data-entry') {
          return title.includes('data') || description.includes('data entry');
        }
        if (activeFilter === 'customer-service') {
          return title.includes('customer') || title.includes('service');
        }
        if (activeFilter === 'administrative') {
          return title.includes('admin') || title.includes('clerk');
        }
        if (activeFilter === 'entry-level') {
          return (job as any).experienceLevel?.toLowerCase().includes('entry');
        }
        return true;
      })
    : uspsJobs;

  return (
    <Layout
      title="USPS Remote Jobs & Postal Service Work from Home | ClickClickJob"
      description="Find legitimate USPS remote jobs and postal service work from home opportunities. Data entry, mail processing, and administrative positions updated daily."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            USPS Remote Jobs & Postal Service Opportunities
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-center">
            Explore legitimate remote opportunities with USPS and similar government agencies. Data entry, processing, and administrative roles.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search USPS and government jobs..."
              filterChips={filterChips}
              onSearch={(query) => console.log(query)}
              onFilterChange={(filters) => console.log(filters)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['All Jobs', 'Data Entry', 'Mail Processing', 'Customer Service', 'Administrative'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter === 'All Jobs' ? null : filter.toLowerCase().replace(' ', '-'))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (filter === 'All Jobs' && !activeFilter) || activeFilter === filter.toLowerCase().replace(' ', '-')
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Stats Bar */}
          <div className="mt-8 flex justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{recentJobsCount}</div>
              <div className="text-sm text-gray-600">Active Positions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">Remote</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">Daily</div>
              <div className="text-sm text-gray-600">Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Available USPS & Government Remote Jobs
            </h2>
            <div className="text-sm text-gray-600">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
            </div>
          </div>

          {error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">Error loading jobs: {error}</div>
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Return to homepage
              </Link>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 mb-2">No jobs found matching your criteria</p>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or check back later</p>
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                Browse all jobs
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <ImprovedJobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Content Section - USPS Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Working Remotely with USPS & Government Agencies
          </h2>

          <div className="prose prose-lg max-w-none">
            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Understanding USPS Remote Opportunities
            </h3>
            <p className="text-gray-700 mb-6">
              While traditional postal carrier positions require on-site presence, USPS and related government 
              agencies increasingly offer remote administrative, data processing, and customer service roles. 
              These positions allow you to support postal operations from the comfort of your home while enjoying 
              federal employment benefits.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Types of Remote Postal & Government Jobs
            </h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Data Entry & Processing:</strong> Input mail tracking information, customer data, and administrative records</li>
              <li><strong>Customer Service:</strong> Handle inquiries via phone, email, or chat about postal services and shipments</li>
              <li><strong>Administrative Support:</strong> Assist with scheduling, documentation, and office coordination remotely</li>
              <li><strong>Quality Assurance:</strong> Review processes and ensure compliance with postal regulations</li>
              <li><strong>Claims Processing:</strong> Handle insurance claims and customer disputes</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Benefits of Federal Remote Work
            </h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Comprehensive Benefits:</strong> Health insurance, retirement plans (FERS), and paid time off</li>
              <li><strong>Job Security:</strong> Federal positions offer exceptional stability and protection</li>
              <li><strong>Competitive Pay:</strong> Government pay scales with regular increases and locality adjustments</li>
              <li><strong>Work-Life Balance:</strong> Predictable schedules and generous leave policies</li>
              <li><strong>Career Growth:</strong> Opportunities to advance within the federal system</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              How to Find Legitimate USPS Remote Jobs
            </h3>
            <p className="text-gray-700 mb-4">
              <strong>Official Sources:</strong> Always apply through official channels:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>USAJOBS.gov - The official federal job board</li>
              <li>USPS.com/careers - Direct postal service opportunities</li>
              <li>ClickClickJob - Aggregated legitimate remote positions</li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Scam Warning:</strong> Legitimate USPS jobs never require upfront payment for applications, 
                background checks, or training materials. Be cautious of job offers that seem too good to be true 
                or come from unofficial email addresses.
              </p>
            </div>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Requirements for Government Remote Positions
            </h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Citizenship:</strong> U.S. citizenship is typically required for federal positions</li>
              <li><strong>Background Check:</strong> All federal employees must pass security clearance</li>
              <li><strong>Technology:</strong> Reliable internet connection and home office setup</li>
              <li><strong>Experience:</strong> Entry-level positions available, though some roles require specific skills</li>
              <li><strong>Education:</strong> Requirements vary by position, from high school diploma to college degrees</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Application Tips
            </h3>
            <ol className="list-decimal pl-6 mb-6 text-gray-700 space-y-2">
              <li><strong>Create a USAJOBS Profile:</strong> Build a comprehensive profile highlighting your federal-relevant experience</li>
              <li><strong>Use Keywords:</strong> Federal applications are screened by automated systems - use exact terminology from job postings</li>
              <li><strong>Detail Your Experience:</strong> Federal resumes should be longer and more detailed than private sector ones</li>
              <li><strong>Include Relevant Training:</strong> List all certifications, security clearances, and government-specific qualifications</li>
              <li><strong>Be Patient:</strong> Federal hiring can take 3-6 months from application to offer</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Get USPS & Government Jobs Delivered to Your Inbox
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Be the first to know about new federal remote opportunities. Weekly updates with legitimate positions.
            </p>
            <EmailCaptureForm 
              source="usps-remote-jobs-page"
            />
          </div>
        </div>
      </section>

      {/* Internal Links Section */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Related Remote Job Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/data-processing-jobs-remote"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Data Processing Jobs
            </Link>
            <Link 
              href="/part-time-remote-admin-jobs"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Part-Time Admin Jobs
            </Link>
            <Link 
              href="/work-from-home-administrative-jobs"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              Administrative Jobs
            </Link>
            <Link 
              href="/"
              className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition-all"
            >
              All Remote Jobs
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/jobs`
      : (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000/api/jobs'
        : 'https://clickclickjob.vercel.app/api/jobs');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'ClickClickJob/1.0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    let jobs = [];
    
    if (Array.isArray(result)) {
      jobs = result;
    } else if (result.jobs && Array.isArray(result.jobs)) {
      jobs = result.jobs;
    }
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const validJobs = jobs.filter((job: any) => {
      if (!job || !job._id || !job.title || !job.company) return false;
      const jobDate = new Date(job.postedDate || job.scrapedDate || job.createdAt);
      return jobDate >= thirtyDaysAgo;
    });
    
    return {
      props: {
        jobs: validJobs.slice(0, 50),
        recentJobsCount: validJobs.length
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        jobs: [],
        recentJobsCount: 0,
        error: error instanceof Error ? error.message : 'Failed to load jobs'
      }
    };
  }
};

export default USPSRemoteJobsPage;

