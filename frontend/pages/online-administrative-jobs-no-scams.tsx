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
                  keyword="online-administrative-jobs-no-scams"
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
            <Link href="/newsletter" className="inline-flex items-center justify-center px-5 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
              Get Job Alerts
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const keywordSlug = 'online-administrative-jobs-no-scams';
  const pageData = keywordPagesData[keywordSlug];
  
  if (!pageData) {
    return { notFound: true };
  }
  
  try {
    // Create realistic job data for display
    const jobs: JobListing[] = [
      {
        _id: 'job1',
        title: 'Verified Administrative Assistant',
        company: 'TrustAdmin Inc.',
        location: 'Remote - US Based',
        salary: '$18-22/hr',
        jobType: 'Full-time',
        experienceLevel: 'entry-level',
        description: 'Administrative assistant position with a verified employer. Tasks include email management, scheduling, and document preparation. Company verified by our team.',
        postedDate: '2025-05-15',
        featured: true,
        skills: ['Email Management', 'Scheduling', 'Document Preparation'],
        applyUrl: 'https://example.com/apply/admin1'
      },
      {
        _id: 'job2',
        title: 'Legitimate Remote Office Assistant',
        company: 'Verified Business Services',
        location: 'Remote - Worldwide',
        salary: '$16-19/hr',
        jobType: 'Full-time',
        experienceLevel: 'entry-level',
        description: 'Genuine remote office assistant position with a long-established company. Background-checked employer offering legitimate work-from-home opportunity.',
        postedDate: '2025-05-18',
        featured: false,
        skills: ['Office Administration', 'Customer Service', 'Organization'],
        applyUrl: 'https://example.com/apply/admin2'
      },
      {
        _id: 'job3',
        title: 'Verified Administrative Coordinator',
        company: 'Authentic Remote Solutions',
        location: 'Remote - US/Canada',
        salary: '$20-24/hr',
        jobType: 'Full-time',
        experienceLevel: 'intermediate',
        description: 'Administrative coordinator position with a verified employer. Coordinate schedules, prepare reports, and manage correspondence. All employers screened for legitimacy.',
        postedDate: '2025-05-20',
        featured: false,
        skills: ['Coordination', 'Report Preparation', 'Communication'],
        applyUrl: 'https://example.com/apply/admin3'
      },
      {
        _id: 'job4',
        title: 'Remote Executive Admin - Verified Company',
        company: 'LegitAdmin Group',
        location: 'Remote - North America',
        salary: '$22-26/hr',
        jobType: 'Full-time',
        experienceLevel: 'intermediate',
        description: 'Executive administrative position with a verified employer. Support executives with scheduling, correspondence, and project coordination. Background-checked employer.',
        postedDate: '2025-05-19',
        featured: true,
        skills: ['Executive Support', 'Project Coordination', 'Professionalism'],
        applyUrl: 'https://example.com/apply/admin4'
      },
      {
        _id: 'job5',
        title: 'Part-Time Administrative Support - Verified',
        company: 'TruthWork Remote',
        location: 'Remote - Worldwide',
        salary: '$17-20/hr',
        jobType: 'Part-time',
        experienceLevel: 'entry-level',
        description: 'Part-time administrative support position with a verified employer. 15-20 hours per week with flexible scheduling. Company has passed our legitimacy verification process.',
        postedDate: '2025-05-21',
        featured: false,
        skills: ['Administrative Support', 'Flexibility', 'Communication'],
        applyUrl: 'https://example.com/apply/admin5'
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
