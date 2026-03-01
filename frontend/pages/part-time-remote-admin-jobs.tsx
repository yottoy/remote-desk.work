import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
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

const PartTimeRemoteAdminJobsPage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filterChips = [
    { label: 'Entry-Level', value: 'entry-level' },
    { label: 'Flexible Hours', value: 'flexible' },
    { label: '10-20 hrs/week', value: '10-20' },
    { label: '20-30 hrs/week', value: '20-30' }
  ];

  // Filter jobs by part-time
  let partTimeJobs = jobs.filter(job => {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    return title.includes('part-time') || 
           title.includes('part time') || 
           description.includes('part-time') ||
           description.includes('part time') ||
           (job as any).jobType?.toLowerCase().includes('part');
  });
  
  // If no specific part-time jobs found, show all jobs as fallback
  if (partTimeJobs.length === 0) {
    partTimeJobs = jobs.slice(0, 12);
  }

  const filteredJobs = activeFilter
    ? partTimeJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        if (activeFilter === 'entry-level') {
          return title.includes('entry') || description.includes('entry-level');
        }
        if (activeFilter === 'flexible') {
          return title.includes('flexible') || description.includes('flexible');
        }
        return true;
      })
    : partTimeJobs;

  // FAQ items derived from page content
  const faqItems = [
    {
      question: 'What are part-time remote administrative jobs?',
      answer: 'Part-time remote administrative jobs are positions that require 10-30 hours per week and can be performed from home. Common roles include virtual assistants, data entry specialists, customer service representatives, administrative support coordinators, and executive assistants.'
    },
    {
      question: 'How much do part-time remote admin jobs pay?',
      answer: 'Hourly rates for part-time remote admin work range from $15-35 per hour depending on experience and specialization. Entry-level positions start around $15-20/hour, while experienced administrative professionals can earn $25-35/hour or more.'
    },
    {
      question: 'Who hires part-time remote administrative staff?',
      answer: 'Startups, small to medium-sized businesses, and solopreneurs frequently hire part-time remote administrative staff. These employers value flexibility and often prefer hiring skilled professionals on a part-time basis rather than committing to full-time salaries.'
    },
    {
      question: 'Are part-time remote admin jobs entry-level friendly?',
      answer: 'Yes, many part-time remote admin roles are entry-level friendly. Positions like data entry specialist require minimal experience, while virtual assistant and customer service representative roles are ideal for those with strong organizational and communication skills.'
    },
    {
      question: 'What hours do part-time remote admin jobs typically require?',
      answer: 'Most part-time remote admin roles fall into two categories: 10-20 hours per week (perfect for supplemental income) or 20-30 hours per week (nearly full-time hours with more flexibility). Many positions also offer evening and weekend shifts.'
    }
  ];

  // JSON-LD Structured Data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer }
    }))
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://www.clickclickjob.com' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Part-Time Remote Administrative Jobs', 'item': 'https://www.clickclickjob.com/part-time-remote-admin-jobs' }
    ]
  };

  const remoteLocationTerms = ['remote', 'worldwide', 'us', 'usa', 'united states', 'work from home', 'wfh', 'anywhere', 'telecommute'];
  const jobSchemas = filteredJobs
    .filter(job => {
      const loc = job.location?.toLowerCase().trim() || '';
      return !loc || remoteLocationTerms.includes(loc);
    })
    .slice(0, 10)
    .map(job => {
      const datePosted = job.postedDate ? new Date(job.postedDate).toISOString() : new Date().toISOString();
      const validThroughDate = new Date(datePosted);
      validThroughDate.setDate(validThroughDate.getDate() + 30);
      const desc = (job as any).descriptionText || job.description || `${job.title} position at ${job.company}.`;
      return {
        '@context': 'https://schema.org/',
        '@type': 'JobPosting',
        'title': job.title || 'Remote Position',
        'description': desc.length < 200 ? desc + ` This remote ${job.title} role offers the flexibility to work from home.` : desc,
        'datePosted': datePosted,
        'validThrough': validThroughDate.toISOString(),
        'hiringOrganization': { '@type': 'Organization', 'name': job.company || 'Confidential Employer' },
        'jobLocation': {
          '@type': 'Place',
          'address': {
            '@type': 'PostalAddress',
            'addressCountry': 'US'
          }
        },
        'jobLocationType': 'TELECOMMUTE',
        'applicantLocationRequirements': { '@type': 'Country', 'name': 'US' },
        'employmentType': 'PART_TIME',
        'baseSalary': {
          '@type': 'MonetaryAmount',
          'currency': 'USD',
          'value': {
            '@type': 'QuantitativeValue',
            'minValue': 18,
            'maxValue': 28,
            'unitText': 'HOUR'
          }
        }
      };
    });

  return (
    <Layout
      title="Part-Time Remote Administrative Jobs | Flexible Hours | ClickClickJob"
      description="Find part-time remote administrative jobs. Flexible hours, work from anywhere. Browse vetted part-time admin positions updated daily. Entry-level welcome."
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        {jobSchemas.map((schema, index) => (
          <script
            key={`job-schema-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            Part-Time Remote Administrative Jobs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-center">
            Flexible hours, work from anywhere. Browse vetted part-time admin positions updated daily.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search part-time admin jobs..."
              filterChips={filterChips}
              onSearch={(query) => console.log(query)}
              onFilterChange={(filters) => console.log(filters)}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <button
              onClick={() => setActiveFilter(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !activeFilter 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => setActiveFilter('entry-level')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'entry-level'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              Entry-Level
            </button>
            <button
              onClick={() => setActiveFilter('flexible')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'flexible'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              Flexible Hours
            </button>
            <button
              onClick={() => setActiveFilter('10-20')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === '10-20'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              10-20 hrs/week
            </button>
            <button
              onClick={() => setActiveFilter('20-30')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === '20-30'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              20-30 hrs/week
            </button>
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Part-Time Roles</h2>
          
          {filteredJobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
              {filteredJobs.slice(0, 6).map(job => (
                <ImprovedJobCard 
                  key={job._id} 
                  job={job} 
                  variant="compact" 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg mb-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Loading part-time positions</h3>
              <p className="mt-2 text-sm text-gray-500">
                Browse all administrative jobs for more opportunities.
              </p>
              <Link href="/jobs" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                View All Jobs →
              </Link>
            </div>
          )}

          {filteredJobs.length > 6 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">All Part-Time Positions</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.slice(6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Benefits of Part-Time Remote Administrative Work</h2>
          
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              Part-time remote administrative work offers exceptional flexibility for students, parents, retirees, and anyone seeking work-life balance. These positions typically require 10-30 hours per week, allowing you to maintain other commitments while earning income.
            </p>
            
            <p className="text-lg text-gray-700 mb-6">
              Hourly rates for part-time admin work range from $15-35 per hour depending on experience and specialization. Entry-level positions start around $15-20/hour, while experienced administrative professionals can earn $25-35/hour or more. Most part-time roles fall into two categories: 10-20 hours per week (perfect for supplemental income) or 20-30 hours per week (nearly full-time hours with more flexibility).
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Common Part-Time Remote Admin Roles</h2>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold">Virtual Assistant (part-time)</span>
                  <p className="text-gray-600">Provide administrative support, email management, and scheduling assistance. Ideal for those with strong organizational skills.</p>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold">Data Entry Specialist (part-time)</span>
                  <p className="text-gray-600">Enter and maintain data accuracy in databases and systems. Entry-level friendly with minimal experience required.</p>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold">Customer Service Representative (part-time)</span>
                  <p className="text-gray-600">Handle customer inquiries via phone, email, or chat. Evening and weekend shifts often available.</p>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold">Administrative Support Coordinator</span>
                  <p className="text-gray-600">Coordinate projects, manage documentation, and support team operations. Requires strong communication skills.</p>
                </div>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-semibold">Executive Assistant (part-time)</span>
                  <p className="text-gray-600">Support executives with calendar management, travel arrangements, and correspondence. Higher pay for experienced professionals.</p>
                </div>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Who Hires Part-Time Remote Admins?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Startups, small to medium-sized businesses, and solopreneurs frequently hire part-time remote administrative staff. These employers value flexibility and often prefer hiring skilled professionals on a part-time basis rather than committing to full-time salaries. This creates abundant opportunities for remote workers seeking part-time arrangements.
            </p>
          </div>

          {/* Internal Links */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Job Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link 
                href="/categories/virtual-assistant"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Virtual Assistant →
              </Link>
              <Link 
                href="/categories/data-entry"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Data Entry →
              </Link>
              <Link 
                href="/categories/customer-service"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Customer Service →
              </Link>
              <Link 
                href="/categories/administrative"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Administrative →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Get part-time remote jobs delivered weekly
          </h2>
          <p className="text-gray-600 mb-6">
            Never miss a new part-time opportunity. Get curated listings every Monday.
          </p>
          <EmailCaptureForm
            source="part-time-admin-jobs"
            variant="inline"
            className="max-w-md mx-auto"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Find Your Perfect Part-Time Role?
          </h2>
          <p className="text-blue-100 mb-8 max-w-3xl mx-auto">
            Browse all remote administrative opportunities or explore full-time positions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/jobs"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50"
            >
              Browse All Jobs
            </Link>
            <Link 
              href="/work-from-home-administrative-jobs"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-600"
            >
              Full-Time Admin Jobs
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
    
    // Filter for recent jobs (30 days)
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

export default PartTimeRemoteAdminJobsPage;

