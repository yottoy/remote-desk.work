import { Job, EnhancedJobListing } from '../types/job';

/**
 * Filters out mock jobs from an array of jobs
 * This ensures no test or mock data is ever displayed to users
 */
export function filterMockJobs(jobs: any[]): EnhancedJobListing[] {
  if (!jobs || jobs.length === 0) return [];
  
  return jobs.filter((job: any) => {
    // If job doesn't exist or is missing critical data, filter it out
    if (!job || !job._id || !job.title || !job.company) return false;
    
    // Explicitly filter out TechCorp Solutions (known mock company)
    if (job.company === 'TechCorp Solutions') return false;
    
    // Filter out mock job IDs
    if (typeof job._id === 'string' && /^job\d+$/.test(job._id)) return false;
    
    // Filter jobs with example.com or mock URLs
    if (job.url && typeof job.url === 'string' && 
        /example\.com|placeholder|test|mock/.test(job.url)) return false;
    
    // Filter jobs with mock flags
    if (job.isMock || job.is_mock_data) return false;
    
    // Filter jobs with mock prefixes in title/company
    if ((job.title && job.title.startsWith('[MOCK]')) || 
        (job.company && job.company.startsWith('[MOCK]'))) return false;
    
    // Make sure job has required fields for display
    if (!job.postedDate) return false;
    
    // Filter out engineering and other irrelevant job types that don't match our focus
    if (job.title && typeof job.title === 'string') {
      const irrelevantJobPattern = /engineer|developer|software|coding|programming|devops|architect|frontend|backend|fullstack|tech lead|IT manager|sys admin|network admin|security/i;
      if (irrelevantJobPattern.test(job.title)) return false;
    }
    
    // Filter out irrelevant job categories if present
    if (job.jobCategory && typeof job.jobCategory === 'string') {
      const irrelevantCategoryPattern = /engineering|development|programming|IT|security|networking/i;
      if (irrelevantCategoryPattern.test(job.jobCategory)) return false;
    }
    
    // If it passes all checks, it's a real job
    return true;
  });
}

/**
 * Formats a job's posted date relative to the current time
 */
export function formatJobDate(postedDate: Date | string): string {
  if (!postedDate) return 'Recently';
  
  try {
    const date = postedDate instanceof Date ? postedDate : new Date(postedDate);
    
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  } catch (error) {
    console.error('Error formatting job date:', error);
    return 'Recently';
  }
}

/**
 * Formats a salary string for display
 */
export function formatSalary(salary: string | number | undefined): string {
  if (!salary) return '';
  
  if (typeof salary === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(salary);
  }
  
  // If it's already a string, return as is
  return salary;
}

/**
 * Detects the job category based on title and description
 */
export function detectJobCategory(job: Job | EnhancedJobListing): string {
  const title = job.title?.toLowerCase() || '';
  const description = (job.description || job.descriptionText || '').toLowerCase();
  
  if (title.includes('data entry') || description.includes('data entry')) {
    return 'data-entry';
  } else if (title.includes('virtual assistant') || title.includes('va ') || description.includes('virtual assistant')) {
    return 'virtual-assistant';
  } else if (title.includes('executive assistant') || description.includes('executive assistant')) {
    return 'executive-assistant';
  } else if (title.includes('admin') || title.includes('administrative') || description.includes('administrative')) {
    return 'admin';
  } else if (title.includes('customer service') || description.includes('customer service')) {
    return 'customer-service';
  } else {
    return 'admin'; // Default category
  }
}
