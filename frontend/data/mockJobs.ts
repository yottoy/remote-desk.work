import { EnhancedJobListing } from '../types/job';

// Mock job data with serializable date strings instead of Date objects
export const mockJobs: Omit<EnhancedJobListing, 'postedDate'>[] & { postedDate: string }[] = [
  {
    _id: 'job1',
    title: 'Data Entry Specialist',
    company: 'Global Data Solutions',
    location: 'Remote - Worldwide',
    salary: '$15-20/hr',
    jobType: 'Full-time',
    experienceLevel: 'no-experience',
    description: 'Looking for detail-oriented individuals to join our remote data entry team. No prior experience required. Tasks include inputting customer information, processing orders, and maintaining accurate records. Attention to detail and basic computer skills required.',
    descriptionText: 'Looking for detail-oriented individuals to join our remote data entry team. No prior experience required. Tasks include inputting customer information, processing orders, and maintaining accurate records. Attention to detail and basic computer skills required.',
    postedDate: '2025-05-15',
    qualityScore: 0.95,
    featured: false,
    skills: ['Microsoft Excel', 'Data Entry', 'Typing'],
    category: 'data-entry',
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
    descriptionText: 'Part-time data entry position perfect for beginners. Training provided. Flexible hours, work from home. Responsibilities include data entry, data verification, and basic administrative tasks.',
    postedDate: '2025-05-18',
    qualityScore: 0.9,
    featured: true,
    skills: ['Microsoft Office', 'Data Entry', 'Communication'],
    category: 'data-entry',
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
    descriptionText: 'Join our global team as an entry-level data entry specialist. No experience needed - we provide comprehensive training. Benefits include flexible schedule and advancement opportunities.',
    postedDate: '2025-05-20',
    qualityScore: 0.88,
    featured: false,
    skills: ['Data Entry', 'Organization', 'Attention to Detail'],
    category: 'data-entry',
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
    descriptionText: 'Data processing position for entry-level candidates. Process various forms of information into our digital systems. Full training provided for motivated individuals.',
    postedDate: '2025-05-19',
    qualityScore: 0.85,
    featured: false,
    skills: ['Data Processing', 'Computer Skills', 'Detail-Oriented'],
    category: 'data-entry',
    applyUrl: 'https://example.com/apply/job4'
  },
  {
    _id: 'job5',
    title: 'Work-From-Home Data Entry Operator',
    company: 'RemoteForce',
    location: 'Remote - North America',
    salary: '$17/hr',
    jobType: 'Full-time',
    experienceLevel: 'no-experience',
    description: 'Seeking detail-oriented individuals for data entry roles. Enter and verify data in our proprietary systems. No experience required, paid training provided.',
    descriptionText: 'Seeking detail-oriented individuals for data entry roles. Enter and verify data in our proprietary systems. No experience required, paid training provided.',
    postedDate: '2025-05-21',
    qualityScore: 0.92,
    featured: true,
    skills: ['Data Entry', 'Time Management', 'Fast Typing'],
    category: 'data-entry',
    applyUrl: 'https://example.com/apply/job5'
  },
  {
    _id: 'job6',
    title: 'Junior Data Entry Assistant',
    company: 'VirtualDesk Solutions',
    location: 'Remote - International',
    salary: '$14-16/hr',
    jobType: 'Part-time',
    experienceLevel: 'no-experience',
    description: 'Part-time opportunity for beginners to gain experience in data entry. Flexible hours, work from anywhere. Includes data input, verification, and basic record keeping.',
    descriptionText: 'Part-time opportunity for beginners to gain experience in data entry. Flexible hours, work from anywhere. Includes data input, verification, and basic record keeping.',
    postedDate: '2025-05-17',
    qualityScore: 0.87,
    featured: false,
    skills: ['Basic Computer Skills', 'Data Entry', 'Reliability'],
    category: 'data-entry',
    applyUrl: 'https://example.com/apply/job6'
  },
  {
    _id: 'job7',
    title: 'Remote Data Transcription Specialist',
    company: 'TranscribeNow',
    location: 'Remote - Global',
    salary: '$15-19/hr',
    jobType: 'Full-time',
    experienceLevel: 'no-experience',
    description: 'Convert audio and written content into digital format. No experience necessary, but good listening skills and attention to detail required. Training provided.',
    descriptionText: 'Convert audio and written content into digital format. No experience necessary, but good listening skills and attention to detail required. Training provided.',
    postedDate: '2025-05-16',
    qualityScore: 0.89,
    featured: false,
    skills: ['Transcription', 'Data Entry', 'Audio Processing'],
    category: 'data-entry',
    applyUrl: 'https://example.com/apply/job7'
  },
  {
    _id: 'job8',
    title: 'Entry-Level Database Assistant',
    company: 'DataPro Services',
    location: 'Remote - Worldwide',
    salary: '$16-18/hr',
    jobType: 'Full-time',
    experienceLevel: 'no-experience',
    description: 'Assist with database management and data entry tasks. No prior experience needed - we provide comprehensive training on our systems and processes.',
    descriptionText: 'Assist with database management and data entry tasks. No prior experience needed - we provide comprehensive training on our systems and processes.',
    postedDate: '2025-05-14',
    qualityScore: 0.86,
    featured: false,
    skills: ['Database Management', 'Data Entry', 'Organization'],
    category: 'data-entry',
    applyUrl: 'https://example.com/apply/job8'
  }
];

export const getJobsByCategory = (category: string) => {
  return mockJobs.filter(job => job.category === category);
};

export const getJobsByKeyword = (keyword: string) => {
  // For the demo, just return data-entry jobs for any data entry related keywords
  if (keyword.includes('data-entry') || keyword.includes('data-processing')) {
    return mockJobs;
  }
  
  // Return first 3 jobs as fallback
  return mockJobs.slice(0, 3);
};

export default mockJobs;
