import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { keywordPagesData } from '../data/keywordPages';
import Layout from '../components/layout/Layout';
import ImprovedJobCard from '../components/common/ImprovedJobCard';
import SchemaHead from '../components/seo/SchemaHead';
import { generateFAQSchema, generateBreadcrumbSchema, generateJobPostingSchema } from '../utils/schemaGenerator';

interface JobListing {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobType?: string;
  experienceLevel?: string;
  description: string;
  postedDate: string;
  featured?: boolean;
  skills?: string[];
  applyUrl?: string;
  employmentType?: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface KeywordPageProps {
  title: string;
  h1: string;
  description: string;
  faqItems: FAQItem[];
  jobs: JobListing[];
  executiveJobs: JobListing[];
  partTimeJobs: JobListing[];
  entryLevelJobs: JobListing[];
  medicalAdminJobs: JobListing[];
}

const RemoteAdministrativeAssistantJobsPage: React.FC<KeywordPageProps> = ({ 
  title, 
  h1, 
  description, 
  faqItems, 
  jobs,
  executiveJobs,
  partTimeJobs,
  entryLevelJobs,
  medicalAdminJobs
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/remote-administrative-assistant-jobs`;

  // Available filters
  const filters = [
    { label: 'All Jobs', value: null, count: jobs.length },
    { label: 'Executive Assistant', value: 'executive', count: executiveJobs.length },
    { label: 'Part Time', value: 'part-time', count: partTimeJobs.length },
    { label: 'Entry Level', value: 'entry-level', count: entryLevelJobs.length },
  ];

  // Filtered jobs
  const getFilteredJobs = () => {
    if (!activeFilter) return jobs;
    if (activeFilter === 'executive') return executiveJobs;
    if (activeFilter === 'part-time') return partTimeJobs;
    if (activeFilter === 'entry-level') return entryLevelJobs;
    return jobs;
  };

  const filteredJobs = getFilteredJobs();

  // Generate schemas
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Remote Administrative Assistant Jobs', url: pageUrl }
  ]);

  const faqSchema = generateFAQSchema(faqItems);

  const jobSchemas = jobs.slice(0, 10).map(job => generateJobPostingSchema({
    _id: job._id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    salary: job.salary,
    postedDate: job.postedDate,
    employmentType: job.employmentType || job.jobType,
    experienceLevel: job.experienceLevel,
  }));

  const allSchemas = [breadcrumbSchema, faqSchema, ...jobSchemas];
  
  return (
    <>
      <SchemaHead
        schemas={allSchemas}
        title={title}
        description={description}
        canonical={pageUrl}
        openGraph={{
          title: title,
          description: description,
          url: pageUrl,
          type: 'website'
        }}
      />
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-gray-600" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-gray-900 font-medium">Remote Administrative Assistant Jobs</li>
            </ol>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{h1}</h1>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-xl text-gray-700 leading-relaxed">
              Find <strong>remote administrative assistant jobs</strong> with verified employers. Whether you're looking for 
              <strong> remote executive assistant jobs</strong>, <strong>part time remote administrative assistant jobs</strong>, 
              or entry-level positions, we have opportunities across all experience levels. Work from home providing professional 
              administrative support with competitive pay and benefits.
            </p>
            <div className="flex items-center gap-6 mt-6 text-sm text-gray-600 flex-wrap">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Verified Employers</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">$32-72K Annual Salary</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Benefits Available</span>
              </div>
            </div>
            <p className="text-base text-gray-600 mt-4">
              <em>Updated: January 2026</em> | {jobs.length}+ active positions
            </p>
          </div>

          {/* Main Job Listings */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Latest Remote Administrative Assistant Jobs</h2>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {filters.map(filter => (
                <button 
                  key={filter.label}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                    activeFilter === filter.value
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
            
            {filteredJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.slice(0, 30).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="remote-administrative-assistant-jobs"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">Check back soon for new administrative assistant opportunities.</p>
              </div>
            )}
          </div>

          {/* Executive Assistant Section */}
          {executiveJobs.length > 0 && (
            <div className="mb-12 bg-purple-50 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Remote Executive Assistant Jobs</h2>
              <p className="text-gray-700 mb-6">
                <strong>Remote executive assistant jobs</strong> supporting C-suite and senior leadership. Higher pay 
                ($52-72K+), more strategic responsibilities, and career advancement opportunities.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {executiveJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="remote-administrative-assistant-jobs"
                  />
                ))}
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Executive Assistant Responsibilities:</strong> Complex calendar management, high-level meeting 
                  coordination, confidential correspondence, travel logistics, expense management, project coordination, 
                  and serving as executive's right hand.
                </p>
              </div>
            </div>
          )}

          {/* Part-Time Section */}
          {partTimeJobs.length > 0 && (
            <div className="mb-12 bg-blue-50 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Part-Time Administrative Assistant Positions</h2>
              <p className="text-gray-700 mb-6">
                <strong>Part time remote administrative assistant jobs</strong> offer 15-30 hours per week with flexible 
                scheduling. Perfect for balancing multiple commitments while earning good income.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {partTimeJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="remote-administrative-assistant-jobs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Entry Level Section */}
          {entryLevelJobs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Entry Level Remote Administrative Assistant Jobs</h2>
              <p className="text-gray-700 mb-6">
                No experience required! These entry-level positions provide training and development opportunities. 
                Perfect for starting your remote administrative career.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {entryLevelJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="remote-administrative-assistant-jobs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Industry-Specific Admin Jobs */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Industry-Specific Admin Jobs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/remote-medical-administrative-jobs" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Medical Administrative Assistant Jobs Remote</h3>
                <p className="text-gray-600 mb-4">
                  Support healthcare providers with patient scheduling, records management, and medical billing. HIPAA training provided.
                </p>
                {medicalAdminJobs.length > 0 && (
                  <p className="text-sm text-blue-600 font-medium">{medicalAdminJobs.length} positions available →</p>
                )}
              </Link>
              <div className="block bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Legal Administrative Assistant Jobs</h3>
                <p className="text-gray-600 mb-4">
                  Support law firms and legal departments with document preparation, case management, and client communication.
                </p>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
              <div className="block bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Real Estate Administrative Assistant</h3>
                <p className="text-gray-600 mb-4">
                  Support real estate agents and property managers with transaction coordination and client management.
                </p>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
            </div>
          </div>

          {/* Skills Needed Section */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Skills Needed for Remote Admin Jobs</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Core Skills</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Calendar Management:</strong>
                      <p className="text-sm text-gray-600">Scheduling meetings, managing appointments, coordinating across time zones</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Email Management:</strong>
                      <p className="text-sm text-gray-600">Professional correspondence, inbox organization, priority management</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Microsoft Office/Google Workspace:</strong>
                      <p className="text-sm text-gray-600">Word processing, spreadsheets, presentations, cloud collaboration</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Communication:</strong>
                      <p className="text-sm text-gray-600">Professional writing, phone etiquette, video conferencing skills</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Organization:</strong>
                      <p className="text-sm text-gray-600">File management, process creation, attention to detail</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Time Management:</strong>
                      <p className="text-sm text-gray-600">Prioritization, deadline management, multitasking</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Tools Used by Remote Admin Assistants</h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Scheduling Software</h4>
                    <p className="text-sm text-gray-600">Calendly, Google Calendar, Outlook, Doodle</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Project Management</h4>
                    <p className="text-sm text-gray-600">Asana, Trello, Monday.com, ClickUp</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Communication</h4>
                    <p className="text-sm text-gray-600">Slack, Microsoft Teams, Zoom, Google Meet</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Document Management</h4>
                    <p className="text-sm text-gray-600">Google Drive, Dropbox, SharePoint, OneDrive</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Career Path Section */}
          <div className="mb-12 bg-blue-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Career Path & Advancement</h2>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-4">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Entry-Level Administrative Assistant</h3>
                    <p className="text-sm text-gray-600">$32-38K/year | General admin tasks, data entry, basic scheduling</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-4">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Administrative Assistant (1-3 years)</h3>
                    <p className="text-sm text-gray-600">$38-46K/year | Complex scheduling, project coordination, team support</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-4">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Senior Administrative Assistant (3-5 years)</h3>
                    <p className="text-sm text-gray-600">$46-52K/year | Department support, process improvement, mentoring</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold mr-4">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Executive Assistant (5+ years)</h3>
                    <p className="text-sm text-gray-600">$52-72K+/year | C-suite support, strategic planning, confidential work</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold mr-4">
                    5
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Office Manager / Chief of Staff</h3>
                    <p className="text-sm text-gray-600">$60-90K+/year | Team leadership, operations management, strategic role</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          {faqItems && faqItems.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
              <div className="max-w-4xl mx-auto space-y-6">
                {faqItems.map((faq, index) => (
                  <div key={index} className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-600">
                    <h3 className="font-semibold text-lg text-gray-900 mb-3">{faq.question}</h3>
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Categories */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Job Categories</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/customer-service-work-from-home-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Customer Service →</h3>
                <p className="text-sm text-gray-600">Support and help desk roles</p>
              </Link>
              <Link href="/remote-data-entry-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Data Entry Jobs →</h3>
                <p className="text-sm text-gray-600">Data processing positions</p>
              </Link>
              <Link href="/entry-level-data-analyst-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Data Analyst →</h3>
                <p className="text-sm text-gray-600">Analytical career path</p>
              </Link>
              <Link href="/jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">All Remote Jobs →</h3>
                <p className="text-sm text-gray-600">Browse all opportunities</p>
              </Link>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-10 text-center shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Remote Admin Career?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse {jobs.length}+ verified remote administrative assistant opportunities with competitive pay and benefits.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/jobs" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-semibold rounded-lg text-white bg-transparent hover:bg-white hover:text-blue-700 transition-colors">
                Browse All Jobs
              </Link>
              <Link href="/newsletter" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-semibold rounded-lg text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                Get Job Alerts
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const keywordSlug = 'remote-administrative-assistant-jobs';
  const pageData = keywordPagesData[keywordSlug];
  
  if (!pageData) {
    return { notFound: true };
  }
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/jobs?category=admin&limit=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let jobs: JobListing[] = [];
    
    if (response.ok) {
      const data = await response.json();
      jobs = data.jobs || [];
      
      jobs = jobs.filter(job => {
        const searchText = `${job.title} ${job.description}`.toLowerCase();
        return searchText.includes('administrative assistant') || 
               searchText.includes('admin assistant') ||
               searchText.includes('executive assistant') ||
               searchText.includes('virtual assistant') ||
               searchText.includes('office assistant') ||
               searchText.includes('administrative support');
      });
    }

    const executiveJobs = jobs.filter(j => {
      const text = `${j.title} ${j.description}`.toLowerCase();
      return text.includes('executive') || text.includes('c-suite') || text.includes('senior');
    });

    const partTimeJobs = jobs.filter(j => 
      j.jobType?.toLowerCase().includes('part') ||
      j.title?.toLowerCase().includes('part-time')
    );

    const entryLevelJobs = jobs.filter(j => 
      j.experienceLevel?.toLowerCase().includes('entry') || 
      j.experienceLevel?.toLowerCase().includes('no experience') ||
      j.description?.toLowerCase().includes('no experience required')
    );

    const medicalAdminJobs = jobs.filter(j => {
      const text = `${j.title} ${j.description}`.toLowerCase();
      return text.includes('medical') || text.includes('healthcare') || text.includes('health');
    });

    if (jobs.length === 0) {
      jobs = [
        {
          _id: 'admin-fallback-1',
          title: 'Remote Administrative Assistant',
          company: 'Various Companies',
          location: 'Remote - US',
          salary: '$32-52K/year',
          jobType: 'Full-time',
          experienceLevel: 'Entry Level',
          description: 'We regularly feature new remote administrative assistant positions. Check back daily for the latest opportunities in virtual administrative support.',
          postedDate: new Date().toISOString(),
          featured: false,
          skills: ['Administrative Support', 'Calendar Management', 'Microsoft Office', 'Communication'],
          applyUrl: '/jobs',
          employmentType: 'FULL_TIME'
        }
      ];
    }
    
    return {
      props: {
        title: pageData.title,
        h1: pageData.h1,
        description: pageData.description,
        faqItems: pageData.faqItems || [],
        jobs: jobs.slice(0, 50),
        executiveJobs: executiveJobs.slice(0, 20),
        partTimeJobs: partTimeJobs.slice(0, 20),
        entryLevelJobs: entryLevelJobs.slice(0, 20),
        medicalAdminJobs: medicalAdminJobs.slice(0, 10)
      }
    };
  } catch (error) {
    console.error('Error fetching admin assistant jobs:', error);
    
    const fallbackJobs: JobListing[] = [
      {
        _id: 'admin-fallback-1',
        title: 'Remote Administrative Assistant',
        company: 'Various Companies',
        location: 'Remote - US',
        salary: '$32-52K/year',
        jobType: 'Full-time',
        experienceLevel: 'Entry Level',
        description: 'We regularly feature new remote administrative assistant positions. Check back daily for the latest opportunities in virtual administrative support.',
        postedDate: new Date().toISOString(),
        featured: false,
        skills: ['Administrative Support', 'Calendar Management', 'Microsoft Office', 'Communication'],
        applyUrl: '/jobs',
        employmentType: 'FULL_TIME'
      }
    ];
    
    return {
      props: {
        title: pageData.title,
        h1: pageData.h1,
        description: pageData.description,
        faqItems: pageData.faqItems || [],
        jobs: fallbackJobs,
        executiveJobs: fallbackJobs,
        partTimeJobs: [],
        entryLevelJobs: fallbackJobs,
        medicalAdminJobs: []
      }
    };
  }
};

export default RemoteAdministrativeAssistantJobsPage;
