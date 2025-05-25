export interface Job {
  _id?: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  postedAt: Date;
  site: string;
  keywords: string[];
  isMock?: boolean;
  is_mock_data?: boolean;
  qualityScore?: number;
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
  category?: string; // For SEO landing pages (admin, data-entry, virtual-assistant, executive-assistant)
  verified?: boolean; // Explicitly marked as verified
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
  // Use postedAt if available, otherwise postedDate
  const date = (job as any).postedAt ?? (job as any).postedDate;
  if (!date) return false;
  return new Date().getTime() - new Date(date).getTime() < 24 * 60 * 60 * 1000;
};

export const isExpiringSoon = (job: Job | JobListing | EnhancedJobListing): boolean => {
  const expiresAt = (job as any).expiresAt;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;
};

export const isVerified = (job: Job | JobListing | EnhancedJobListing): boolean => {
  const qualityScore = (job as any).qualityScore;
  return (qualityScore || 0) >= 8;
};

export const isPopular = (job: EnhancedJobListing): boolean => {
  return (job.engagementMetrics?.clickCount ?? 0) >= 50;
};

// Helper to check if a job is mock data that should be filtered out
export const isMockJob = (job: Job | JobListing | EnhancedJobListing): boolean => {
  if (!job) return true;
  
  // Check for explicit mock flags
  if ((job as any).isMock || (job as any).is_mock_data) return true;
  
  // Check for mock ID pattern (job1, job2, etc)
  if (typeof job._id === 'string' && /^job\d+$/.test(job._id)) return true;
  
  // Check for suspicious URLs
  if ((job as any).url && typeof (job as any).url === 'string' && 
      /example\.com|placeholder|test|mock/.test((job as any).url)) return true;
  
  // Check for mock prefix in title/company
  if ((job as any).title && (job as any).title.startsWith('[MOCK]')) return true;
  if ((job as any).company && (job as any).company.startsWith('[MOCK]')) return true;
  
  // Filter out engineering and other irrelevant job types
  if ((job as any).title && typeof (job as any).title === 'string') {
    const irrelevantJobPattern = /engineer|developer|software|coding|programming|devops|architect|frontend|backend|fullstack|tech lead|IT manager|sys admin|network admin|security/i;
    if (irrelevantJobPattern.test((job as any).title)) return true;
  }
  
  // Filter out irrelevant job categories
  if ((job as any).jobCategory && typeof (job as any).jobCategory === 'string') {
    const irrelevantCategoryPattern = /engineering|development|programming|IT|security|networking/i;
    if (irrelevantCategoryPattern.test((job as any).jobCategory)) return true;
  }
  
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