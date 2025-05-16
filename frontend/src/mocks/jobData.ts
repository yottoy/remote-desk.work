import { Job, EnhancedJobListing } from '../types/job';

// Mock data for jobs (in a real app, these would come from an API)
export const mockJobs: Job[] = [
  {
    _id: 'job1',
    title: 'Remote Data Entry Specialist',
    company: 'TechCorp Solutions',
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
    url: 'https://example.com/jobs/remote-data-entry-specialist'
  },
  {
    _id: 'job2',
    title: 'Virtual Administrative Assistant',
    company: 'Global Services LLC',
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
    url: 'https://example.com/jobs/virtual-administrative-assistant'
  },
  {
    _id: 'job3',
    title: 'Customer Service Representative',
    company: 'Support Heroes',
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
    url: 'https://example.com/jobs/customer-service-representative'
  },
  {
    _id: 'job4',
    title: 'Data Entry Clerk',
    company: 'DataFlow Inc',
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
    url: 'https://example.com/jobs/data-entry-clerk'
  },
  {
    _id: 'job5',
    title: 'Transcriptionist',
    company: 'TranscribeNow',
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
    url: 'https://example.com/jobs/transcriptionist'
  },
  {
    _id: 'job6',
    title: 'Virtual Executive Assistant',
    company: 'Executive Support Co',
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
    url: 'https://example.com/jobs/virtual-executive-assistant'
  },
  {
    _id: 'job7',
    title: 'Bookkeeping Assistant',
    company: 'FinanceHelp Inc',
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
    url: 'https://example.com/jobs/bookkeeping-assistant'
  },
  {
    _id: 'job8',
    title: 'Entry-Level Data Processor',
    company: 'DataWorks Solutions',
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
    url: 'https://example.com/jobs/entry-level-data-processor'
  },
];

// Mock function to get a job by ID
export const getJobById = (id: string): EnhancedJobListing => {
  const job = mockJobs.find(job => job._id === id);
  
  if (!job) {
    throw new Error(`Job with ID ${id} not found`);
  }
  
  // Add enhanced properties for the job details page
  return {
    ...job,
    qualityIndicatorScore: 8.0,
    credibilityScore: 9.0,
    recencyScore: 9.5,
    scrapedDate: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    sourceId: 'abc123',
    source: 'indeed',
    uniqueIdentifier: `${job.company.toLowerCase().replace(/\s+/g, '-')}-${job.title.toLowerCase().replace(/\s+/g, '-')}`,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(),
    engagementMetrics: {
      clickCount: 75,
      viewCount: 120,
      applicationCount: 25,
      lastClicked: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      lastViewed: new Date()
    }
  };
};

// Filter jobs by category
export const getJobsByCategory = (category: string): Job[] => {
  return mockJobs.filter(job => 
    job.jobCategory === category || (job.tags && job.tags.includes(category))
  );
};

// Get latest jobs (most recent first)
export const getLatestJobs = (count: number = 10): Job[] => {
  return [...mockJobs]
    .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
    .slice(0, count);
};

// Get featured jobs
export const getFeaturedJobs = (count: number = 3): Job[] => {
  return [...mockJobs]
    .filter(job => job.featured)
    .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
    .slice(0, count);
};

// Search jobs by query and filters
export const searchJobs = (query: string, filters: Record<string, any> = {}): Job[] => {
  let results = [...mockJobs];
  
  // Apply text search
  if (query) {
    const searchTerm = query.toLowerCase();
    results = results.filter(job => 
      job.title.toLowerCase().includes(searchTerm) || 
      job.company.toLowerCase().includes(searchTerm) || 
      (job.descriptionText && job.descriptionText.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply filters (if any)
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    
    if (key === 'jobType' && value) {
      results = results.filter(job => job.jobType === value);
    } else if (key === 'experienceLevel' && value) {
      results = results.filter(job => job.experienceLevel === value);
    } else if (key === 'payRange' && value) {
      results = results.filter(job => job.payRange === value);
    } else if (key === 'location' && value) {
      results = results.filter(job => job.location_restriction === value);
    } else if (key === 'datePosted' && value) {
      results = results.filter(job => job.datePosted === value);
    } else if (key === 'jobCategory' && value) {
      results = results.filter(job => job.jobCategory === value);
    }
  }
  
  return results;
};

// Mock function to get similar jobs
export const getSimilarJobs = (jobId: string) => {
  const job = mockJobs.find(job => job._id === jobId);
  if (!job) return [];
  
  return mockJobs
    .filter(j => j._id !== jobId && 
      (j.categories.some(cat => job.categories.includes(cat)) || 
       j.tags.some(tag => job.tags.includes(tag))))
    .slice(0, 3);
};

// Mock function to get popular jobs
export const getPopularJobs = () => {
  return mockJobs
    .filter(job => job.qualityScore >= 8.0)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, 4);
}; 