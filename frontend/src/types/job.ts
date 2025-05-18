export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  descriptionText?: string;
  url?: string;
  salary?: string;
  postedDate: Date;
  scrapedDate?: Date;
  expiresAt?: Date;
  source?: string;
  sourceId?: string;
  qualityScore?: number;
  relevanceScore?: number;
  qualityIndicatorScore?: number;
  credibilityScore?: number;
  recencyScore?: number;
  featured?: boolean;
  tags?: string[];
  categories?: string[];
  uniqueIdentifier?: string;
  createdAt?: Date;
  updatedAt?: Date;
  jobType?: string;
  experienceLevel?: string;
  payRange?: string;
  location_restriction?: string;
  jobCategory?: string;
  skills?: string[];
  softwareRequirements?: string[];
  timezone?: string;
  datePosted?: string;
  isMock?: boolean;
  is_mock_data?: boolean;
}

export interface JobListing {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  descriptionText: string;
  url: string;
  salary?: string;
  postedDate: Date;
  scrapedDate: Date;
  expiresAt: Date;
  source: string;
  sourceId?: string;
  qualityScore: number;
  relevanceScore?: number;
  qualityIndicatorScore?: number;
  credibilityScore?: number;
  recencyScore?: number;
  featured: boolean;
  tags: string[];
  uniqueIdentifier: string;
  createdAt: Date;
  updatedAt: Date;
  jobType?: string;
  experienceLevel?: string;
  payRange?: string;
  location_restriction?: string;
  jobCategory?: string;
  skills?: string[];
  softwareRequirements?: string[];
  timezone?: string;
  datePosted?: string;
  isMock?: boolean;
  is_mock_data?: boolean;
}

// Define the properties used for user engagement features
export interface JobEngagementMetrics {
  clickCount: number;
  viewCount: number;
  applicationCount: number;
  lastClicked: Date;
  lastViewed: Date;
}

// Enhanced job listing with engagement metrics
export interface EnhancedJobListing extends Partial<JobListing> {
  _id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  descriptionText?: string;
  url?: string;
  qualityScore: number;
  postedDate: Date;
  featured: boolean;
  jobType?: string;
  experienceLevel?: string;
  payRange?: string;
  location_restriction?: string;
  jobCategory?: string;
  skills?: string[];
  softwareRequirements?: string[];
  timezone?: string;
  datePosted?: string;
  engagementMetrics?: JobEngagementMetrics;
  isMock?: boolean;
  is_mock_data?: boolean;
}

// Helper functions for user engagement badges
export const isNew = (job: Job | JobListing | EnhancedJobListing): boolean => {
  return new Date().getTime() - new Date(job.postedDate).getTime() < 24 * 60 * 60 * 1000;
};

export const isExpiringSoon = (job: Job | JobListing | EnhancedJobListing): boolean => {
  if (!job.expiresAt) return false;
  return new Date(job.expiresAt).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;
};

export const isVerified = (job: Job | JobListing | EnhancedJobListing): boolean => {
  return (job.qualityScore || 0) >= 8;
};

export const isPopular = (job: EnhancedJobListing): boolean => {
  return (job.engagementMetrics?.clickCount ?? 0) >= 50;
};

// Helper to check if a job is mock data that should be filtered out
export const isMockJob = (job: Job | JobListing | EnhancedJobListing): boolean => {
  if (!job) return true;
  
  // Check for explicit mock flags
  if (job.isMock || job.is_mock_data) return true;
  
  // Check for mock ID pattern (job1, job2, etc)
  if (typeof job._id === 'string' && /^job\d+$/.test(job._id)) return true;
  
  // Check for suspicious URLs
  if (job.url && typeof job.url === 'string' && 
      /example\.com|placeholder|test|mock/.test(job.url)) return true;
  
  // Check for mock prefix in title/company
  if ((job.title && job.title.startsWith('[MOCK]')) || 
      (job.company && job.company.startsWith('[MOCK]'))) return true;
  
  return false;
};

export interface JobsResponse {
  jobs: Job[];
  pagination: {
    totalJobs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
} 