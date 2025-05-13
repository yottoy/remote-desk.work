/**
 * Date handling utilities for the ClickClickJob.com application
 */

/**
 * Formats a date to a human-readable format
 * @param date - The date to format
 * @param format - Optional format (defaults to 'MMMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number | null | undefined, format = 'MMMM d, yyyy'): string {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date:', date);
      return '';
    }
    
    // Quick simple formatter - for more complex formatting, consider using date-fns
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return dateObj.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Gets the relative time from now for a date (e.g., "2 days ago")
 * @param date - The date to get relative time for
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date:', date);
      return '';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 30) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return '';
  }
}

/**
 * Converts a Date object to ISO string for serialization
 * @param date - The date to convert
 * @returns ISO date string or empty string if invalid
 */
export function toIsoString(date: Date | null | undefined): string {
  if (!date) return '';
  
  try {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString();
    }
    return '';
  } catch (error) {
    console.error('Error converting date to ISO string:', error);
    return '';
  }
}

/**
 * Safely parses a date string, returning a Date object or null if invalid
 * @param dateString - The date string to parse
 * @returns Date object or null
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Formats a date for display in the job listing card
 * @param date - The date to format
 * @returns Formatted date for job card
 */
export function formatJobCardDate(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return getRelativeTime(dateObj);
}

/**
 * Determines if a job is new (posted within the last 48 hours)
 * @param postedDate - The date the job was posted
 * @returns Boolean indicating if the job is new
 */
export function isNewJob(postedDate: Date | string | number | null | undefined): boolean {
  if (!postedDate) return false;
  
  try {
    const dateObj = postedDate instanceof Date ? postedDate : new Date(postedDate);
    
    if (isNaN(dateObj.getTime())) {
      return false;
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    return diffInHours <= 48; // New if posted within the last 48 hours
  } catch (error) {
    console.error('Error checking if job is new:', error);
    return false;
  }
} 