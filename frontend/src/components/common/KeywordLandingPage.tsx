import React from 'react';
import Layout from '../layout/Layout';
import KeywordMetadata from '../seo/KeywordMetadata';
import KeywordJobCard from './KeywordJobCard';
import JobCardSkeleton from './JobCardSkeleton';
import { KeywordPageData } from '../../types/seo';
import { EnhancedJobListing } from '../../types/job';
import Link from 'next/link';

interface KeywordLandingPageProps {
  pageData: KeywordPageData;
  jobs: EnhancedJobListing[];
  isLoading?: boolean;
  error?: string;
}

const KeywordLandingPage: React.FC<KeywordLandingPageProps> = ({
  pageData,
  jobs,
  isLoading = false,
  error,
}) => {
  // Format the keyword for display
  const formattedKeyword = pageData.slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return (
    <Layout>
      {/* SEO metadata */}
      <KeywordMetadata 
        title={pageData.title}
        description={pageData.description}
        keyword={formattedKeyword}
        canonicalPath={`/${pageData.slug}`}
      />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {pageData.h1}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {pageData.valueProposition}
          </p>
        </div>
      </section>
      
      {/* Jobs Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Latest {formattedKeyword}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Updated daily with fresh opportunities
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading jobs</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading state */}
            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <JobCardSkeleton key={index} />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matching jobs found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or check back later for new opportunities.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {jobs.map(job => (
                  <KeywordJobCard 
                    key={job._id} 
                    job={job}
                    keyword={pageData.slug}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* See All Jobs Button */}
          <div className="mt-12 text-center">
            <Link 
              href="/jobs"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              See All Jobs
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {pageData.faqItems && pageData.faqItems.map((faq, index) => (
                <div key={index} className="bg-white shadow overflow-hidden rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {faq.question}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <section className="py-12 bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Find Your Perfect Remote Job?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Browse our curated selection of legitimate remote opportunities and take the next step in your career.
          </p>
          
          <div className="mt-6 text-sm text-blue-200">
            <p>*Some links may be affiliate links that generate a commission for ClickClickJob.com</p>
            <p className="mt-2">© 2025 ClickClickJob.com. All rights reserved.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default KeywordLandingPage;
