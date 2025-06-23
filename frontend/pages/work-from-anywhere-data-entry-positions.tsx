import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { keywordPagesData } from '../data/keywordPages';
import Layout from '../components/layout/Layout';
import ImprovedJobCard from '../components/common/ImprovedJobCard';

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

const KeywordPage: React.FC<KeywordPageProps> = ({ title, h1, description, faqItems, jobs }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Filter job types - ensure non-undefined values
  const jobTypes = Array.from(new Set(jobs.map(job => job.jobType).filter((type): type is string => !!type)));

  // Filtered jobs based on selection
  const filteredJobs = activeFilter 
    ? jobs.filter(job => job.jobType === activeFilter)
    : jobs;
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">{h1}</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">{description}</p>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Latest Job Listings</h2>
          
          {/* Job filters */}
          {jobTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button 
                onClick={() => setActiveFilter(null)}
                className={`px-4 py-2 text-sm rounded-full ${!activeFilter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              >
                All Jobs
              </button>
              {jobTypes.map(type => (
                <button 
                  key={type} 
                  onClick={() => setActiveFilter(type)}
                  className={`px-4 py-2 text-sm rounded-full ${activeFilter === type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
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
                  keyword="work-from-anywhere-data-entry-positions"
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">We couldn't find any matching jobs. Please check back later.</p>
            </div>
          )}
        </div>
        
        {/* FAQ Section */}
        {faqItems && faqItems.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqItems.map((faq, index) => (
                <div key={index} className="bg-white shadow-md rounded-lg p-4">
                  <h3 className="font-medium text-lg">{faq.question}</h3>
                  <p className="text-gray-600 mt-2">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* CTA Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to Start Your Remote Career?</h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Browse more remote opportunities or sign up for job alerts to get notified about new positions.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/jobs" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Browse All Jobs
            </Link>
            <Link href="/job-alerts" className="inline-flex items-center justify-center px-5 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
              Get Job Alerts
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const keywordSlug = 'work-from-anywhere-data-entry-positions';
  const pageData = keywordPagesData[keywordSlug];
  
  if (!pageData) {
    return { notFound: true };
  }
  
  try {
    // Create realistic job data for display
    const jobs: JobListing[] = [
      {
        _id: 'job1',
        title: 'Global Data Entry Specialist',
        company: 'Worldwide Data Solutions',
        location: 'Remote - Worldwide',
        salary: '$15-20/hr',
        jobType: 'Full-time',
        experienceLevel: 'entry-level',
        description: 'Work from anywhere in the world as a data entry specialist. All you need is a reliable internet connection and computer. Process various forms of data with flexible hours.',
        postedDate: '2025-05-15',
        featured: true,
        skills: ['Data Entry', 'Spreadsheets', 'Attention to Detail'],
        applyUrl: 'https://example.com/apply/de1'
      },
      {
        _id: 'job2',
        title: 'International Data Processing Clerk',
        company: 'Global Business Services',
        location: 'Remote - Any Location',
        salary: '$16/hr',
        jobType: 'Full-time',
        experienceLevel: 'entry-level',
        description: 'Join our international team as a data processing clerk. Work from any location with no geographical restrictions. Process customer information and maintain databases.',
        postedDate: '2025-05-18',
        featured: false,
        skills: ['Data Processing', 'Database Management', 'Customer Data'],
        applyUrl: 'https://example.com/apply/de2'
      },
      {
        _id: 'job3',
        title: 'Remote Data Entry Operator - Worldwide',
        company: 'DataFlex International',
        location: 'Remote - Global',
        salary: '$14-18/hr',
        jobType: 'Part-time',
        experienceLevel: 'entry-level',
        description: 'Part-time data entry position available for candidates worldwide. Flexible scheduling with 15-25 hours per week. No location restrictions, work from anywhere with internet access.',
        postedDate: '2025-05-20',
        featured: false,
        skills: ['Data Entry', 'Time Management', 'Computer Skills'],
        applyUrl: 'https://example.com/apply/de3'
      },
      {
        _id: 'job4',
        title: 'Work-From-Anywhere Data Specialist',
        company: 'Remote Data Corp',
        location: 'Remote - Worldwide',
        salary: '$17/hr',
        jobType: 'Full-time',
        experienceLevel: 'intermediate',
        description: 'Data specialist position with complete location flexibility. Handle data entry, verification, and basic analysis. Work from anywhere in the world with full benefits.',
        postedDate: '2025-05-19',
        featured: true,
        skills: ['Data Analysis', 'Data Verification', 'Excel'],
        applyUrl: 'https://example.com/apply/de4'
      },
      {
        _id: 'job5',
        title: 'Global Database Entry Assistant',
        company: 'International Data Systems',
        location: 'Remote - Any Location',
        salary: '$15-17/hr',
        jobType: 'Part-time',
        experienceLevel: 'entry-level',
        description: 'Database entry position open to candidates worldwide. No geographic restrictions, work from anywhere with flexible hours. 20-30 hours per week with growth potential.',
        postedDate: '2025-05-21',
        featured: false,
        skills: ['Database Entry', 'Organization', 'Basic SQL'],
        applyUrl: 'https://example.com/apply/de5'
      }
    ];
    
    return {
      props: {
        title: pageData.title,
        h1: pageData.h1,
        description: pageData.description,
        faqItems: pageData.faqItems || [],
        jobs: jobs
      }
    };
  } catch (error) {
    console.error('Error fetching jobs:', error);
    
    return {
      props: {
        title: pageData.title,
        h1: pageData.h1,
        description: pageData.description,
        faqItems: pageData.faqItems || [],
        jobs: []
      }
    };
  }
};

export default KeywordPage;
