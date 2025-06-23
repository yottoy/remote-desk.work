import { Job, EnhancedJobListing } from '../types/job';

/**
 * Enhanced remote job validation for frontend filtering
 */
function isLikelyRemoteJob(job: any): boolean {
  const title = (job.title || '').toLowerCase();
  const description = (job.description || '').toLowerCase();
  const location = (job.location || '').toLowerCase();
  const combinedText = `${title} ${description} ${location}`;

  // Strong remote indicators
  const strongRemoteIndicators = [
    'fully remote', '100% remote', 'remote-first', 'remote only',
    'work from anywhere', 'location independent', 'distributed team',
    'no office required', 'home office', 'telecommute', 'work-from-home', 'work from home'
  ];

  // Strong on-site indicators that should exclude the job
  const strongOnsiteIndicators = [
    'on-site', 'onsite', 'in-person', 'office location', 'come into the office',
    'at our office', 'in our office', 'office environment', 'headquarters',
    'commute to', 'commuting distance', 'within commuting distance',
    'relocation required', 'must relocate', 'local candidates only',
    'must be located in', 'based in', 'prefer local', 'face-to-face',
    'parking provided', 'office culture', 'on-site training', 'report to office'
  ];

  // Job titles that are typically on-site
  const typicallyOnsiteJobTitles = [
    'receptionist', 'front desk', 'security', 'maintenance', 'custodial',
    'warehouse', 'shipping', 'receiving', 'driver', 'delivery', 'cashier',
    'retail', 'sales associate', 'store', 'clinic', 'medical assistant',
    'dental assistant', 'nurse', 'therapist', 'technician', 'lab'
  ];

  // Check for strong remote indicators
  let remoteScore = 0;
  for (const indicator of strongRemoteIndicators) {
    if (combinedText.includes(indicator)) {
      remoteScore += 3;
    }
  }

  // Check for weak remote indicators
  if (combinedText.includes('remote') || combinedText.includes('virtual') || combinedText.includes('wfh')) {
    remoteScore += 1;
  }

  // Check for strong on-site indicators (these are disqualifying)
  for (const indicator of strongOnsiteIndicators) {
    if (combinedText.includes(indicator)) {
      return false; // Immediately disqualify
    }
  }

  // Check for typically on-site job titles
  for (const onsiteTitle of typicallyOnsiteJobTitles) {
    if (title.includes(onsiteTitle)) {
      return false; // Immediately disqualify
    }
  }

  // Check for specific location patterns that suggest on-site work
  const locationPatterns = [
    /\w+,\s*[A-Z]{2}(?:\s*,?\s*US)?$/i, // City, State format
    /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr|lane|ln)/i,
    /suite\s+\d+/i,
    /must be able to commute/i,
    /reliable transportation/i,
    /valid driver.?s license/i
  ];

  for (const pattern of locationPatterns) {
    if (pattern.test(combinedText)) {
      return false; // Disqualify if specific location requirements found
    }
  }

  // Special check for "work location: in person" type phrases
  if (/work location.*in person/i.test(combinedText) || 
      /physical presence required/i.test(combinedText) ||
      /office based/i.test(combinedText)) {
    return false;
  }

  // If location is not "remote" or similar, and we don't have strong remote indicators, be cautious
  if (location && location !== 'remote' && location !== 'work from home' && 
      !location.includes('remote') && remoteScore < 2) {
    // Check if location looks like a specific place
    if (/\w+,\s*[A-Z]{2}/i.test(location)) {
      return false; // Specific city/state location without strong remote indicators
    }
  }

  // If we have any remote indicators and no disqualifying factors, accept
  return remoteScore > 0 || location.includes('remote') || location.includes('work from home');
}

