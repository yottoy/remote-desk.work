import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import SearchBar from '../components/common/SearchBar';
import JobCard from '../components/common/JobCard';
import CategoryCard from '../components/common/CategoryCard';

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
    featured: true
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
    featured: true
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
    featured: true
  }
];

// Mock data for job categories
const jobCategories = [
  { name: 'Data Entry', slug: 'data-entry', count: 56 },
  { name: 'Administrative', slug: 'administrative', count: 42 },
  { name: 'Customer Support', slug: 'customer-service', count: 78 },
  { name: 'Transcription', slug: 'transcription', count: 34 },
  { name: 'Virtual Assistant', slug: 'virtual-assistant', count: 29 },
  { name: 'Data Processing', slug: 'data-processing', count: 23 }
];

const HomePage = () => {
  const filterChips = [
    { label: 'Entry-Level', value: 'entry-level' },
    { label: 'Part-Time', value: 'part-time' },
    { label: 'No Experience', value: 'no-experience' },
    { label: 'US Only', value: 'us-only' }
  ];

  return (
    <Layout
      title="Remote Data Entry Jobs | Work From Home Opportunities | ClickClickJob.com"
      description="Find verified remote data entry & administrative jobs. 100+ work-from-home opportunities updated daily. No experience options available."
    >
      {/* Hero Section */}
      <section className="bg-blue-50 py-12 border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            FIND REMOTE DATA ENTRY & ADMIN JOBS
          </h1>
          
          <div className="max-w-3xl mx-auto mt-8">
            <SearchBar 
              placeholder="Search for jobs..."
              filterChips={filterChips}
            />
          </div>
          
          <div className="mt-6 text-sm text-blue-700 font-medium">
            → 127 verified remote opportunities updated today ←
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            FEATURED JOBS
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.map(job => (
              <JobCard key={job._id} job={job} variant="featured" />
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            EXPLORE JOB CATEGORIES
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobCategories.map(category => (
              <CategoryCard 
                key={category.slug}
                name={category.name}
                slug={category.slug}
                count={category.count}
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            WHY TRUST CLICKCLICKJOB.COM
          </h2>
          
          <div className="bg-blue-50 rounded-lg p-6 md:p-8">
            <ul className="space-y-4">
              <li className="flex">
                <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Every job verified by our team</span>
              </li>
              <li className="flex">
                <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Only verified remote opportunities</span>
              </li>
              <li className="flex">
                <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Updated daily with fresh listings</span>
              </li>
              <li className="flex">
                <svg className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Focused exclusively on data entry & admin roles</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Guide Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            REMOTE WORK GUIDE
          </h2>
          
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How to spot good opportunities:</h3>
              
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li>Be wary of jobs requiring upfront payments or purchases</li>
                <li>Research company reputation before applying</li>
                <li>Check for clear job descriptions and requirements</li>
                <li>Verify company contact information and website</li>
                <li>Trust your instincts - if it seems too good to be true, it probably is</li>
              </ul>
              
              <div className="mt-6">
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
    </Layout>
  );
};

export default HomePage; 