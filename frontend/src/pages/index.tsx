import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import SearchBar from '../components/common/SearchBar';
import EnhancedJobCard from '../components/common/EnhancedJobCard';
import CategoryCard from '../components/common/CategoryCard';
import { useRouter } from 'next/router';

// Mock data for featured jobs (in a real app, these would come from an API)
const featuredJobs = [
  {
    _id: 'job1',
    title: 'Remote Data Entry Specialist',
    company: 'TechCorp Solutions',
    location: 'Remote (US Only)',
    description: 'We are looking for a detail-oriented Data Entry Specialist to join our team...',
    descriptionText: 'We are looking for a detail-oriented Data Entry Specialist to join our team. You will be responsible for entering data from various sources into company database, maintaining data accuracy and integrity.',
    salary: '$18-22/hr',
    postedDate: new Date(),
    qualityScore: 9.2,
    featured: true,
    jobType: 'full-time',
    experienceLevel: 'entry-level',
    payRange: '$15-20',
    skills: ['Fast typing', 'Attention to detail', 'Data verification'],
    softwareRequirements: ['Microsoft Office', 'Excel']
  },
  {
    _id: 'job2',
    title: 'Virtual Administrative Assistant',
    company: 'Global Services LLC',
    location: 'Remote (Worldwide)',
    description: 'Support executives by managing schedules, preparing reports, and handling correspondence...',
    descriptionText: 'Support executives by managing schedules, preparing reports, and handling correspondence. Must have excellent communication skills and be proficient in Microsoft Office suite.',
    salary: '$15-17/hr',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    qualityScore: 8.5,
    featured: true,
    jobType: 'part-time',
    experienceLevel: 'entry-level',
    payRange: '$15-20',
    skills: ['Calendar management', 'Email management', 'Travel arrangements'],
    softwareRequirements: ['Microsoft Office', 'Google Workspace']
  },
  {
    _id: 'job3',
    title: 'Customer Service Representative',
    company: 'Support Heroes',
    location: 'Remote (US Only)',
    description: 'Answer customer inquiries via phone, email, and chat. Resolve issues and provide information...',
    descriptionText: 'Answer customer inquiries via phone, email, and chat. Resolve issues and provide information about our products and services. Must have excellent communication skills and a customer-first attitude.',
    salary: '$16-19/hr',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    qualityScore: 8.8,
    featured: true,
    jobType: 'full-time', 
    experienceLevel: 'experienced',
    payRange: '$15-20',
    skills: ['Customer support', 'Problem solving', 'Phone etiquette'],
    softwareRequirements: ['CRM Systems']
  }
];

// Mock data for job categories
const jobCategories = [
  { name: 'Data Entry', slug: 'data-entry' },
  { name: 'Administrative', slug: 'administrative' },
  { name: 'Customer Support', slug: 'customer-service' },
  { name: 'Transcription', slug: 'transcription' },
  { name: 'Virtual Assistant', slug: 'virtual-assistant' },
  { name: 'Data Processing', slug: 'data-processing' }
];

const HomePage = () => {
  const router = useRouter();
  
  const filterChips = [
    { label: 'Entry-Level', value: 'entry-level' },
    { label: 'Part-Time', value: 'part-time' },
    { label: 'No Experience', value: 'no-experience' },
    { label: 'US Only', value: 'us-only' }
  ];

  const handleSearch = (query: string) => {
    router.push({
      pathname: '/jobs',
      query: { q: query }
    });
  };

  const handleFilterChange = (filters: string[]) => {
    router.push({
      pathname: '/jobs',
      query: { filters: filters.join(',') }
    });
  };

  return (
    <Layout
      title="Remote Data Entry Jobs | Work From Home Opportunities | ClickClickJob.com"
      description="Find verified remote data entry & administrative jobs. 100+ work-from-home opportunities updated daily. No experience options available."
    >
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Find Remote Admin & Data Entry Jobs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Find verified work-from-anywhere opportunities for admin professionals and data entry specialists with or without experience
          </p>
          
          <div className="max-w-3xl mx-auto mt-8">
            <SearchBar 
              placeholder="Search for job titles, skills, or companies..."
              filterChips={filterChips}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
            />
          </div>
          
          <div className="mt-6 text-sm text-blue-700 font-medium">
            → Browse high-quality remote opportunities updated regularly ←
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="mr-3">Featured Jobs</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              High-Quality Opportunities
            </span>
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.map(job => (
              <EnhancedJobCard key={job._id} job={job} />
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <Link 
              href="/jobs"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View All Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Explore Job Categories
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobCategories.map(category => (
              <CategoryCard 
                key={category.slug}
                name={category.name}
                slug={category.slug}
              />
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <Link 
              href="/categories"
              className="inline-flex items-center px-6 py-3 border border-gray-300 bg-white text-base font-medium rounded-md shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse All Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Why Choose ClickClickJob
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Quality Listings</h3>
              <p className="text-gray-600">Listings filtered for relevance to admin and data entry roles</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Scams</h3>
              <p className="text-gray-600">We filter out suspicious listings to protect job seekers</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Regular Updates</h3>
              <p className="text-gray-600">New listings added as they become available</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="text-blue-600 mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Specialized Focus</h3>
              <p className="text-gray-600">Dedicated to admin and data entry remote positions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Remote Work Guide
            </h2>
            <Link 
              href="/resources/remote-work-guide"
              className="text-blue-600 hover:text-blue-800 font-medium hidden md:block"
            >
              Read our full guide →
            </Link>
          </div>
          
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How to find legitimate remote opportunities:</h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Research company reputation before applying</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Be wary of jobs requiring upfront payments</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Look for detailed job descriptions with clear requirements</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Verify company contact information and website</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Watch for unrealistic salary promises</p>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-700">Check for secure application processes</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center md:hidden">
                <Link 
                  href="/resources/remote-work-guide"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Read our full guide →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-blue-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Start Your Remote Career Today
          </h2>
          <p className="text-blue-100 mb-8 max-w-3xl mx-auto">
            Browse through our collection of administrative and data entry remote jobs, curated for remote workers seeking quality opportunities.
          </p>
          <Link 
            href="/jobs"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-700 focus:ring-white"
          >
            Browse All Jobs
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage; 