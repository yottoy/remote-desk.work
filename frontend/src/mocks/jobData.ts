import { Job, EnhancedJobListing } from '../types/job';

// WARNING: MOCK DATA ONLY - DO NOT USE IN PRODUCTION
// This file contains mock data for development and testing purposes only.
// In production, all job data should come from the database/API.

// Add a prefix to clearly identify mock jobs
const MOCK_PREFIX = 'MOCKDATA_';

// Mock data for jobs (in a real app, these would come from an API)
export const mockJobs: Job[] = [
  {
    _id: `${MOCK_PREFIX}job1`,
    title: '[MOCK] Remote Data Entry Specialist',
    company: '[MOCK] TechCorp Solutions',
    location: 'Remote (US Only)',
    description: '<p>We are looking for a detail-oriented Data Entry Specialist to join our team. The ideal candidate will have strong typing skills and attention to detail.</p><h3>Responsibilities:</h3><ul><li>Enter data from various sources into company database</li><li>Maintain data accuracy and integrity</li><li>Process paperwork and maintain filing systems</li><li>Generate reports as needed</li></ul>',
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
    datePosted: 'today',
    tags: ['data-entry', 'remote', 'entry-level'],
    categories: ['data-entry', 'administrative'],
    url: 'https://example.com/jobs/remote-data-entry-specialist',
    isMock: true // Explicitly mark as mock data
  },
  {
    _id: `${MOCK_PREFIX}job2`,
    title: '[MOCK] Virtual Administrative Assistant',
    company: '[MOCK] Global Services LLC',
    location: 'Remote (Worldwide)',
    description: '<p>Support executives by managing schedules, preparing reports, and handling correspondence. Must have excellent communication skills and be proficient in Microsoft Office suite.</p>',
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
    datePosted: 'this-week',
    tags: ['administrative', 'remote', 'entry-level'],
    categories: ['administrative', 'virtual-assistant'],
    url: 'https://example.com/jobs/virtual-administrative-assistant',
    isMock: true
  },
  {
    _id: `${MOCK_PREFIX}job3`,
    title: '[MOCK] Customer Service Representative',
    company: '[MOCK] Support Heroes',
    location: 'Remote (US Only)',
    description: '<p>Answer customer inquiries via phone, email, and chat. Resolve issues and provide information about our products and services. Must have excellent communication skills and a customer-first attitude.</p>',
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
    datePosted: 'this-week',
    tags: ['customer-service', 'remote', 'experienced'],
    categories: ['customer-service', 'administrative'],
    url: 'https://example.com/jobs/customer-service-representative',
    isMock: true
  },
  {
    _id: `${MOCK_PREFIX}job4`,
    title: '[MOCK] Data Entry Clerk',
    company: '[MOCK] DataFlow Inc',
    location: 'Remote (US Only)',
    description: '<p>Input data from various sources into our proprietary system. Ensure accuracy and completeness of data. Flag discrepancies and errors.</p>',
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
    datePosted: 'this-week',
    tags: ['data-entry', 'remote', 'no-experience'],
    categories: ['data-entry', 'data-processing'],
    url: 'https://example.com/jobs/data-entry-clerk',
    isMock: true
  },
  {
    _id: `${MOCK_PREFIX}job5`,
    title: '[MOCK] Transcriptionist',
    company: '[MOCK] TranscribeNow',
    location: 'Remote (Worldwide)',
    description: '<p>Convert audio recordings into written documents with high accuracy. Must have excellent listening skills and fast typing speed.</p>',
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
    datePosted: 'this-week',
    tags: ['transcription', 'remote', 'entry-level'],
    categories: ['transcription', 'data-entry'],
    url: 'https://example.com/jobs/transcriptionist',
    isMock: true
  },
  {
    _id: `${MOCK_PREFIX}job6`,
    title: '[MOCK] Virtual Executive Assistant',
    company: '[MOCK] Executive Support Co',
    location: 'Remote (US Only)',
    description: '<p>Provide administrative support to C-level executives. Manage calendars, arrange travel, and handle correspondence. Must be highly organized and professional.</p>',
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
    datePosted: 'this-week',
    tags: ['administrative', 'executive', 'remote', 'experienced'],
    categories: ['administrative', 'virtual-assistant'],
    url: 'https://example.com/jobs/virtual-executive-assistant',
    isMock: true
  },
  {
    _id: `${MOCK_PREFIX}job7`,
    title: '[MOCK] Bookkeeping Assistant',
    company: '[MOCK] FinanceHelp Inc',
    location: 'Remote (US & Canada)',
    description: '<p>Assist with accounts payable, accounts receivable, and general bookkeeping tasks. Reconcile accounts and prepare financial reports. Experience with QuickBooks required.</p>',
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
    datePosted: 'this-week',
    tags: ['bookkeeping', 'finance', 'remote', 'experienced'],
    categories: ['bookkeeping', 'administrative'],
    url: 'https://example.com/jobs/bookkeeping-assistant',
    isMock: true
  },
  {
    _id: `${MOCK_PREFIX}job8`,
    title: '[MOCK] Entry-Level Data Processor',
    company: '[MOCK] DataWorks Solutions',
    location: 'Remote (Worldwide)',
    description: '<p>Process and validate data from multiple sources. Format data according to company standards and check for accuracy and completeness.</p>',
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
    datePosted: 'today',
    tags: ['data-entry', 'remote', 'no-experience'],
    categories: ['data-entry', 'data-processing'],
    url: 'https://example.com/jobs/entry-level-data-processor',
    isMock: true
  },
];

