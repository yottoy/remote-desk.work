import { EnhancedJobListing } from '../types/job';

// Mock data for jobs (in a real app, these would come from an API)
export const mockJobs = [
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
    categories: ['data-entry'],
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
    categories: ['administrative', 'virtual-assistant'],
    tags: ['administrative', 'remote', 'virtual-assistant'],
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
    categories: ['customer-service'],
    tags: ['customer-service', 'remote', 'communication'],
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
    categories: ['data-entry'],
    tags: ['data-entry', 'remote', 'part-time'],
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
    categories: ['transcription'],
    tags: ['transcription', 'remote', 'audio'],
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
    categories: ['administrative', 'virtual-assistant'],
    tags: ['executive-assistant', 'remote', 'administrative'],
    url: 'https://example.com/jobs/virtual-executive-assistant'
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

// Mock function to search jobs
export const searchJobs = (query: string, filters = {}) => {
  let results = [...mockJobs];
  
  // Apply search query if provided
  if (query) {
    const searchTerms = query.toLowerCase().split(' ');
    results = results.filter(job => {
      return searchTerms.some(term => 
        job.title.toLowerCase().includes(term) || 
        job.company.toLowerCase().includes(term) || 
        job.descriptionText.toLowerCase().includes(term)
      );
    });
  }
  
  // Apply filters if provided
  if (Object.keys(filters).length > 0) {
    results = results.filter(job => {
      return Object.entries(filters).every(([key, value]) => {
        // @ts-ignore - dynamic property access
        return !value || job[key] === value || (Array.isArray(value) && value.includes(job[key]));
      });
    });
  }
  
  return {
    jobs: results,
    total: results.length,
    page: 1,
    pageSize: results.length,
    totalPages: 1
  };
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