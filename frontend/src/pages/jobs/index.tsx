import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import SearchBar from '../../components/common/SearchBar';
import EnhancedJobCard from '../../components/common/EnhancedJobCard';
import JobList from '../../components/common/JobList';
import AdvancedFilters from '../../components/common/AdvancedFilters';
import AdBanner from '../../components/ads/AdBanner';

// Mock data for jobs (in a real app, these would come from an API)
const mockJobs = [
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
    location_restriction: 'us-only',
    jobCategory: 'data-entry',
    skills: ['Fast typing', 'Attention to detail', 'Data verification'],
    softwareRequirements: ['microsoft-office', 'excel'],
    timezone: 'EST/CST preferred',
    datePosted: 'today'
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
    location_restriction: 'worldwide',
    jobCategory: 'administrative-assistant',
    skills: ['Calendar management', 'Email management', 'Travel arrangements'],
    softwareRequirements: ['microsoft-office', 'google-workspace'],
    timezone: 'Flexible',
    datePosted: 'this-week'
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
    location_restriction: 'us-only',
    jobCategory: 'customer-service',
    skills: ['Customer support', 'Problem solving', 'Phone etiquette'],
    softwareRequirements: ['crm-systems'],
    timezone: 'EST/PST',
    datePosted: 'this-week'
  },
  {
    _id: 'job4',
    title: 'Data Entry Clerk',
    company: 'DataFlow Inc',
    location: 'Remote (US Only)',
    description: 'Input data from various sources into our proprietary system...',
    descriptionText: 'Input data from various sources into our proprietary system. Ensure accuracy and completeness of data. Flag discrepancies and errors.',
    salary: '$14-16/hr',
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    qualityScore: 7.9,
    featured: false,
    jobType: 'part-time',
    experienceLevel: 'no-experience',
    payRange: 'under-$15',
    location_restriction: 'us-only',
    jobCategory: 'data-entry',
    skills: ['Data verification', 'Basic computer skills'],
    softwareRequirements: ['data-entry-software'],
    timezone: 'Flexible',
    datePosted: 'this-week'
  },
  {
    _id: 'job5',
    title: 'Transcriptionist',
    company: 'TranscribeNow',
    location: 'Remote (Worldwide)',
    description: 'Convert audio recordings into written documents with high accuracy...',
    descriptionText: 'Convert audio recordings into written documents with high accuracy. Must have excellent listening skills and fast typing speed.',
    salary: '$17-20/hr',
    postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    qualityScore: 8.3,
    featured: false,
    jobType: 'contract',
    experienceLevel: 'entry-level',
    payRange: '$15-20',
    location_restriction: 'worldwide',
    jobCategory: 'transcription',
    skills: ['Fast typing', 'Excellent hearing', 'Grammar skills'],
    softwareRequirements: ['microsoft-office'],
    timezone: 'Flexible',
    datePosted: 'this-week'
  },
  {
    _id: 'job6',
    title: 'Virtual Executive Assistant',
    company: 'Executive Support Co',
    location: 'Remote (US Only)',
    description: 'Provide administrative support to C-level executives...',
    descriptionText: 'Provide administrative support to C-level executives. Manage calendars, arrange travel, and handle correspondence. Must be highly organized and professional.',
    salary: '$22-25/hr',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    qualityScore: 9.1,
    featured: false,
    jobType: 'full-time',
    experienceLevel: 'experienced',
    payRange: '$20-25',
    location_restriction: 'us-only',
    jobCategory: 'administrative-assistant',
    skills: ['Executive support', 'Calendar management', 'Travel arrangements', 'Confidentiality'],
    softwareRequirements: ['microsoft-office', 'google-workspace'],
    timezone: 'EST/CST',
    datePosted: 'this-week'
  },
  {
    _id: 'job7',
    title: 'Bookkeeping Assistant',
    company: 'FinanceHelp Inc',
    location: 'Remote (US & Canada)',
    description: 'Assist with accounts payable, accounts receivable, and general bookkeeping tasks...',
    descriptionText: 'Assist with accounts payable, accounts receivable, and general bookkeeping tasks. Reconcile accounts and prepare financial reports. Experience with QuickBooks required.',
    salary: '$20-24/hr',
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    qualityScore: 8.7,
    featured: false,
    jobType: 'part-time',
    experienceLevel: 'experienced',
    payRange: '$20-25',
    location_restriction: 'us-canada',
    jobCategory: 'bookkeeping',
    skills: ['Bookkeeping', 'Account reconciliation', 'Financial reporting'],
    softwareRequirements: ['quickbooks', 'excel'],
    timezone: 'EST/CST',
    datePosted: 'this-week'
  },
  {
    _id: 'job8',
    title: 'Entry-Level Data Processor',
    company: 'DataWorks Solutions',
    location: 'Remote (Worldwide)',
    description: 'Process and validate data from multiple sources...',
    descriptionText: 'Process and validate data from multiple sources. Format data according to company standards and check for accuracy and completeness.',
    salary: '$13-15/hr',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    qualityScore: 7.8,
    featured: false,
    jobType: 'full-time',
    experienceLevel: 'no-experience',
    payRange: 'under-$15',
    location_restriction: 'worldwide',
    jobCategory: 'data-entry',
    skills: ['Basic computer skills', 'Attention to detail'],
    softwareRequirements: ['microsoft-office', 'excel'],
    timezone: 'Flexible',
    datePosted: 'today'
  },
];