/**
 * Filters out mock jobs and on-site jobs from an array of jobs
 * This ensures no test, mock data, or on-site jobs are displayed to users
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

    // NEW: Enhanced remote job validation
    // If the job has been validated by the backend, use that
    if (job.remoteValidation) {
      // Use backend validation if available
      if (job.remoteValidation.recommendation === 'REJECT_HIGH_CONFIDENCE_ONSITE' ||
          job.remoteValidation.recommendation === 'REJECT_MEDIUM_CONFIDENCE_ONSITE') {
        return false;
      }
    } else {
      // Fallback to frontend validation for jobs not yet validated
      if (!isLikelyRemoteJob(job)) {
        return false;
      }
    }
    
    // If it passes all checks, it's a valid remote job
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
  const description = (job.description || ('descriptionText' in job ? job.descriptionText : '') || '').toLowerCase();
  
  if (title.includes('data entry') || description.includes('data entry')) {
    return 'data-entry';
  } else if (title.includes('virtual assistant') || title.includes('va ') || description.includes('virtual assistant')) {
    return 'virtual-assistant';
  } else if (title.includes('executive assistant') || description.includes('executive assistant')) {
    return 'administrative-assistant';
  } else if (title.includes('admin') || title.includes('administrative') || description.includes('administrative')) {
    return 'administrative';
  } else if (title.includes('customer service') || description.includes('customer service')) {
    return 'customer-service';
  } else {
    return 'administrative'; // Default category
  }
}

/**
 * Counts jobs added in the past 7 days
 */
export function countRecentJobs(jobs: (Job | EnhancedJobListing)[], days: number = 7): number {
  if (!jobs || jobs.length === 0) return 0;
  
  const now = new Date();
  const daysAgo = new Date();
  daysAgo.setDate(now.getDate() - days);
  
  console.log(`Counting jobs from ${daysAgo.toISOString()} to ${now.toISOString()}`);
  console.log(`Total jobs to check: ${jobs.length}`);
  
  const recentJobs = jobs.filter(job => {
    if (!job.postedDate) {
      console.log('Job missing postedDate:', job._id || 'unknown');
      return false;
    }
    
    try {
      const postedDate = job.postedDate instanceof Date ? job.postedDate : new Date(job.postedDate);
      const isRecent = !isNaN(postedDate.getTime()) && postedDate >= daysAgo;
      
      if (!isNaN(postedDate.getTime())) {
        console.log(`Job ${job._id}: ${postedDate.toISOString()} - Recent: ${isRecent}`);
      }
      
      return isRecent;
    } catch (error) {
      console.error('Error parsing job posted date:', error);
      return false;
    }
  });
  
  console.log(`Found ${recentJobs.length} recent jobs out of ${jobs.length} total`);
  return recentJobs.length;
}

/**
 * Formats job description by converting markdown to HTML and fixing bullet point inconsistencies
 */
