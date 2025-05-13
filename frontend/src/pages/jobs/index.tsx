import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import SearchBar from '../../components/common/SearchBar';
import JobCard from '../../components/common/JobCard';
import FilterSidebar, { MobileFilterDrawer } from '../../components/common/FilterSidebar';

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
    payRange: '$15-20/hr',
    location_restriction: 'us-only'
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
    payRange: '$15-20/hr',
    location_restriction: 'worldwide'
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
    payRange: '$15-20/hr',
    location_restriction: 'us-only'
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
    payRange: 'under-$15/hr',
    location_restriction: 'us-only'
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
    payRange: '$15-20/hr',
    location_restriction: 'worldwide'
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
    payRange: '$20-25/hr',
    location_restriction: 'us-only'
  },
];

const JobListingsPage = () => {
  const router = useRouter();
  const { q: searchQuery, filters: initialFilters } = router.query;
  
  const [jobs, setJobs] = useState(mockJobs);
  const [filteredJobs, setFilteredJobs] = useState(mockJobs);
  const [sortBy, setSortBy] = useState('newest');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  
  // Filter configurations
  const filterSections = [
    {
      id: 'jobType',
      title: 'Job Type',
      type: 'checkbox' as const,
      options: [
        { id: 'full-time', label: 'Full-time' },
        { id: 'part-time', label: 'Part-time' },
        { id: 'contract', label: 'Contract' },
        { id: 'temporary', label: 'Temporary' }
      ]
    },
    {
      id: 'experienceLevel',
      title: 'Experience',
      type: 'checkbox' as const,
      options: [
        { id: 'no-experience', label: 'No experience' },
        { id: 'entry-level', label: 'Entry-level' },
        { id: 'experienced', label: 'Experienced' }
      ]
    },
    {
      id: 'payRange',
      title: 'Pay Range',
      type: 'checkbox' as const,
      options: [
        { id: 'under-$15/hr', label: 'Under $15/hr' },
        { id: '$15-20/hr', label: '$15-20/hr' },
        { id: '$20-25/hr', label: '$20-25/hr' },
        { id: '$25+/hr', label: '$25+/hr' }
      ]
    },
    {
      id: 'location_restriction',
      title: 'Location',
      type: 'checkbox' as const,
      options: [
        { id: 'worldwide', label: 'Worldwide' },
        { id: 'us-only', label: 'US Only' }
      ]
    }
  ];
  
  // Parse initial filters from URL
  useEffect(() => {
    if (initialFilters && typeof initialFilters === 'string') {
      const parsedFilters = initialFilters.split(',');
      const newActiveFilters: Record<string, string[]> = {};
      
      parsedFilters.forEach(filter => {
        for (const section of filterSections) {
          const matchingOption = section.options.find(option => option.id === filter);
          if (matchingOption) {
            if (!newActiveFilters[section.id]) {
              newActiveFilters[section.id] = [];
            }
            newActiveFilters[section.id].push(matchingOption.id);
          }
        }
      });
      
      setActiveFilters(newActiveFilters);
    }
  }, [initialFilters]);
  
  // Update filterSections with activeFilters
  const filtersWithState = filterSections.map(section => ({
    ...section,
    options: section.options.map(option => ({
      ...option,
      checked: activeFilters[section.id]?.includes(option.id) || false
    }))
  }));
  
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
            if (!jobValue || !selectedOptions.includes(jobValue)) {
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
  const handleFilterChange = (sectionId: string, optionId: string, checked: boolean) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      
      if (!newFilters[sectionId]) {
        newFilters[sectionId] = [];
      }
      
      if (checked) {
        newFilters[sectionId] = [...newFilters[sectionId], optionId];
      } else {
        newFilters[sectionId] = newFilters[sectionId].filter(id => id !== optionId);
      }
      
      // Clean up empty arrays
      if (newFilters[sectionId].length === 0) {
        delete newFilters[sectionId];
      }
      
      return newFilters;
    });
  };
  
  // Create filter chips from active filters
  const activeFilterChips = Object.entries(activeFilters).flatMap(([sectionId, optionIds]) => 
    optionIds.map(optionId => {
      const section = filterSections.find(s => s.id === sectionId);
      const option = section?.options.find(o => o.id === optionId);
      
      return {
        label: option?.label || optionId,
        value: optionId,
        active: true
      };
    })
  );
  
  // Create category title based on filters
  let categoryTitle = "REMOTE JOBS";
  
  // Count active filters
  const totalActiveFilters = Object.values(activeFilters).flat().length;
  
  return (
    <Layout
      title={`Remote ${searchQuery || ''} Jobs | ${totalActiveFilters > 0 ? 'Filtered Results' : 'All Listings'} | ClickClickJob.com`}
      description={`Find ${filteredJobs.length} verified remote ${searchQuery || ''} jobs with ${totalActiveFilters > 0 ? 'custom filters' : 'no experience needed'}. Work-from-home opportunities updated daily.`}
    >
      <div className="bg-gray-50 min-h-screen">
        {/* Search header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <SearchBar 
              placeholder="Search for jobs..."
              defaultValue={searchQuery as string || ''}
            />
          </div>
        </div>
        
        {/* Results heading and filters */}
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{categoryTitle}</h1>
            <p className="text-gray-600 mt-1">{filteredJobs.length} verified remote opportunities</p>
            
            {activeFilterChips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => {
                      // Find which section this filter belongs to
                      for (const [sectionId, optionIds] of Object.entries(activeFilters)) {
                        if (optionIds.includes(chip.value)) {
                          handleFilterChange(sectionId, chip.value, false);
                          break;
                        }
                      }
                    }}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {chip.label}
                    <svg className="ml-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                ))}
                
                <button
                  onClick={() => setActiveFilters({})}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
          
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Filter sidebar - desktop */}
            <div className="hidden lg:block lg:col-span-3">
              <FilterSidebar 
                filters={filtersWithState}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            {/* Main content */}
            <main className="lg:col-span-9">
              {/* Sort controls */}
              <div className="flex justify-between items-center mb-4">
                <div className="lg:hidden">
                  <button
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                    Filters
                  </button>
                </div>
                
                <div className="flex items-center">
                  <label htmlFor="sort-by" className="sr-only">Sort by</label>
                  <select
                    id="sort-by"
                    name="sort-by"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest</option>
                    <option value="relevance">Relevance</option>
                  </select>
                </div>
              </div>
              
              {/* Job listings */}
              <div className="space-y-6">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <JobCard key={job._id} job={job} />
                  ))
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search criteria or removing some filters.</p>
                    <button
                      onClick={() => {
                        setActiveFilters({});
                        router.push('/jobs');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {filteredJobs.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <a
                      href="#"
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                    <a
                      href="#"
                      aria-current="page"
                      className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                    >
                      1
                    </a>
                    <a
                      href="#"
                      className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                    >
                      2
                    </a>
                    <a
                      href="#"
                      className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 hidden md:inline-flex relative items-center px-4 py-2 border text-sm font-medium"
                    >
                      3
                    </a>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                    <a
                      href="#"
                      className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                    >
                      10
                    </a>
                    <a
                      href="#"
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </nav>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      
      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filtersWithState}
        onFilterChange={handleFilterChange}
      />
    </Layout>
  );
};

export default JobListingsPage; 