const JobListingsPage = () => {
  const router = useRouter();
  const { q: searchQuery } = router.query;
  
  const [jobs, setJobs] = useState(mockJobs);
  const [filteredJobs, setFilteredJobs] = useState(mockJobs);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'relevance'>('newest');
  
  // Apply filters and search
  useEffect(() => {
    let result = [...jobs];
    
    // Apply search
    if (searchQuery && typeof searchQuery === 'string') {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.company.toLowerCase().includes(query) || 
        job.descriptionText?.toLowerCase().includes(query)
      );
    }
    
    // Apply filters
    if (Object.keys(activeFilters).length > 0) {
      result = result.filter(job => {
        for (const [sectionId, selectedOptions] of Object.entries(activeFilters)) {
          if (selectedOptions.length > 0) {
            // @ts-ignore - we know these properties exist on our mock jobs
            const jobValue = job[sectionId];
            
            // Handle array values (like skills or softwareRequirements)
            if (Array.isArray(jobValue)) {
              const hasMatch = selectedOptions.some(option => jobValue.includes(option));
              if (!hasMatch) return false;
            } 
            // Handle string values
            else if (!jobValue || !selectedOptions.includes(jobValue)) {
              return false;
            }
          }
        }
        return true;
      });
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    } else if (sortBy === 'relevance') {
      // In a real app, this would use a more sophisticated relevance algorithm
      result.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    }
    
    setFilteredJobs(result);
  }, [jobs, searchQuery, activeFilters, sortBy]);
  
  // Handle filter changes
  const handleFilterChange = (filterType: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
  };
  
  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce(
      (count, filters) => count + (filters ? filters.length : 0),
      0
    );
  };
  
  return (
    <Layout
      title="Remote Admin & Data Entry Jobs | ClickClickJob.com"
      description="Browse verified remote admin and data entry jobs. Filter by pay, experience level, and job type to find your perfect work-from-home opportunity."
    >
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Remote Admin & Data Entry Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filteredJobs.length} verified remote opportunities
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <SearchBar 
                placeholder="Search job title, company, or keywords..."
                defaultValue={searchQuery as string}
                onSearch={(value) => router.push({
                  pathname: '/jobs',
                  query: { ...(value ? { q: value } : {}) }
                })}
              />
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-4 flex items-center">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 md:hidden"
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters (Desktop) */}
          <div className="hidden md:block lg:w-1/4">
            <div className="sticky top-6">
              <AdvancedFilters 
                onFilterChange={handleFilterChange}
                selectedFilters={activeFilters}
                showCounts={true}
              />
            </div>
          </div>
          
          {/* Mobile Filters (Slide-out) */}
          {isMobileFiltersOpen && (
            <div className="fixed inset-0 flex z-40 md:hidden">
              <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileFiltersOpen(false)} />
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <div className="flex-1 h-0 overflow-y-auto">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                    <button
                      type="button"
                      className="-mr-2 p-2 rounded-md text-gray-400 hover:text-gray-500"
                      onClick={() => setIsMobileFiltersOpen(false)}
                    >
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <AdvancedFilters
                    onFilterChange={handleFilterChange}
                    selectedFilters={activeFilters}
                    className="border-0 shadow-none rounded-none"
                    showCounts={true}
                  />
                </div>
                <div className="border-t border-gray-200 px-4 py-3">
                  <button
                    type="button"
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setIsMobileFiltersOpen(false)}
                  >
                    View {filteredJobs.length} jobs
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Job Listings */}
          <div className="lg:w-3/4">
            {filteredJobs.length > 0 ? (
              <div className="space-y-6">
                {/* Featured jobs shown separately at the top */}
                {filteredJobs.some(job => job.featured) && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-3">Featured Opportunities</h2>
                    <div className="space-y-4">
                      {filteredJobs
                        .filter(job => job.featured)
                        .map(job => (
                          <EnhancedJobCard 
                            key={job._id} 
                            job={job} 
                            showDetails={true}
                          />
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Regular jobs */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">
                    {filteredJobs.some(job => job.featured) ? 'More Jobs' : 'Available Jobs'}
                  </h2>
                  <div className="space-y-4">
                    {filteredJobs
                      .filter(job => !job.featured)
                      .map(job => (
                        <EnhancedJobCard key={job._id} job={job} />
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <svg 
                  className="mx-auto h-12 w-12 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Try adjusting your search filters or removing some criteria to see more results.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setActiveFilters({})}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
            
            {/* Pagination (only show if enough jobs) */}
            {filteredJobs.length > 10 && (
              <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                <div className="flex-1 flex justify-between sm:justify-end">
                  <button
                    type="button"
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            
            {/* Ad Placement */}
            <div className="mt-8">
              <AdBanner adSlotId="your-ad-slot-id-here" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobListingsPage; 