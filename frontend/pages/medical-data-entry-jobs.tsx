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

const MedicalDataEntryJobsPage: React.FC<KeywordPageProps> = ({ title, h1, description, faqItems, jobs }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/medical-data-entry-jobs`;

  // Calculate days ago
  const getDaysAgo = (dateString: string) => {
    const postedDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - postedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 ? 'Today' : `${diffDays} days ago`;
  };

  // Filter job types - ensure non-undefined values
  const jobTypes = Array.from(new Set(jobs.map(job => job.jobType).filter((type): type is string => !!type)));

  // Filtered jobs based on selection
  const filteredJobs = activeFilter 
    ? jobs.filter(job => job.jobType === activeFilter)
    : jobs;

  // Generate schemas
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Medical Data Entry Jobs', url: pageUrl }
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
              <li className="text-gray-900 font-medium">Medical Data Entry Jobs</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-6">{h1}</h1>
          
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-xl text-gray-700 leading-relaxed">
              Looking for <strong>medical data entry jobs remote</strong> opportunities? You're in the right place. 
              Find legitimate healthcare data entry positions that allow you to work from home. Whether you're new 
              to the field or have experience with medical billing data entry, patient records, or insurance claims, 
              we have opportunities for all skill levels.
            </p>
            <p className="text-lg text-gray-600 mt-4">
              <em>Updated: February 2026</em> | All listings verified for legitimacy | Entry-level positions available
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Latest Medical Data Entry Job Listings</h2>
            
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
                    keyword="medical-data-entry-jobs"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">We're actively sourcing new medical data entry positions. Check back soon or browse related categories.</p>
                <div className="flex justify-center gap-4 mt-6">
                  <Link href="/jobs" className="text-blue-600 hover:text-blue-700 font-medium">
                    Browse All Jobs →
                  </Link>
                  <Link href="/remote-data-entry-jobs-no-experience" className="text-blue-600 hover:text-blue-700 font-medium">
                    General Data Entry →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Types of Medical Data Entry Jobs */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Types of Medical Data Entry Jobs</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Medical Billing Data Entry</h3>
                <p className="text-gray-700">
                  Process insurance claims, input billing codes (CPT, ICD-10), and manage payment records. 
                  Ideal for those interested in the financial side of healthcare.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Patient Records Data Entry</h3>
                <p className="text-gray-700">
                  Input patient information into Electronic Health Record (EHR) systems. Requires high accuracy 
                  and attention to detail when handling sensitive medical information.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Insurance Claims Data Entry</h3>
                <p className="text-gray-700">
                  Process insurance claims and authorizations. Work with various insurance providers to ensure 
                  accurate claim submission and follow-up.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Medical Coding Data Entry</h3>
                <p className="text-gray-700">
                  Assign diagnostic and procedure codes to medical records. Often requires certification 
                  but offers higher pay and career advancement opportunities.
                </p>
              </div>
            </div>
          </div>

          {/* Skills Needed Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Skills Needed for Medical Data Entry</h2>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <strong className="text-gray-900">HIPAA Knowledge:</strong>
                    <span className="text-gray-700"> Understanding of patient privacy laws and data security protocols (training usually provided)</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <strong className="text-gray-900">Attention to Detail:</strong>
                    <span className="text-gray-700"> Critical for accurate patient records and billing information</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <strong className="text-gray-900">Medical Terminology Basics:</strong>
                    <span className="text-gray-700"> Helpful but not always required for entry-level positions</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <strong className="text-gray-900">Typing Speed:</strong>
                    <span className="text-gray-700"> 40+ WPM with high accuracy recommended</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <strong className="text-gray-900">Software Proficiency:</strong>
                    <span className="text-gray-700"> Comfortable learning EHR systems (Epic, Cerner, etc.) and Microsoft Office</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* How to Get Started */}
          <div className="mb-12 bg-blue-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How to Get Started (No Experience)</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Online Courses</h3>
                <p className="text-gray-700">
                  Take free or low-cost courses in medical terminology, HIPAA compliance, and basic medical coding. 
                  Platforms like Coursera, Udemy, and AHIMA offer beginner-friendly courses.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Certifications</h3>
                <p className="text-gray-700">
                  Consider certifications like Certified Electronic Health Records Specialist (CEHRS) or HIPAA 
                  certification to boost your credentials. While not always required, they can help you stand out.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Entry-Level Positions</h3>
                <p className="text-gray-700">
                  Start with positions that offer training. Many healthcare organizations hire entry-level medical 
                  data entry specialists and provide on-the-job training in their specific systems and processes.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Build Your Resume</h3>
                <p className="text-gray-700">
                  Highlight transferable skills like attention to detail, typing speed, data accuracy, and any 
                  customer service or administrative experience. Mention any healthcare-related experience, even 
                  if it's not data entry.
                </p>
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

          {/* Related Links Section */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Job Categories</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/remote-data-entry-jobs-no-experience" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">General Data Entry Jobs →</h3>
                <p className="text-sm text-gray-600">Explore all remote data entry opportunities</p>
              </Link>
              <Link href="/remote-medical-administrative-jobs" 
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Medical Admin Jobs →</h3>
                <p className="text-sm text-gray-600">Administrative roles in healthcare</p>
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
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Medical Data Entry Career?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse verified remote medical data entry opportunities or sign up for job alerts to get notified about new positions daily.
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
  const keywordSlug = 'medical-data-entry-jobs';
  const pageData = keywordPagesData[keywordSlug];
  
  if (!pageData) {
    return { notFound: true };
  }
  
  try {
    // Fetch real jobs from the API - filter for medical/healthcare data entry
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/jobs?category=data-entry&specialization=medical&limit=50`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let jobs: JobListing[] = [];
    
    if (response.ok) {
      const data = await response.json();
      jobs = data.jobs || [];
      
      // Additional client-side filtering for medical-related keywords
      jobs = jobs.filter(job => {
        const searchText = `${job.title} ${job.description} ${job.company}`.toLowerCase();
        return searchText.includes('medical') || 
               searchText.includes('healthcare') || 
               searchText.includes('health') ||
               searchText.includes('patient') ||
               searchText.includes('clinical') ||
               searchText.includes('hospital') ||
               searchText.includes('billing') ||
               searchText.includes('hipaa');
      });
    }

    // If no jobs found, create informative fallback
    if (jobs.length === 0) {
      jobs = [
        {
          _id: 'med-fallback-1',
          title: 'Medical Data Entry Specialist',
          company: 'Various Healthcare Providers',
          location: 'Remote - US',
          salary: '$15-22/hr',
          jobType: 'Full-time',
          experienceLevel: 'Entry Level',
          description: 'We regularly feature new medical data entry positions from hospitals, clinics, and healthcare organizations. Check back daily for the latest opportunities in healthcare data entry.',
          postedDate: new Date().toISOString(),
          featured: false,
          skills: ['Medical Data Entry', 'HIPAA Compliance', 'Attention to Detail', 'EHR Systems'],
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
        jobs: jobs.slice(0, 30) // Show up to 30 jobs
      }
    };
  } catch (error) {
    console.error('Error fetching medical data entry jobs:', error);
    
    // Return fallback data
    const fallbackJobs: JobListing[] = [
      {
        _id: 'med-fallback-1',
        title: 'Medical Data Entry Specialist',
        company: 'Various Healthcare Providers',
        location: 'Remote - US',
        salary: '$15-22/hr',
        jobType: 'Full-time',
        experienceLevel: 'Entry Level',
        description: 'We regularly feature new medical data entry positions from hospitals, clinics, and healthcare organizations. Check back daily for the latest opportunities in healthcare data entry.',
        postedDate: new Date().toISOString(),
        featured: false,
        skills: ['Medical Data Entry', 'HIPAA Compliance', 'Attention to Detail', 'EHR Systems'],
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

export default MedicalDataEntryJobsPage;
