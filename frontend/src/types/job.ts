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
}

// Helper functions for user engagement badges
export const isNew = (job: JobListing): boolean => {
  return new Date().getTime() - new Date(job.postedDate).getTime() < 24 * 60 * 60 * 1000;
};

export const isExpiringSoon = (job: JobListing): boolean => {
  return new Date(job.expiresAt).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;
};

export const isVerified = (job: JobListing): boolean => {
  return job.qualityScore >= 8;
};

export const isPopular = (job: EnhancedJobListing): boolean => {
  return (job.engagementMetrics?.clickCount ?? 0) >= 50;
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