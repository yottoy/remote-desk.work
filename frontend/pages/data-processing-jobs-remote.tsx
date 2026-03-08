import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import ImprovedJobCard from '../components/common/ImprovedJobCard';
import SearchBar from '../components/common/SearchBar';
import SchemaHead from '../components/seo/SchemaHead';
import { generateFAQSchema, generateBreadcrumbSchema, generateJobPostingSchema } from '../utils/schemaGenerator';
import { EmailCaptureForm } from '../components/email-capture/EmailCaptureForm';
import type { Job } from '../types/job';

interface PageProps {
  jobs: Job[];
  recentJobsCount: number;
  error?: string;
}

const DataProcessingJobsPage: React.FC<PageProps> = ({ jobs, recentJobsCount, error }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/data-processing-jobs-remote`;

  // FAQ items based on page content
  const faqItems = [
    {
      question: 'What is data processing work?',
      answer: 'Data processing work involves collecting, organizing, and managing information in digital systems. This includes data entry, verification, database management, and quality control. Data processing specialists ensure accuracy and consistency across organizational databases.'
    },
    {
      question: 'How much do data processing jobs pay?',
      answer: 'Typical hourly rates range from $12-25/hour. Entry-level roles start at $12-16/hour, while experienced professionals earn $20-25/hour or more. Specialized positions in healthcare, legal, or financial sectors often pay premium rates. Performance bonuses for high accuracy are common.'
    },
    {
      question: 'What equipment do I need for remote data processing?',
      answer: 'You need a desktop or laptop with Windows 10/11 or Mac OS with minimum 8GB RAM, internet speed of at least 25 Mbps download and 10 Mbps upload (wired preferred), Microsoft Office or Google Workspace, and a quiet distraction-free workspace with ergonomic setup.'
    },
    {
      question: 'What types of data processing jobs are available?',
      answer: 'Common types include Data Entry Clerk ($12-20/hour), Data Verification Specialist ($15-22/hour), Database Administrator ($20-35/hour), Data Quality Analyst ($18-28/hour), Claims Processing Specialist ($16-25/hour), and Medical Records Processor ($17-26/hour).'
    },
    {
      question: 'How can I spot legitimate data processing jobs?',
      answer: 'Legitimate employers have clear job descriptions with specific duties, professional interview processes, verifiable company websites, realistic pay rates, standard onboarding with W-4 forms, and provide training at no cost. Avoid jobs requesting upfront payment, promising unrealistic earnings, or pressuring immediate starts without interviews.'
    }
  ];

  const filterChips = [
    { label: 'Entry-Level', value: 'entry-level' },
    { label: 'No Experience Required', value: 'no-experience' },
    { label: 'Full-Time', value: 'full-time' },
    { label: 'Part-Time', value: 'part-time' }
  ];

  // Filter jobs for data processing related positions
  let dataProcessingJobs = jobs.filter(job => {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    return title.includes('data process') || 
           title.includes('data entry') ||
           title.includes('database') ||
           description.includes('data processing') ||
           description.includes('data verification');
  });
  
  // If no specific data processing jobs found, show data entry and admin jobs
  if (dataProcessingJobs.length === 0) {
    dataProcessingJobs = jobs.filter(job => {
      const title = job.title?.toLowerCase() || '';
      return title.includes('data') || title.includes('entry') || title.includes('administrative');
    });
  }
  
  // If still no jobs, show all jobs as fallback
  if (dataProcessingJobs.length === 0) {
    dataProcessingJobs = jobs.slice(0, 12);
  }

  const filteredJobs = activeFilter
    ? dataProcessingJobs.filter(job => {
        const title = job.title?.toLowerCase() || '';
        const description = job.description?.toLowerCase() || '';
        if (activeFilter === 'entry-level' || activeFilter === 'no-experience') {
          return title.includes('entry') || description.includes('entry-level') || description.includes('no experience');
        }
        if (activeFilter === 'full-time') {
          return (job as any).jobType?.toLowerCase().includes('full');
        }
        if (activeFilter === 'part-time') {
          return (job as any).jobType?.toLowerCase().includes('part');
        }
        return true;
      })
    : dataProcessingJobs;

  // Generate structured data schemas
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Data Processing Jobs Remote', url: pageUrl }
  ]);

  const faqSchema = generateFAQSchema(faqItems);

  const jobSchemas = dataProcessingJobs.slice(0, 10).map(job => generateJobPostingSchema({
    _id: job._id,
    title: job.title,
    company: job.company,
    location: (job as any).location || 'Remote',
    description: job.description || `${job.title} position at ${job.company}.`,
    salary: (job as any).salary,
    postedDate: job.postedDate ? new Date(job.postedDate).toISOString() : new Date().toISOString(),
    employmentType: (job as any).employmentType || (job as any).jobType,
    experienceLevel: (job as any).experienceLevel,
  }));

  const allSchemas = [breadcrumbSchema, faqSchema, ...jobSchemas];

  const pageTitle = "Data Processing Jobs from Home - Remote Positions | ClickClickJob";
  const pageDescription = "Find legitimate data processing jobs from home. Work from home data processing positions updated regularly. No scams, entry-level to experienced roles available.";

  return (
    <>
    <SchemaHead
      schemas={allSchemas}
      title={pageTitle}
      description={pageDescription}
      canonical={pageUrl}
      openGraph={{
        title: pageTitle,
        description: pageDescription,
        url: pageUrl,
        type: 'website'
      }}
    />
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-center">
            Data Processing Jobs from Home
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-center">
            Find legitimate work from home data processing positions. No scams, regularly updated listings.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder="Search data processing jobs..."
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
              onClick={() => setActiveFilter('no-experience')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'no-experience'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              No Experience Required
            </button>
            <button
              onClick={() => setActiveFilter('full-time')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'full-time'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              Full-Time
            </button>
            <button
              onClick={() => setActiveFilter('part-time')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'part-time'
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }`}
            >
              Part-Time
            </button>
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Data Processing Opportunities</h2>
          
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z M8 10h8 M8 14h5" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Loading data processing positions</h3>
              <p className="mt-2 text-sm text-gray-500">
                Browse all data entry and administrative jobs for more opportunities.
              </p>
              <Link href="/jobs" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                View All Jobs →
              </Link>
            </div>
          )}

          {filteredJobs.length > 6 && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 mt-12">All Data Processing Jobs</h2>
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
          <article className="prose max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What is Data Processing Work?</h2>
            
            <p className="text-lg text-gray-700 mb-6">
              Data processing work involves collecting, organizing, and managing information in digital systems. This encompasses data entry, verification, database management, and quality control. Data processing specialists ensure accuracy and consistency across organizational databases.
            </p>
            
            <p className="text-lg text-gray-700 mb-6">
              Typical tasks include entering customer information, updating inventory systems, processing forms and applications, verifying data accuracy, cleaning and organizing databases, and generating reports. These roles require attention to detail, accuracy, and proficiency with common office software.
            </p>

            <p className="text-lg text-gray-700 mb-8">
              Skills required include fast and accurate typing (typically 40+ WPM), basic computer proficiency, knowledge of Microsoft Excel or Google Sheets, attention to detail, and ability to follow procedures. Many positions provide on-the-job training for specific software systems.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Processing Job Types</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200 mb-8">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Entry Clerk</h3>
                <p className="text-gray-700 mb-2">Enter information from various sources into computer systems and databases.</p>
                <p className="text-sm text-gray-600">Pay range: $12-20/hour | Entry-level friendly</p>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Verification Specialist</h3>
                <p className="text-gray-700 mb-2">Review and validate data accuracy, identify errors, and ensure quality standards.</p>
                <p className="text-sm text-gray-600">Pay range: $15-22/hour | Some experience preferred</p>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Database Administrator</h3>
                <p className="text-gray-700 mb-2">Maintain database systems, ensure data integrity, and manage access permissions.</p>
                <p className="text-sm text-gray-600">Pay range: $20-35/hour | Requires technical skills</p>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Data Quality Analyst</h3>
                <p className="text-gray-700 mb-2">Analyze data sets for accuracy, implement quality control measures, and identify improvement opportunities.</p>
                <p className="text-sm text-gray-600">Pay range: $18-28/hour | Analytical skills required</p>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Claims Processing Specialist</h3>
                <p className="text-gray-700 mb-2">Process insurance or financial claims, verify documentation, and update records.</p>
                <p className="text-sm text-gray-600">Pay range: $16-25/hour | Industry-specific training provided</p>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Medical Records Processor</h3>
                <p className="text-gray-700 mb-2">Manage patient records, ensure HIPAA compliance, and maintain healthcare databases.</p>
                <p className="text-sm text-gray-600">Pay range: $17-26/hour | Healthcare knowledge helpful</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How Much Do Data Processing Jobs Pay?</h2>
            <p className="text-lg text-gray-700 mb-6">
              Typical hourly rates range from $12-25/hour for data processing positions. Entry-level roles start at $12-16/hour, while experienced professionals earn $20-25/hour or more. Specialized positions in healthcare, legal, or financial sectors often pay premium rates.
            </p>
            
            <p className="text-lg text-gray-700 mb-8">
              Factors affecting pay include typing speed and accuracy, experience with specific software systems, industry specialization, shift availability (evening/weekend shifts may pay more), and geographic location of the employer. Many employers offer performance bonuses for high accuracy rates.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Equipment Needed for Remote Data Processing</h2>
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold text-gray-900">Computer Requirements:</span>
                    <span className="text-gray-700"> Desktop or laptop with Windows 10/11 or Mac OS. Minimum 8GB RAM, reliable processor for multi-tasking.</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold text-gray-900">Internet Speed:</span>
                    <span className="text-gray-700"> Minimum 25 Mbps download, 10 Mbps upload. Wired connection preferred for stability.</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold text-gray-900">Software:</span>
                    <span className="text-gray-700"> Microsoft Office or Google Workspace. Employers typically provide specialized database software.</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="font-semibold text-gray-900">Workspace:</span>
                    <span className="text-gray-700"> Quiet, distraction-free area with comfortable desk and ergonomic chair. Good lighting to reduce eye strain.</span>
                  </div>
                </li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How to Spot Legitimate Data Processing Jobs</h2>
            <p className="text-lg text-gray-700 mb-4">
              Unfortunately, scams targeting data entry and data processing job seekers are common. Here's how to identify legitimate opportunities:
            </p>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6">
              <h4 className="text-lg font-semibold text-red-900 mb-3">Red Flags to Avoid:</h4>
              <ul className="space-y-2 text-red-800">
                <li>• Requests for upfront payment or "training fees"</li>
                <li>• Promises of unrealistic earnings ($50-100/hour for basic data entry)</li>
                <li>• Vague job descriptions without specific responsibilities</li>
                <li>• No company website or verifiable business information</li>
                <li>• Pressure to start immediately without an interview</li>
                <li>• Requests for personal financial information before hiring</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8">
              <h4 className="text-lg font-semibold text-green-900 mb-3">Signs of Legitimate Employers:</h4>
              <ul className="space-y-2 text-green-800">
                <li>• Clear job description with specific duties and requirements</li>
                <li>• Professional interview process (phone or video)</li>
                <li>• Verifiable company website and online presence</li>
                <li>• Realistic pay rates for the position level</li>
                <li>• Standard onboarding with W-4 forms and employment paperwork</li>
                <li>• Training provided at no cost to you</li>
              </ul>
            </div>

            <p className="text-lg text-gray-700">
              For more guidance on finding legitimate remote work, check our <Link href="/resources/remote-work-guide" className="text-blue-600 hover:text-blue-800 font-medium">comprehensive remote work guide</Link>.
            </p>
          </article>

          {/* Internal Links */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Job Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Link 
                href="/categories/data-processing"
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Data Processing
              </Link>
              <Link 
                href="/categories/data-entry"
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Data Entry
              </Link>
              <Link 
                href="/categories/administrative"
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Administrative
              </Link>
            </div>
          </div>

          {/* Similar Jobs Section */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Remote Job Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                href="/categories/data-entry"
                className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Data Entry Jobs</h4>
                <p className="text-sm text-gray-600">Entry-level data entry positions with flexible schedules</p>
              </Link>
              <Link 
                href="/work-from-home-administrative-jobs"
                className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Administrative Jobs</h4>
                <p className="text-sm text-gray-600">Remote administrative and office support roles</p>
              </Link>
              <Link 
                href="/categories/customer-service"
                className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-900 mb-2">Customer Service</h4>
                <p className="text-sm text-gray-600">Help customers via phone, email, or chat</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Getting Started in Remote Data Processing</h2>
          <p className="text-lg text-gray-700 mb-8">
            Whether you are new to the workforce or transitioning from another field, remote data processing offers a clear path from entry-level positions to well-paying specialist roles. Follow these steps to build a sustainable career.
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Assess Your Current Skills</h3>
                <p className="text-gray-700">
                  Start by evaluating your typing speed, attention to detail, and familiarity with spreadsheet software. Most entry-level data processing roles require a minimum typing speed of 40 words per minute and basic proficiency in Microsoft Excel or Google Sheets. Free online typing tests and skills assessments can help you identify areas to improve before applying.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Learn Required Software and Tools</h3>
                <p className="text-gray-700">
                  Familiarize yourself with the tools commonly used in data processing roles. This includes spreadsheet applications (Excel, Google Sheets), database software (Microsoft Access, basic SQL), and data management platforms. Many employers also use CRM systems like Salesforce or industry-specific tools. Free tutorials and community college courses can build these skills without significant cost.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Start with Entry-Level Positions</h3>
                <p className="text-gray-700">
                  Apply for data entry clerk and junior data processing roles that offer on-the-job training. These positions typically pay $12-16/hour and provide valuable experience with real-world data systems. Focus on building a track record of accuracy and reliability. Many employers promote from within once you demonstrate consistent performance over several months.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Build a Specialization</h3>
                <p className="text-gray-700">
                  After gaining foundational experience, consider specializing in a high-demand area. Healthcare data processing requires knowledge of medical terminology and HIPAA compliance. Financial data processing involves familiarity with accounting concepts and regulatory standards. Legal data processing focuses on case management systems and document review. Specializing allows you to command higher pay rates and access a more targeted job market.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                5
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Advance to Higher-Paying Roles</h3>
                <p className="text-gray-700">
                  With 1-2 years of experience and a specialization, you can move into roles like Data Quality Analyst ($18-28/hour), Claims Processing Specialist ($16-25/hour), or Database Administrator ($20-35/hour). Consider certifications such as Microsoft Office Specialist (MOS) or Certified Data Management Professional (CDMP) to strengthen your resume and negotiate higher compensation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Industries Hiring Remote Data Processors</h2>
          <p className="text-lg text-gray-700 mb-8">
            Data processing roles exist across nearly every industry. Each sector has its own requirements, terminology, and growth opportunities. Here are the industries with the highest demand for remote data processing professionals.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Healthcare</h3>
              <p className="text-gray-700">
                Process patient records, medical billing codes, insurance claims, and lab results. Roles often require familiarity with HIPAA regulations and electronic health record (EHR) systems. Healthcare data processors typically earn $17-26/hour due to the specialized compliance knowledge required.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Finance and Banking</h3>
              <p className="text-gray-700">
                Handle transaction records, loan applications, account updates, and regulatory filings. Financial data processing demands high accuracy and knowledge of compliance standards. Positions in this sector often pay $18-28/hour and may require background checks.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">E-commerce</h3>
              <p className="text-gray-700">
                Manage product listings, inventory databases, order records, and customer information. E-commerce data processors work with platforms like Shopify, Amazon Seller Central, and warehouse management systems. These roles are often entry-level friendly with pay starting at $13-18/hour.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Insurance</h3>
              <p className="text-gray-700">
                Process policy applications, claims documentation, underwriting data, and policyholder records. Insurance data processing roles require attention to regulatory detail and often involve working with proprietary claims management software. Pay ranges from $16-25/hour.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Government</h3>
              <p className="text-gray-700">
                Enter and maintain records for public agencies, including census data, permit applications, tax filings, and benefit program information. Government data processing positions often come with stable hours and benefits. Contractors and direct-hire roles are both common, with pay ranging from $15-24/hour.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real Estate</h3>
              <p className="text-gray-700">
                Manage property listings, transaction records, title documents, and client databases. Real estate data processors work with MLS systems and property management platforms. These roles suit detail-oriented professionals and typically pay $14-22/hour, with busier seasons offering overtime opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Get data processing jobs delivered to your inbox
          </h2>
          <p className="text-gray-600 mb-6">
            Never miss a new opportunity. Receive curated data processing listings every Monday.
          </p>
          <EmailCaptureForm
            source="data-processing-jobs"
            variant="inline"
            className="max-w-md mx-auto"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Start Your Data Processing Career Today
          </h2>
          <p className="text-blue-100 mb-8 max-w-3xl mx-auto">
            Browse all remote opportunities or explore related administrative positions.
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
              Administrative Jobs
            </Link>
          </div>
        </div>
      </section>
    </Layout>
    </>
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

export default DataProcessingJobsPage;

