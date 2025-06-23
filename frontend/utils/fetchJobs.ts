import axios from 'axios';

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string | number;
  postedDate?: string;
  jobType?: string;
  experienceLevel?: string;
  employmentType?: string;
  remote: boolean;
  skills?: string[];
  timezone?: string;
  credibilityScore?: number;
}

export interface PaginationData {
  totalJobs: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface JobsResponse {
  jobs: Job[];
  pagination: PaginationData;
}

interface JobSearchParams {
  keyword?: string;
  jobType?: string;
  experienceLevel?: string;
  minSalary?: string | number;
  maxSalary?: string | number;
  employmentType?: string;
  softwareSkills?: string;
  timezone?: string;
  postedAfter?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'salary' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fetch all jobs with optional filtering
 */
export async function fetchJobs(params: JobSearchParams = {}): Promise<JobsResponse> {
  try {
    const response = await axios.get('/api/jobs', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return { jobs: [], pagination: { totalJobs: 0, totalPages: 0, currentPage: 1, limit: 20 } };
  }
}

/**
 * Fetch admin and data entry jobs specifically
 */
export async function fetchAdminJobs(params: JobSearchParams = {}): Promise<JobsResponse> {
  try {
    const response = await axios.get('/api/admin-jobs', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin jobs:', error);
    return { jobs: [], pagination: { totalJobs: 0, totalPages: 0, currentPage: 1, limit: 20 } };
  }
}

/**
 * Fetch a single job by ID
 */
export async function fetchJobById(id: string): Promise<Job | null> {
  try {
    const response = await axios.get(`/api/jobs/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching job details:', error);
    return null;
  }
}

/**
 * Fetch job categories
 */
export async function fetchJobCategories(): Promise<{ category: string; count: number }[]> {
  try {
    const response = await axios.get('/api/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching job categories:', error);
    return [];
  }
} 