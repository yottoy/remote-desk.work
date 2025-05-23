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

  // Format the posted date string to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

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
                  keyword="remote-data-entry-jobs-no-experience"
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
  const keywordSlug = 'remote-data-entry-jobs-no-experience';
  const pageData = keywordPagesData[keywordSlug];
  
  if (!pageData) {
    return { notFound: true };
  }
  
  try {
    // Create realistic job data for display
    const jobs: JobListing[] = [
      {
        _id: 'job1',
        title: 'Data Entry Specialist',
        company: 'Global Data Solutions',
        location: 'Remote - Worldwide',
        salary: '$15-20/hr',
        jobType: 'Full-time',
        experienceLevel: 'no-experience',
        description: 'Looking for detail-oriented individuals to join our remote data entry team. No prior experience required. Tasks include inputting customer information, processing orders, and maintaining accurate records. Attention to detail and basic computer skills required.',
        postedDate: '2025-05-15',
        featured: false,
        skills: ['Microsoft Excel', 'Data Entry', 'Typing'],
        applyUrl: 'https://example.com/apply/job1'
      },
      {
        _id: 'job2',
        title: 'Virtual Data Entry Clerk',
        company: 'RemoteWorks Inc.',
        location: 'Remote - US Based',
        salary: '$16/hr',
        jobType: 'Part-time',
        experienceLevel: 'no-experience',
        description: 'Part-time data entry position perfect for beginners. Training provided. Flexible hours, work from home. Responsibilities include data entry, data verification, and basic administrative tasks.',
        postedDate: '2025-05-18',
        featured: true,
        skills: ['Microsoft Office', 'Data Entry', 'Communication'],
        applyUrl: 'https://example.com/apply/job2'
      },
      {
        _id: 'job3',
        title: 'Entry-Level Data Entry Specialist',
        company: 'DataFlex Solutions',
        location: 'Remote - Global',
        salary: '$14-18/hr',
        jobType: 'Full-time',
        experienceLevel: 'no-experience',
        description: 'Join our global team as an entry-level data entry specialist. No experience needed - we provide comprehensive training. Benefits include flexible schedule and advancement opportunities.',
        postedDate: '2025-05-20',
        featured: false,
        skills: ['Data Entry', 'Organization', 'Attention to Detail'],
        applyUrl: 'https://example.com/apply/job3'
      },
      {
        _id: 'job4',
        title: 'Remote Data Processing Clerk',
        company: 'Digital Input Services',
        location: 'Remote - Worldwide',
        salary: '$15/hr',
        jobType: 'Full-time',
        experienceLevel: 'no-experience',
        description: 'Data processing position for entry-level candidates. Process various forms of information into our digital systems. Full training provided for motivated individuals.',
        postedDate: '2025-05-19',
        featured: false,
        skills: ['Data Processing', 'Computer Skills', 'Detail-Oriented'],
        applyUrl: 'https://example.com/apply/job4'
      },
      {
        _id: 'job5',
        title: 'Work-From-Home Data Entry Operator',
        company: 'RemoteForce',
        location: 'Remote - North America',
        salary: '$17/hr',
        jobType: 'Part-time',
        experienceLevel: 'no-experience',
        description: 'Seeking detail-oriented individuals for data entry roles. Enter and verify data in our proprietary systems. No experience required, paid training provided.',
        postedDate: '2025-05-21',
        featured: true,
        skills: ['Data Entry', 'Time Management', 'Fast Typing'],
        applyUrl: 'https://example.com/apply/job5'
      }
    ];
    
    // Note: In a production environment, you would fetch jobs from the API:
    // const response = await fetch(`${process.env.API_URL}/api/jobs?keyword=${keywordSlug}`);
    // const jobs = await response.json();
    
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
