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

const HealthcareDataEntryJobsPage: React.FC<KeywordPageProps> = ({ title, h1, description, faqItems, jobs }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  const pageUrl = `${baseUrl}/healthcare-data-entry-jobs`;

  const getDaysAgo = (dateString: string) => {
    const postedDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - postedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1 ? 'Today' : `${diffDays} days ago`;
  };

  const jobTypes = Array.from(new Set(jobs.map(job => job.jobType).filter((type): type is string => !!type)));

  const filteredJobs = activeFilter
    ? jobs.filter(job => job.jobType === activeFilter)
    : jobs;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: baseUrl },
    { name: 'Healthcare Data Entry Jobs', url: pageUrl }
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
              <li className="text-gray-900 font-medium">Healthcare Data Entry Jobs</li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-6">{h1}</h1>

          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-xl text-gray-700 leading-relaxed">
              Looking for <strong>healthcare data entry jobs</strong> you can do from home? Browse verified remote positions
              in medical records, patient data management, insurance claims processing, and clinical data entry. Whether you
              have experience with EHR systems or are just starting out, we have opportunities for all skill levels.
            </p>
            <p className="text-lg text-gray-600 mt-4">
              <em>Updated: February 2026</em> | All listings verified for legitimacy | Entry-level positions available
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Latest Healthcare Data Entry Positions</h2>

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

            {filteredJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map(job => (
                  <ImprovedJobCard
                    key={job._id}
                    job={job}
                    variant="compact"
                    keyword="healthcare-data-entry-jobs"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow text-center border border-gray-200">
                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">We&apos;re actively sourcing new healthcare data entry positions. Check back soon or browse related categories.</p>
                <div className="flex justify-center gap-4 mt-6">
                  <Link href="/jobs" className="text-blue-600 hover:text-blue-700 font-medium">
                    Browse All Jobs →
                  </Link>
                  <Link href="/medical-data-entry-jobs" className="text-blue-600 hover:text-blue-700 font-medium">
                    Medical Data Entry →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Types of Healthcare Data Entry */}
          <div className="mb-12 bg-gray-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Types of Healthcare Data Entry Jobs</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Patient Records Entry</h3>
                <p className="text-gray-700">
                  Input patient demographics, medical histories, and clinical notes into EHR systems.
                  Requires high accuracy and HIPAA compliance when handling protected health information.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Insurance Claims Processing</h3>
                <p className="text-gray-700">
                  Enter insurance claim details, verify coverage information, and process pre-authorizations.
                  Knowledge of CPT and ICD-10 codes is beneficial but often trained on the job.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Clinical Trial Data Entry</h3>
                <p className="text-gray-700">
                  Input research data from clinical studies into databases. Pharmaceutical companies
                  and research organizations hire remote data entry specialists for this growing field.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Medical Billing Data Entry</h3>
                <p className="text-gray-700">
                  Process billing statements, enter procedure codes, and manage payment records for
                  hospitals, clinics, and physician practices. Can lead to medical billing specialist roles.
                </p>
              </div>
            </div>
          </div>

          {/* Skills and Requirements */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Skills for Healthcare Data Entry</h2>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <strong className="text-gray-900">HIPAA Compliance:</strong>
                    <span className="text-gray-700"> Understanding of patient privacy laws and data security protocols (training usually provided)</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <strong className="text-gray-900">Typing Speed:</strong>
                    <span className="text-gray-700"> 40+ WPM with 99%+ accuracy when entering patient data</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <strong className="text-gray-900">Medical Terminology:</strong>
                    <span className="text-gray-700"> Basic knowledge of medical terms, abbreviations, and common diagnoses</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <strong className="text-gray-900">EHR Systems:</strong>
                    <span className="text-gray-700"> Familiarity with Epic, Cerner, Meditech, or similar electronic health record platforms</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <strong className="text-gray-900">Attention to Detail:</strong>
                    <span className="text-gray-700"> Critical for accurate patient records, billing, and compliance</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Career Pathway */}
          <div className="mb-12 bg-blue-50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Healthcare Data Entry Career Path</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Getting Started</h3>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start"><span className="font-bold text-blue-600 mr-2">1.</span>Complete a free HIPAA training course online (2-4 hours)</li>
                  <li className="flex items-start"><span className="font-bold text-blue-600 mr-2">2.</span>Learn medical terminology basics through MedlinePlus or Coursera</li>
                  <li className="flex items-start"><span className="font-bold text-blue-600 mr-2">3.</span>Practice typing accuracy with medical terminology exercises</li>
                  <li className="flex items-start"><span className="font-bold text-blue-600 mr-2">4.</span>Apply for entry-level healthcare data entry positions</li>
                </ol>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Salary Growth</h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span>Entry-Level Data Entry</span>
                    <span className="font-semibold text-blue-600">$15-17/hr</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span>Healthcare Data Specialist</span>
                    <span className="font-semibold text-blue-600">$18-22/hr</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span>Medical Coding Specialist</span>
                    <span className="font-semibold text-blue-600">$20-25/hr</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span>Health Information Technician</span>
                    <span className="font-semibold text-blue-600">$22-28/hr</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>HIM Manager</span>
                    <span className="font-semibold text-blue-600">$28-38/hr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legitimacy Section */}
          <div className="mb-12 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Verify Healthcare Data Entry Jobs Are Legitimate</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-700 mb-3">Signs of a Legitimate Position</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start"><span className="text-green-600 mr-2 font-bold">+</span>Requires HIPAA compliance training before accessing data</li>
                  <li className="flex items-start"><span className="text-green-600 mr-2 font-bold">+</span>Uses established EHR systems like Epic, Cerner, or Meditech</li>
                  <li className="flex items-start"><span className="text-green-600 mr-2 font-bold">+</span>Healthcare company with verifiable credentials and physical address</li>
                  <li className="flex items-start"><span className="text-green-600 mr-2 font-bold">+</span>Pays $15-28/hr consistent with industry rates</li>
                  <li className="flex items-start"><span className="text-green-600 mr-2 font-bold">+</span>Provides secure VPN or encrypted access to patient records</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-red-700 mb-3">Warning Signs to Avoid</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start"><span className="text-red-600 mr-2 font-bold">-</span>No mention of HIPAA, privacy, or data security</li>
                  <li className="flex items-start"><span className="text-red-600 mr-2 font-bold">-</span>Asks for payment for training or software access</li>
                  <li className="flex items-start"><span className="text-red-600 mr-2 font-bold">-</span>Promises $40+/hr for entry-level healthcare data entry</li>
                  <li className="flex items-start"><span className="text-red-600 mr-2 font-bold">-</span>Vague about what type of healthcare data you would handle</li>
                  <li className="flex items-start"><span className="text-red-600 mr-2 font-bold">-</span>Uses generic email addresses instead of company domains</li>
                </ul>
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
              <Link href="/medical-data-entry-jobs"
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Medical Data Entry Jobs →</h3>
                <p className="text-sm text-gray-600">Specialized medical data entry roles</p>
              </Link>
              <Link href="/remote-data-entry-jobs"
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">General Data Entry Jobs →</h3>
                <p className="text-sm text-gray-600">All remote data entry opportunities</p>
              </Link>
              <Link href="/remote-medical-administrative-jobs"
                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-blue-600 mb-2">Medical Admin Jobs →</h3>
                <p className="text-sm text-gray-600">Administrative roles in healthcare</p>
              </Link>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-10 text-center shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">Start Your Healthcare Data Entry Career</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse verified remote healthcare data entry positions or sign up for alerts to get notified about new openings daily.
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
  const keywordSlug = 'healthcare-data-entry-jobs';
  const pageData = keywordPagesData[keywordSlug];

  if (!pageData) {
    return { notFound: true };
  }

  try {
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

      jobs = jobs.filter(job => {
        const searchText = `${job.title} ${job.description} ${job.company}`.toLowerCase();
        return searchText.includes('medical') ||
               searchText.includes('healthcare') ||
               searchText.includes('health') ||
               searchText.includes('patient') ||
               searchText.includes('clinical') ||
               searchText.includes('hospital') ||
               searchText.includes('billing') ||
               searchText.includes('hipaa') ||
               searchText.includes('ehr') ||
               searchText.includes('insurance');
      });
    }

    if (jobs.length === 0) {
      jobs = [
        {
          _id: 'hc-fallback-1',
          title: 'Healthcare Data Entry Specialist',
          company: 'Various Healthcare Providers',
          location: 'Remote - US',
          salary: '$15-22/hr',
          jobType: 'Full-time',
          experienceLevel: 'Entry Level',
          description: 'We regularly feature new healthcare data entry positions from hospitals, clinics, and health systems. Check back daily for the latest opportunities.',
          postedDate: new Date().toISOString(),
          featured: false,
          skills: ['Healthcare Data Entry', 'HIPAA Compliance', 'EHR Systems', 'Attention to Detail'],
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
    console.error('Error fetching healthcare data entry jobs:', error);

    const fallbackJobs: JobListing[] = [
      {
        _id: 'hc-fallback-1',
        title: 'Healthcare Data Entry Specialist',
        company: 'Various Healthcare Providers',
        location: 'Remote - US',
        salary: '$15-22/hr',
        jobType: 'Full-time',
        experienceLevel: 'Entry Level',
        description: 'We regularly feature new healthcare data entry positions from hospitals, clinics, and health systems. Check back daily for the latest opportunities.',
        postedDate: new Date().toISOString(),
        featured: false,
        skills: ['Healthcare Data Entry', 'HIPAA Compliance', 'EHR Systems', 'Attention to Detail'],
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

export default HealthcareDataEntryJobsPage;
