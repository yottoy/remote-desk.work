import { Job, EnhancedJobListing } from '../types/job';

/**
 * MOCK DATA REMOVED
 * 
 * We&apos;ve removed all mock job data from the application as it&apos;s no longer needed.
 * All job data should now come from the live API endpoints.
 * 
 * This file remains as a stub to prevent import errors but no longer contains
 * any usable mock data.
 */

// Provide empty arrays to avoid breaking imports
export const mockJobs: Job[] = [];

// All mock functions now return empty arrays
export const getJobById = (id: string): EnhancedJobListing => {
  console.warn('Mock data has been removed from the application');
  throw new Error('Mock data has been removed. Please use the API for job data.');
};

export const getJobsByCategory = (category: string): Job[] => {
  console.warn('Mock data has been removed from the application');
  return [];
};

export const getLatestJobs = (count: number = 10): Job[] => {
  console.warn('Mock data has been removed from the application');
  return [];
};

export const getFeaturedJobs = (count: number = 3): Job[] => {
  console.warn('Mock data has been removed from the application');
  return [];
};

export const searchJobs = (query: string, filters: Record<string, any> = {}): Job[] => {
  console.warn('Mock data has been removed from the application');
  return [];
};

export const getSimilarJobs = (jobId: string) => {
  console.warn('Mock data has been removed from the application');
  return [];
};

export const getPopularJobs = () => {
  console.warn('Mock data has been removed from the application');
  return [];
}; 