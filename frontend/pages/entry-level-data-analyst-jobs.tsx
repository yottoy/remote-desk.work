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
}

const EntryLevelDataAnalystJobsPage: React.FC<KeywordPageProps> = ({ title, h1, description, faqItems, jobs }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/entry-level-data-analyst-jobs`;

  // Filter job types
  const jobTypes = Array.from(new Set(jobs.map(job => job.jobType).filter((type): type is string => !!type)));

  // Filtered jobs
  const filteredJobs = activeFilter 
    ? jobs.filter(job => job.jobType === activeFilter)
    : jobs;

  // Generate schemas
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Entry Level Data Analyst Jobs', url: pageUrl }
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
              <li className="text-gray-900 font-medium">Entry Level Data Analyst Jobs</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-6">{h1}</h1>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-xl text-gray-700 leading-relaxed">
              Looking for <strong>entry level data analyst jobs remote no experience</strong>? You've found the right place. 
              These positions are perfect for breaking into the data analytics field with companies that provide training and 
              mentorship. Whether you're a recent graduate, career changer, or self-taught data enthusiast, these <strong>junior 
              data analyst remote</strong> opportunities offer a path to start your analytics career from home.
            </p>
            <p className="text-lg text-gray-600 mt-4">
              <em>Updated: January 2026</em> | Verified entry-level positions | Training provided | No extensive experience required
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Latest Entry Level Data Analyst Positions</h2>
            
            {/* Job filters */}
            {jobTypes.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                <button 
                  onClick={() => setActiveFilter(null)}
                  className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                    !activeFilter 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Jobs ({jobs.length})
                </button>
                {jobTypes.map(type => (
                  <button 
                    key={type} 
                    onClick={() => setActiveFilter(type)}
                    className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                      activeFilter === type 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
            
            {/* Job listings */}
            {filteredJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="entry-level-data-analyst-jobs"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">We're actively sourcing new entry-level data analyst positions. Check back soon or browse related categories.</p>
                <div className="flex justify-center gap-4 mt-6">
                  <Link href="/jobs" className="text-blue-600 hover:text-blue-700 font-medium">
                    Browse All Jobs →
                  </Link>
                  <Link href="/remote-data-entry-jobs-no-experience" className="text-blue-600 hover:text-blue-700 font-medium">
                    Data Entry Jobs →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Entry Level vs Senior Section */}
          <div className="mb-12 bg-blue-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Entry Level vs Senior Data Analyst Jobs</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-blue-700 mb-3">Entry Level</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Basic data cleaning and organization</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Creating reports and dashboards</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Learning SQL and data tools</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Support for senior analysts</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Training and mentorship provided</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Senior Level</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Complex statistical modeling</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Strategic business recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Advanced Python/R programming</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Team leadership and mentoring</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>3-5+ years experience required</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Skills Required Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Skills Required for Entry Level Data Analyst Jobs</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Essential Skills (Must Have)</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong>Excel/Google Sheets:</strong> Pivot tables, VLOOKUP, basic formulas, data sorting
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong>SQL Basics:</strong> SELECT queries, JOINs, WHERE clauses (often trained on the job)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong>Critical Thinking:</strong> Problem-solving and analytical reasoning abilities
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong>Communication:</strong> Present findings clearly to non-technical stakeholders
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Nice-to-Have Skills</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <strong>Python or R:</strong> Basic data manipulation (pandas, dplyr)
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <strong>Data Visualization:</strong> Tableau, Power BI, or similar tools
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <strong>Statistics:</strong> Understanding of means, medians, distributions
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <strong>Domain Knowledge:</strong> Industry-specific understanding (finance, healthcare, etc.)
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* No Experience Required Section */}
          <div className="mb-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">No Experience Required Opportunities</h2>
            <p className="text-lg text-gray-700 mb-6">
              Many companies are willing to hire motivated beginners and provide the training needed to succeed as a data analyst:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Paid Training Programs</h3>
                <p className="text-sm text-gray-600">Companies offer structured training while you earn</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Internships That Convert</h3>
                <p className="text-sm text-gray-600">Start as intern, transition to full-time role</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Junior Analyst Roles</h3>
                <p className="text-sm text-gray-600">Entry-level positions with mentorship</p>
              </div>
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Companies Hiring Beginners</h3>
                <p className="text-sm text-gray-600">Organizations committed to developing talent</p>
              </div>
            </div>
          </div>

          {/* How to Break Into Data Analysis */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to Break Into Data Analysis</h2>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Take Free Courses</h3>
                    <p className="text-gray-700 mb-2">
                      <strong>Google Data Analytics Certificate</strong> on Coursera - Comprehensive, beginner-friendly, and recognized by employers.
                    </p>
                    <p className="text-gray-700">
                      Other options: DataCamp, Khan Academy (Statistics), freeCodeCamp (SQL), Microsoft Learn (Power BI)
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Portfolio Projects</h3>
                    <p className="text-gray-700">
                      Create 2-3 projects analyzing public datasets (Kaggle, data.gov). Document your process, create 
                      visualizations, and share insights. Post on GitHub or personal website. This demonstrates practical skills to employers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Relevant Certifications</h3>
                    <p className="text-gray-700">
                      Consider: Google Data Analytics, Microsoft Power BI Data Analyst, Tableau Desktop Specialist, 
                      or Microsoft Excel Expert. These boost your resume and demonstrate commitment to the field.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Network and Apply Strategically</h3>
                    <p className="text-gray-700">
                      Join data analytics communities (Reddit r/dataanalysis, LinkedIn groups). Apply to entry-level positions 
                      specifically marked "no experience required." Tailor your resume to highlight analytical projects and relevant skills.
                    </p>
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

          {/* Related Links */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Job Categories</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/remote-data-entry-jobs-no-experience" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Data Entry Jobs →</h3>
                <p className="text-sm text-gray-600">Start with data entry while building analyst skills</p>
              </Link>
              <Link href="/remote-administrative-assistant-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Admin Assistant Jobs →</h3>
                <p className="text-sm text-gray-600">Related remote administrative positions</p>
              </Link>
              <Link href="/jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">All Remote Jobs →</h3>
                <p className="text-sm text-gray-600">Browse all work-from-home opportunities</p>
              </Link>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-10 text-center shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Data Analytics Career?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse entry-level data analyst opportunities or sign up for job alerts to get notified about new positions that match your skills.
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
  const keywordSlug = 'entry-level-data-analyst-jobs';
  const pageData = keywordPagesData[keywordSlug];
  
  if (!pageData) {
    return { notFound: true };
  }
  
  try {
    // Fetch real jobs from the API - filter for analyst positions
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/jobs?experienceLevel=entry-level&limit=50`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let jobs: JobListing[] = [];
    
    if (response.ok) {
      const data = await response.json();
      jobs = data.jobs || [];
      
      // Filter for data analyst positions
      jobs = jobs.filter(job => {
        const searchText = `${job.title} ${job.description}`.toLowerCase();
        return (searchText.includes('data analyst') || 
               searchText.includes('junior analyst') ||
               searchText.includes('analyst') && searchText.includes('data') ||
               searchText.includes('business analyst') ||
               searchText.includes('data analytics')) &&
               !searchText.includes('senior') &&
               !searchText.includes('lead') &&
               !searchText.includes('principal');
      });
    }

    // If no jobs found, create informative fallback
    if (jobs.length === 0) {
      jobs = [
        {
          _id: 'analyst-fallback-1',
          title: 'Entry Level Data Analyst',
          company: 'Various Companies',
          location: 'Remote - US',
          salary: '$45-65K/year',
          jobType: 'Full-time',
          experienceLevel: 'Entry Level',
          description: 'We regularly feature new entry-level data analyst positions from companies willing to train and develop junior talent. Check back daily for the latest opportunities in data analytics.',
          postedDate: new Date().toISOString(),
          featured: false,
          skills: ['Excel', 'SQL', 'Data Visualization', 'Critical Thinking'],
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
        jobs: jobs.slice(0, 30)
      }
    };
  } catch (error) {
    console.error('Error fetching entry level data analyst jobs:', error);
    
    const fallbackJobs: JobListing[] = [
      {
        _id: 'analyst-fallback-1',
        title: 'Entry Level Data Analyst',
        company: 'Various Companies',
        location: 'Remote - US',
        salary: '$45-65K/year',
        jobType: 'Full-time',
        experienceLevel: 'Entry Level',
        description: 'We regularly feature new entry-level data analyst positions from companies willing to train and develop junior talent. Check back daily for the latest opportunities in data analytics.',
        postedDate: new Date().toISOString(),
        featured: false,
        skills: ['Excel', 'SQL', 'Data Visualization', 'Critical Thinking'],
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
        jobs: fallbackJobs
      }
    };
  }
};

export default EntryLevelDataAnalystJobsPage;
