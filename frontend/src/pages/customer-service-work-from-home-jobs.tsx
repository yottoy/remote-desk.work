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
  chatSupportJobs: JobListing[];
  partTimeJobs: JobListing[];
}

const CustomerServiceWorkFromHomeJobsPage: React.FC<KeywordPageProps> = ({ 
  title, 
  h1, 
  description, 
  faqItems, 
  jobs,
  entryLevelJobs,
  chatSupportJobs,
  partTimeJobs
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/customer-service-work-from-home-jobs`;

  // Available filters
  const filters = [
    { label: 'All Jobs', value: null, count: jobs.length },
    { label: 'Entry Level', value: 'entry-level', count: entryLevelJobs.length },
    { label: 'Chat Support', value: 'chat', count: chatSupportJobs.length },
    { label: 'Part Time', value: 'part-time', count: partTimeJobs.length },
  ];

  // Filtered jobs based on selection
  const getFilteredJobs = () => {
    if (!activeFilter) return jobs;
    if (activeFilter === 'entry-level') return entryLevelJobs;
    if (activeFilter === 'chat') return chatSupportJobs;
    if (activeFilter === 'part-time') return partTimeJobs;
    return jobs;
  };

  const filteredJobs = getFilteredJobs();

  // Generate schemas
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Customer Service Work From Home Jobs', url: pageUrl }
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
              <li className="text-gray-900 font-medium">Customer Service Work From Home Jobs</li>
            </ol>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{h1}</h1>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-xl text-gray-700 leading-relaxed">
              Looking for <strong>customer service work from home jobs</strong>? Find verified <strong>customer service 
              representative remote</strong> positions with flexible schedules. Whether you're seeking <strong>entry level 
              customer service remote jobs</strong>, <strong>live chat support jobs remote</strong>, or phone support roles, 
              we have opportunities for all experience levels. No experience required for many positions - training provided!
            </p>
            <div className="flex items-center gap-6 mt-6 text-sm text-gray-600 flex-wrap">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Training Provided</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Flexible Schedules</span>
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

          {/* Main Job Listings Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Latest Customer Service Remote Job Listings</h2>
            
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
                    keyword="customer-service-work-from-home-jobs"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found in this category</h3>
                <p className="text-gray-600 mb-4">Try a different filter or check back soon for new postings.</p>
              </div>
            )}
          </div>

          {/* Entry Level Section */}
          {entryLevelJobs.length > 0 && (
            <div className="mb-12 bg-blue-50 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Entry Level Customer Service Jobs (No Experience)</h2>
              <p className="text-gray-700 mb-6">
                Perfect for beginners! These <strong>entry level customer service remote jobs</strong> require no prior 
                experience. Companies provide comprehensive training on their products, systems, and customer service best practices.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {entryLevelJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="customer-service-work-from-home-jobs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Live Chat Support Section */}
          {chatSupportJobs.length > 0 && (
            <div className="mb-12 bg-green-50 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Live Chat Support Jobs (No Phone Required)</h2>
              <p className="text-gray-700 mb-6">
                Prefer text-based communication? These <strong>live chat support jobs remote</strong> let you help customers 
                through typing - no phone calls required. Perfect for introverts or those who prefer written communication.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {chatSupportJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="customer-service-work-from-home-jobs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Part-Time & Weekend Section */}
          {partTimeJobs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Part-Time & Weekend Customer Service Jobs</h2>
              <p className="text-gray-700 mb-6">
                Need flexibility? These <strong>part time customer service jobs work from home</strong> offer 15-30 hours per 
                week with flexible scheduling options, including evening and weekend shifts.
              </p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {partTimeJobs.slice(0, 6).map(job => (
                  <ImprovedJobCard 
                    key={job._id} 
                    job={job} 
                    variant="compact" 
                    keyword="customer-service-work-from-home-jobs"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Customer Service Jobs by Type */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Customer Service Jobs by Type</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Support Jobs</h3>
                <p className="text-gray-600 mb-3">
                  Help desk positions, IT support, troubleshooting software and hardware issues.
                </p>
                <p className="text-sm text-gray-500">Higher pay, technical knowledge helpful</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Success Jobs</h3>
                <p className="text-gray-600 mb-3">
                  Proactive customer support, account management, ensuring customer satisfaction.
                </p>
                <p className="text-sm text-gray-500">Relationship-focused, career growth</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Bilingual Customer Service</h3>
                <p className="text-gray-600 mb-3">
                  Spanish, French, or other language support. Premium pay for bilingual skills.
                </p>
                <p className="text-sm text-gray-500">$2-5/hr premium for language skills</p>
              </div>
            </div>
          </div>

          {/* Skills Needed Section */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Skills Needed for Customer Service Work From Home</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Essential Skills</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Communication:</strong> Clear, professional verbal and written skills</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Problem-Solving:</strong> Ability to think critically and find solutions</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Patience & Empathy:</strong> Understanding customer frustrations</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Basic Computer Skills:</strong> Navigate multiple systems simultaneously</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700"><strong>Typing Speed:</strong> 35+ WPM for chat support roles</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nice-to-Have Skills</h3>
                <ul className="space-y-3 text-gray-700">
                  <li>• Previous customer service experience</li>
                  <li>• Bilingual (Spanish, French, etc.)</li>
                  <li>• CRM software experience (Zendesk, Salesforce)</li>
                  <li>• Sales or upselling experience</li>
                  <li>• Technical troubleshooting abilities</li>
                  <li>• Conflict resolution training</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Equipment Needed Section */}
          <div className="mb-12 bg-yellow-50 rounded-lg p-8 border-2 border-yellow-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Equipment Needed for Remote Customer Service</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Required Equipment:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Quiet Workspace:</strong>
                      <p className="text-sm text-gray-600">Dedicated space free from background noise and distractions</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">USB Headset:</strong>
                      <p className="text-sm text-gray-600">Noise-canceling microphone (recommended: Logitech, Jabra)</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">Reliable Computer:</strong>
                      <p className="text-sm text-gray-600">Desktop or laptop with Windows 10+ or Mac OS (check company specs)</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <strong className="text-gray-900">High-Speed Internet:</strong>
                      <p className="text-sm text-gray-600">Minimum 10-25 Mbps download, wired connection preferred</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Internet Speed Requirements:</h3>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Phone Support:</strong> 10 Mbps download / 3 Mbps upload minimum
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Chat Support:</strong> 5 Mbps download / 1 Mbps upload minimum
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Video Support:</strong> 25 Mbps download / 5 Mbps upload minimum
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>💡 Pro Tip:</strong> Most companies will require a speed test during the application process. 
                    Test your speed at <span className="text-blue-600">fast.com</span> or <span className="text-blue-600">speedtest.net</span> before applying.
                  </p>
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
              <Link href="/remote-administrative-assistant-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Virtual Assistant →</h3>
                <p className="text-sm text-gray-600">Admin support roles</p>
              </Link>
              <Link href="/remote-data-entry-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Data Entry Jobs →</h3>
                <p className="text-sm text-gray-600">Less customer interaction</p>
              </Link>
              <Link href="/online-tutoring-jobs-college-students" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Online Tutoring →</h3>
                <p className="text-sm text-gray-600">Teaching and helping students</p>
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
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Customer Service Career?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse {jobs.length}+ verified remote customer service opportunities with flexible schedules and benefits.
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
  const keywordSlug = 'customer-service-work-from-home-jobs';
  const pageData = keywordPagesData[keywordSlug];
  
  if (!pageData) {
    return { notFound: true };
  }
  
  try {
    // Fetch all customer service jobs
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/jobs?category=customer-service&limit=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let jobs: JobListing[] = [];
    
    if (response.ok) {
      const data = await response.json();
      jobs = data.jobs || [];
      
      // Filter for customer service related jobs
      jobs = jobs.filter(job => {
        const searchText = `${job.title} ${job.description}`.toLowerCase();
        return searchText.includes('customer service') || 
               searchText.includes('customer support') ||
               searchText.includes('customer success') ||
               searchText.includes('help desk') ||
               searchText.includes('technical support') ||
               searchText.includes('call center') ||
               searchText.includes('chat support');
      });
    }

    // Categorize jobs
    const entryLevelJobs = jobs.filter(j => 
      j.experienceLevel?.toLowerCase().includes('entry') || 
      j.experienceLevel?.toLowerCase().includes('no experience') ||
      j.description?.toLowerCase().includes('no experience required') ||
      j.description?.toLowerCase().includes('training provided')
    );

    const chatSupportJobs = jobs.filter(j => {
      const text = `${j.title} ${j.description}`.toLowerCase();
      return text.includes('chat') || text.includes('live chat') || text.includes('messaging');
    });

    const partTimeJobs = jobs.filter(j => 
      j.jobType?.toLowerCase().includes('part') ||
      j.title?.toLowerCase().includes('part-time')
    );

    // If no jobs found, create fallback
    if (jobs.length === 0) {
      jobs = [
        {
          _id: 'cs-fallback-1',
          title: 'Remote Customer Service Representative',
          company: 'Various Companies',
          location: 'Remote - US',
          salary: '$14-20/hr',
          jobType: 'Full-time',
          experienceLevel: 'Entry Level',
          description: 'We regularly feature new remote customer service positions from legitimate companies. Check back daily for the latest opportunities in customer service and support.',
          postedDate: new Date().toISOString(),
          featured: false,
          skills: ['Customer Service', 'Communication', 'Problem Solving', 'Patience'],
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
        chatSupportJobs: chatSupportJobs.slice(0, 20),
        partTimeJobs: partTimeJobs.slice(0, 20)
      }
    };
  } catch (error) {
    console.error('Error fetching customer service jobs:', error);
    
    const fallbackJobs: JobListing[] = [
      {
        _id: 'cs-fallback-1',
        title: 'Remote Customer Service Representative',
        company: 'Various Companies',
        location: 'Remote - US',
        salary: '$14-20/hr',
        jobType: 'Full-time',
        experienceLevel: 'Entry Level',
        description: 'We regularly feature new remote customer service positions from legitimate companies. Check back daily for the latest opportunities in customer service and support.',
        postedDate: new Date().toISOString(),
        featured: false,
        skills: ['Customer Service', 'Communication', 'Problem Solving', 'Patience'],
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
        chatSupportJobs: [],
        partTimeJobs: []
      }
    };
  }
};

export default CustomerServiceWorkFromHomeJobsPage;
