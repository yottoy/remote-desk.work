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
  entryLevelJobs: JobListing[];
  partTimeJobs: JobListing[];
  medicalJobs: JobListing[];
}

const RemoteDataEntryJobsPage: React.FC<KeywordPageProps> = ({ 
  title, 
  h1, 
  description, 
  faqItems, 
  jobs,
  entryLevelJobs,
  partTimeJobs,
  medicalJobs
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/remote-data-entry-jobs`;

  // Available filters
  const filters = [
    { label: 'All Jobs', value: null, count: jobs.length },
    { label: 'Entry Level', value: 'entry-level', count: entryLevelJobs.length },
    { label: 'Part Time', value: 'part-time', count: partTimeJobs.length },
    { label: 'Full Time', value: 'full-time', count: jobs.filter(j => j.jobType === 'Full-time').length },
  ];

  // Filtered jobs based on selection
  const getFilteredJobs = () => {
    if (!activeFilter) return jobs;
    if (activeFilter === 'entry-level') return entryLevelJobs;
    if (activeFilter === 'part-time') return partTimeJobs;
    if (activeFilter === 'full-time') return jobs.filter(j => j.jobType === 'Full-time');
    return jobs;
  };

  const filteredJobs = getFilteredJobs();

  // Generate schemas
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Remote Data Entry Jobs', url: pageUrl }
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
          {/* Breadcrumb Navigation */}
          <nav className="mb-8 text-sm text-gray-600" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-gray-900 font-medium">Remote Data Entry Jobs</li>
            </ol>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{h1}</h1>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-xl text-gray-700 leading-relaxed">
              Looking for <strong>remote data entry jobs</strong>? You've found the best resource for <strong>work from home 
              data entry jobs</strong> that are 100% legitimate and verified. Whether you're searching for <strong>entry level 
              data entry jobs remote</strong>, <strong>part time data entry jobs remote</strong>, or specialized positions, 
              we have opportunities for all experience levels. All listings are manually screened to protect you from scams.
            </p>
            <div className="flex items-center gap-6 mt-6 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Verified Employers Only</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">No Scam Listings</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Updated Daily</span>
              </div>
            </div>
            <p className="text-base text-gray-600 mt-4">
              <em>Updated: February 2026</em> | {jobs.length}+ active positions
            </p>
          </div>

          {/* Main Job Listings Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Latest Remote Data Entry Job Listings</h2>
            
            {/* Job filters */}
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
            
            {/* Job listings */}
            {filteredJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.slice(0, 30).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="remote-data-entry-jobs"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found in this category</h3>
                <p className="text-gray-600 mb-4">Try a different filter or check back soon for new postings.</p>
              </div>
            )}
          </div>

          {/* Entry Level Data Entry Jobs Section */}
          {entryLevelJobs.length > 0 && (
            <div className="mb-12 bg-blue-50 rounded-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Entry Level Data Entry Jobs (No Experience Required)</h2>
                <Link href="/remote-data-entry-jobs-no-experience" className="text-blue-600 hover:text-blue-700 font-medium">
                  View All →
                </Link>
              </div>
              <p className="text-gray-700 mb-6">
                Perfect for beginners! These <strong>entry level data entry jobs remote</strong> positions require no prior 
                experience and often provide training. Great starting point for building your remote work career.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {entryLevelJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="remote-data-entry-jobs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Part-Time Data Entry Section */}
          {partTimeJobs.length > 0 && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Part-Time & Flexible Data Entry Positions</h2>
              </div>
              <p className="text-gray-700 mb-6">
                Looking for flexibility? These <strong>part time data entry jobs remote</strong> offer flexible schedules, 
                evening and weekend options, and work-life balance.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {partTimeJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="remote-data-entry-jobs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Data Entry Jobs by Industry */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Data Entry Jobs by Industry</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/medical-data-entry-jobs" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Medical Data Entry Jobs</h3>
                <p className="text-gray-600 mb-4">
                  Work with healthcare data, patient records, and medical billing. HIPAA training provided.
                </p>
                {medicalJobs.length > 0 && (
                  <p className="text-sm text-blue-600 font-medium">{medicalJobs.length} positions available →</p>
                )}
              </Link>
              <div className="block bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Legal Data Entry Jobs</h3>
                <p className="text-gray-600 mb-4">
                  Process legal documents, case files, and court records. Detail-oriented work.
                </p>
                <p className="text-sm text-gray-500">Coming soon</p>
              </div>
              <Link href="/jobs" className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-l-4 border-purple-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">General Data Entry Positions</h3>
                <p className="text-gray-600 mb-4">
                  Admin, clerical, and general office data entry across various industries.
                </p>
                <p className="text-sm text-blue-600 font-medium">Browse positions →</p>
              </Link>
            </div>
          </div>

          {/* Types of Data Entry Work */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Types of Data Entry Work</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Online Data Entry</h3>
                <p className="text-sm text-gray-600">Web-based data input into cloud systems and databases</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Copy/Paste Jobs</h3>
                <p className="text-sm text-gray-600">Transfer data between documents and systems</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Form Filling</h3>
                <p className="text-sm text-gray-600">Complete online forms with provided information</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Spreadsheet Data Entry</h3>
                <p className="text-sm text-gray-600">Input and organize data in Excel or Google Sheets</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Database Entry</h3>
                <p className="text-sm text-gray-600">Add and update records in company databases</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Transcription</h3>
                <p className="text-sm text-gray-600">Convert audio or handwritten content to digital text</p>
              </div>
            </div>
          </div>

          {/* How to Spot Legitimate Jobs */}
          <div className="mb-12 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">🚨 How to Spot Legitimate Data Entry Jobs</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-green-700 mb-4">✅ Green Flags (Legitimate)</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Clear job description with specific duties</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Company name and website provided</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Realistic pay rates ($12-18/hour typical)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">No upfront payment required</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">Professional application process</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-red-700 mb-4">🚩 Red Flags (Scams)</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700">Requests for upfront payment or fees</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700">Unrealistic pay ($50+ per hour)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700">Vague job description or company info</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700">Asks for sensitive financial information upfront</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-gray-700">Pressures you to "act now" or make quick decisions</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Remember:</strong> Legitimate employers will NEVER ask you to pay for training, equipment, or background 
                checks upfront. All jobs on ClickClickJob are screened, but always research companies before applying.
              </p>
            </div>
          </div>

          {/* Skills Needed Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Skills Needed for Data Entry Jobs</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Typing Speed:</strong>
                      <span className="text-gray-700"> 40+ WPM with high accuracy (test at typing.com)</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Attention to Detail:</strong>
                      <span className="text-gray-700"> Critical for accuracy and data quality</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Basic Software:</strong>
                      <span className="text-gray-700"> Excel, Google Sheets, Word processing</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Time Management:</strong>
                      <span className="text-gray-700"> Meet deadlines and manage workload effectively</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Needed:</h3>
                <ul className="space-y-3 text-gray-700">
                  <li>• Reliable computer (desktop or laptop)</li>
                  <li>• Stable high-speed internet (minimum 10 Mbps)</li>
                  <li>• Quiet workspace free from distractions</li>
                  <li>• Headset (for audio transcription tasks)</li>
                  <li>• Optional: Dual monitors for efficiency</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="mb-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Getting Started With Data Entry</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">1. No Experience? Start Here</h3>
                <p className="text-gray-700">
                  Look for entry-level positions that explicitly state "no experience required." Many companies provide 
                  training and start you with simple tasks to build your skills and confidence.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Build Your Skills</h3>
                <p className="text-gray-700">
                  Take free typing courses, learn Excel basics through YouTube tutorials, and practice accuracy. Consider 
                  free courses on platforms like Coursera or edX for advanced spreadsheet skills.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Create a Resume for Data Entry</h3>
                <p className="text-gray-700">
                  Highlight: typing speed, computer proficiency, attention to detail, any administrative experience, 
                  and relevant software skills (Excel, Google Workspace). Include remote work capabilities.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Apply Strategically</h3>
                <p className="text-gray-700">
                  Start with 3-5 applications per day to quality positions. Tailor your application to each job. 
                  Follow up after 1 week if you haven't heard back.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          {faqItems && faqItems.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions About Remote Data Entry</h2>
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
              <Link href="/medical-data-entry-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Medical Data Entry →</h3>
                <p className="text-sm text-gray-600">Healthcare data entry positions</p>
              </Link>
              <Link href="/entry-level-data-analyst-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Data Analyst Jobs →</h3>
                <p className="text-sm text-gray-600">Analyze data, not just enter it</p>
              </Link>
              <Link href="/customer-service-work-from-home-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Customer Service →</h3>
                <p className="text-sm text-gray-600">Remote support positions</p>
              </Link>
              <Link href="/remote-administrative-assistant-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Admin Assistant →</h3>
                <p className="text-sm text-gray-600">Virtual administrative roles</p>
              </Link>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-10 text-center shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Remote Data Entry Career?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse {jobs.length}+ verified legitimate remote data entry opportunities or sign up for daily job alerts.
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
  const keywordSlug = 'remote-data-entry-jobs';
  const pageData = keywordPagesData[keywordSlug];
  
  if (!pageData) {
    return { notFound: true };
  }
  
  try {
    // Fetch all data entry jobs
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/jobs?category=data-entry&limit=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let jobs: JobListing[] = [];
    
    if (response.ok) {
      const data = await response.json();
      jobs = data.jobs || [];
      
      // Filter for data entry related jobs
      jobs = jobs.filter(job => {
        const searchText = `${job.title} ${job.description}`.toLowerCase();
        return searchText.includes('data entry') || 
               searchText.includes('data input') ||
               searchText.includes('data processing') ||
               searchText.includes('data clerk');
      });
    }

    // Categorize jobs
    const entryLevelJobs = jobs.filter(j => 
      j.experienceLevel?.toLowerCase().includes('entry') || 
      j.experienceLevel?.toLowerCase().includes('no experience') ||
      j.description?.toLowerCase().includes('no experience required')
    );

    const partTimeJobs = jobs.filter(j => 
      j.jobType?.toLowerCase().includes('part') ||
      j.title?.toLowerCase().includes('part-time')
    );

    const medicalJobs = jobs.filter(j => {
      const text = `${j.title} ${j.description}`.toLowerCase();
      return text.includes('medical') || text.includes('healthcare') || text.includes('health');
    });

    // If no jobs found, create fallback
    if (jobs.length === 0) {
      jobs = [
        {
          _id: 'data-entry-fallback-1',
          title: 'Remote Data Entry Specialist',
          company: 'Various Companies',
          location: 'Remote - US',
          salary: '$12-18/hr',
          jobType: 'Full-time',
          experienceLevel: 'Entry Level',
          description: 'We regularly feature new remote data entry positions from legitimate companies. Check back daily for the latest opportunities in data entry.',
          postedDate: new Date().toISOString(),
          featured: false,
          skills: ['Data Entry', 'Typing', 'Attention to Detail', 'Microsoft Excel'],
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
        entryLevelJobs: entryLevelJobs.slice(0, 20),
        partTimeJobs: partTimeJobs.slice(0, 20),
        medicalJobs: medicalJobs.slice(0, 10)
      }
    };
  } catch (error) {
    console.error('Error fetching remote data entry jobs:', error);
    
    const fallbackJobs: JobListing[] = [
      {
        _id: 'data-entry-fallback-1',
        title: 'Remote Data Entry Specialist',
        company: 'Various Companies',
        location: 'Remote - US',
        salary: '$12-18/hr',
        jobType: 'Full-time',
        experienceLevel: 'Entry Level',
        description: 'We regularly feature new remote data entry positions from legitimate companies. Check back daily for the latest opportunities in data entry.',
        postedDate: new Date().toISOString(),
        featured: false,
        skills: ['Data Entry', 'Typing', 'Attention to Detail', 'Microsoft Excel'],
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
        entryLevelJobs: fallbackJobs,
        partTimeJobs: [],
        medicalJobs: []
      }
    };
  }
};

export default RemoteDataEntryJobsPage;