// Mock function to get a job by ID - ensure it only works with mocked IDs
export const getJobById = (id: string): EnhancedJobListing => {
  // Only return mock data if the ID has the mock prefix or if we're in development
  if (!id.startsWith(MOCK_PREFIX) && process.env.NODE_ENV === 'production') {
    throw new Error('Attempted to use mock data in production');
  }
  
  // If ID doesn't have prefix but we're in dev, try to find it anyway
  const mockId = id.startsWith(MOCK_PREFIX) ? id : `${MOCK_PREFIX}${id}`;
  const job = mockJobs.find(job => job._id === mockId || job._id === id);
  
  if (!job) {
    throw new Error(`Job with ID ${id} not found`);
  }
  
  // Add enhanced properties for the job details page
  return {
    ...job,
    qualityScore: job.qualityScore || 7.0,
    featured: job.featured || false,
    qualityIndicatorScore: 8.0,
    credibilityScore: 9.0,
    recencyScore: 9.5,
    scrapedDate: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    sourceId: 'abc123',
    source: 'mock_data', // Explicitly mark source as mock
    uniqueIdentifier: `mock_${job.company.toLowerCase().replace(/\s+/g, '-')}-${job.title.toLowerCase().replace(/\s+/g, '-')}`,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(),
    engagementMetrics: {
      clickCount: 75,
      viewCount: 120,
      applicationCount: 25,
      lastClicked: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      lastViewed: new Date()
    },
    isMock: true
  };
};

// Filter jobs by category - ensure this never returns mock data in production
export const getJobsByCategory = (category: string): Job[] => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Attempted to use mock data in production');
    return [];
  }
  
  return mockJobs.filter(job => 
    job.jobCategory === category || (job.tags && job.tags.includes(category))
  );
};

// Get latest jobs (most recent first) - ensure this never returns mock data in production
export const getLatestJobs = (count: number = 10): Job[] => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Attempted to use mock data in production');
    return [];
  }
  
  return [...mockJobs]
    .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
    .slice(0, count);
};

// Get featured jobs - ensure this never returns mock data in production
export const getFeaturedJobs = (count: number = 3): Job[] => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Attempted to use mock data in production');
    return [];
  }
  
  return [...mockJobs]
    .filter(job => job.featured)
    .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
    .slice(0, count);
};

// Search jobs - ensure this never returns mock data in production
export const searchJobs = (query: string, filters: Record<string, any> = {}): Job[] => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Attempted to use mock data in production');
    return [];
  }
  
  // Convert query to lowercase for case-insensitive comparison
  const lowerQuery = query.toLowerCase();
  
  // Filter jobs by search query and other filters
  return mockJobs.filter(job => {
    // Skip if mock data in production
    if (process.env.NODE_ENV === 'production') return false;
    
    // Search in title, company, and description
    const matchesQuery = !query || 
      job.title.toLowerCase().includes(lowerQuery) ||
      job.company.toLowerCase().includes(lowerQuery) ||
      (job.descriptionText && job.descriptionText.toLowerCase().includes(lowerQuery));
    
    // If query doesn't match, return false immediately
    if (!matchesQuery) return false;
    
    // Apply additional filters if any
    for (const [key, value] of Object.entries(filters)) {
      if (!value || value.length === 0) continue;
      
      // Check if job has this filter property and it matches
      if (Array.isArray(value)) {
        // Handle array values (OR condition)
        const jobValue = (job as any)[key];
        if (!jobValue) return false;
        
        if (Array.isArray(jobValue)) {
          // If both are arrays, check for overlap
          if (!value.some(v => jobValue.includes(v))) return false;
        } else {
          // If job value is not array, check if it's in the filter values
          if (!value.includes(jobValue)) return false;
        }
      } else {
        // Handle string/primitive values (exact match)
        if ((job as any)[key] !== value) return false;
      }
    }
    
    return true;
  });
};

// Get similar jobs - ensure this never returns mock data in production
export const getSimilarJobs = (jobId: string) => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Attempted to use mock data in production');
    return [];
  }
  
  // For mock purposes, just return some other jobs
  return mockJobs
    .filter(job => job._id !== jobId)
    .sort(() => 0.5 - Math.random()) // Random sort
    .slice(0, 3);
};

// Get popular jobs - ensure this never returns mock data in production
export const getPopularJobs = () => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Attempted to use mock data in production');
    return [];
  }
  
  return mockJobs
    .sort(() => 0.5 - Math.random()) // Random sort for mock purposes
    .slice(0, 4);
}; 