export function formatJobDescription(description: string): string {
  if (!description) return '';
  
  let formatted = description;
  
  // First, check if we have HTML content and clean up markdown within it
  const hasHTMLTags = /<[^>]+>/g.test(formatted);
  
  if (hasHTMLTags) {
    // Even with HTML tags, we still need to process markdown within the content
    // Convert markdown bold to HTML within existing HTML structure
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert markdown italic (be careful not to affect bullet points)
    formatted = formatted.replace(/(?<!\*)\*([^*\n<>]+)\*(?!\*)/g, '<em>$1</em>');
    
         // Fix bullet points that are just asterisks to proper HTML lists
     // Look for patterns like "* Item" within <p> tags
     formatted = formatted.replace(/<p>(\s*\*\s+[^<]+)<\/p>/g, (match, content) => {
       const items = content.split(/\n\s*\*\s+/).filter((item: string) => item.trim());
       if (items.length > 1) {
         const listItems = items.map((item: string) => `<li>${item.trim()}</li>`).join('');
         return `<ul>${listItems}</ul>`;
       }
       return match;
     });
     
     // Convert bullet points that appear as "* Item" in text
     formatted = formatted.replace(/(\*\s+)([^\n\*<>]+)/g, '<li>$2</li>');
     
     // Group consecutive <li> elements into lists
     formatted = formatted.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)+/g, (match) => {
       return `<ul>${match}</ul>`;
     });
     
     // Clean up any remaining standalone <li> elements by wrapping them in <ul>
     // Simple approach: find <li> not preceded by <ul> and wrap in <ul>
     formatted = formatted.replace(/(<li>(?:(?!<\/?ul>).)*<\/li>)/g, '<ul>$1</ul>');
    
    // Clean up spacing and empty paragraphs
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');
    formatted = formatted.replace(/&nbsp;/g, ' ');
    formatted = formatted.replace(/\s{2,}/g, ' ');
    
    return formatted;
  }
  
  // Convert markdown bold to HTML (but preserve existing strong tags)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert markdown italic to HTML (but be careful not to affect bullet points)
  formatted = formatted.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Handle headings with underlines (e.g., "TITLE\n----")
  formatted = formatted.replace(/^(.+)\n[-=]{3,}$/gm, '<h3>$1</h3>');
  
  // Handle common heading patterns
  formatted = formatted.replace(/^\*\*([^*]+)\*\*$/gm, '<h3>$1</h3>');
  
  // Split into lines for processing
  const lines = formatted.split('\n');
  const processedLines = [];
  let inList = false;
  let listType = 'ul'; // 'ul' for unordered, 'ol' for ordered
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines but preserve them for paragraph breaks
    if (line.length === 0) {
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
      }
      processedLines.push(''); // Preserve empty line for paragraph separation
      continue;
    }
    
    // Check if this line is a bullet point
    const bulletMatch = line.match(/^[\*\•\-\+]\s+(.+)$/);
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    
         if (bulletMatch || numberedMatch) {
       const content = bulletMatch ? bulletMatch[1] : (numberedMatch ? numberedMatch[1] : '');
       const currentListType = numberedMatch ? 'ol' : 'ul';
      
      // If we're starting a new list or changing list type
      if (!inList) {
        listType = currentListType;
        processedLines.push(`<${listType}>`);
        inList = true;
      } else if (listType !== currentListType) {
        // Close current list and start new one
        processedLines.push(`</${listType}>`);
        listType = currentListType;
        processedLines.push(`<${listType}>`);
      }
      
      processedLines.push(`<li>${content}</li>`);
    } else {
      // Close any open list
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
      }
      
      // Check if this looks like a heading (all caps, ends with colon, etc.)
      if (line.match(/^[A-Z\s]+:$/) && line.length < 50) {
        processedLines.push(`<h4>${line}</h4>`);
      } else if (line.match(/^[A-Z\s]{3,}$/) && line.length < 50) {
        processedLines.push(`<h3>${line}</h3>`);
      } else {
        processedLines.push(line);
      }
    }
  }
  
  // Close any open list
  if (inList) {
    processedLines.push(`</${listType}>`);
  }
  
  // Join lines and create paragraphs
  formatted = processedLines.join('\n');
  
  // Convert double newlines to paragraph breaks, but preserve list structure
  const chunks = formatted.split(/\n\s*\n/);
  const paragraphs = chunks.map(chunk => {
    chunk = chunk.trim();
    if (!chunk) return '';
    
    // Don't wrap lists, headings, or already wrapped content in paragraphs
    if (chunk.match(/^<(ul|ol|h[1-6]|li|strong)/i) || chunk.includes('</')) {
      return chunk;
    }
    
    return `<p>${chunk}</p>`;
  }).filter(p => p.length > 0);
  
  formatted = paragraphs.join('\n\n');
  
  // Clean up any double spacing and empty tags
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  formatted = formatted.replace(/<p>\s*<\/p>/g, '');
  formatted = formatted.replace(/<li>\s*<\/li>/g, '');
  
  // Final cleanup - ensure proper spacing around lists
  formatted = formatted.replace(/(<\/[uo]l>)\n*(<p>)/g, '$1\n\n$2');
  formatted = formatted.replace(/(<\/p>)\n*(<[uo]l>)/g, '$1\n\n$2');
  
  return formatted;
}
