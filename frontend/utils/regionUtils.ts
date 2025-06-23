/**
 * Utility functions for handling regional variations in job titles, terminology, and formatting
 */

type RegionCode = 'US' | 'UK' | 'CA' | 'AU' | 'EU' | 'OTHER';

interface RegionalJobTitleVariation {
  US: string;
  UK: string;
  CA: string;
  AU: string;
  EU: string;
  OTHER: string;
}

// Common job title variations by region
const JOB_TITLE_VARIATIONS: Record<string, Partial<RegionalJobTitleVariation>> = {
  'Data Entry Specialist': {
    US: 'Data Entry Specialist',
    UK: 'Data Entry Clerk',
    CA: 'Data Entry Specialist',
    AU: 'Data Entry Officer',
    EU: 'Data Entry Administrator',
    OTHER: 'Data Entry Specialist'
  },
  'Administrative Assistant': {
    US: 'Administrative Assistant',
    UK: 'Administrative Officer',
    CA: 'Administrative Assistant',
    AU: 'Administration Officer',
    EU: 'Administrative Coordinator',
    OTHER: 'Administrative Assistant'
  },
  'Virtual Assistant': {
    US: 'Virtual Assistant',
    UK: 'Virtual PA',
    CA: 'Virtual Assistant',
    AU: 'Virtual Assistant',
    EU: 'Remote Assistant',
    OTHER: 'Virtual Assistant'
  },
  'Executive Assistant': {
    US: 'Executive Assistant',
    UK: 'Executive PA',
    CA: 'Executive Assistant',
    AU: 'Executive Support Officer',
    EU: 'Executive Secretary',
    OTHER: 'Executive Assistant'
  }
};

/**
 * Detect user's region based on browser language
 * @returns The detected region code
 */
export const detectUserRegion = (): RegionCode => {
  try {
    const language = navigator.language;
    
    if (language.includes('en-US')) return 'US';
    if (language.includes('en-GB')) return 'UK';
    if (language.includes('en-CA')) return 'CA';
    if (language.includes('en-AU')) return 'AU';
    
    // Check for European languages
    const euLanguages = ['de', 'fr', 'es', 'it', 'nl', 'pt', 'sv', 'da', 'fi', 'pl'];
    if (euLanguages.some(lang => language.startsWith(lang))) return 'EU';
    
    return 'OTHER';
  } catch (error) {
    console.error('Error detecting user region:', error);
    return 'US'; // Default to US
  }
};

/**
 * Get the regional variation of a job title based on user's region
 * @param baseTitle The base job title in US English
 * @param region The region code (defaults to detected region)
 * @returns The regionalized job title
 */
export const getRegionalJobTitle = (baseTitle: string, region?: RegionCode): string => {
  const userRegion = region || detectUserRegion();
  
  // Check if we have variations for this title
  const variations = JOB_TITLE_VARIATIONS[baseTitle];
  if (!variations) return baseTitle;
  
  // Return the regional variation or fallback to base title
  return variations[userRegion] || baseTitle;
};

/**
 * Format a salary range according to regional conventions
 * @param min Minimum salary
 * @param max Maximum salary
 * @param currency Currency code
 * @param period Pay period
 * @param region Region code
 * @returns Formatted salary string
 */
export const formatRegionalSalary = (
  min: number,
  max: number,
  currency: string = 'USD',
  period: 'hour' | 'day' | 'week' | 'month' | 'year' = 'hour',
  region?: RegionCode
): string => {
  const userRegion = region || detectUserRegion();
  
  // Format based on currency and user region
  try {
    const formatter = new Intl.NumberFormat(
      userRegion === 'US' ? 'en-US' : 
      userRegion === 'UK' ? 'en-GB' :
      userRegion === 'CA' ? 'en-CA' :
      userRegion === 'AU' ? 'en-AU' :
      userRegion === 'EU' ? 'de-DE' : 'en-US', 
      {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    );
    
    const formattedMin = formatter.format(min);
    const formattedMax = formatter.format(max);
    
    // Period abbreviation based on region
    let periodSuffix = '';
    if (period === 'hour') {
      periodSuffix = userRegion === 'UK' ? '/hr' : '/hr';
    } else if (period === 'year') {
      periodSuffix = userRegion === 'UK' ? '/pa' : '/yr';
    } else {
      periodSuffix = `/${period}`;
    }
    
    return `${formattedMin} - ${formattedMax}${periodSuffix}`;
  } catch (error) {
    console.error('Error formatting regional salary:', error);
    // Fallback to basic formatting
    return `${currency} ${min} - ${max}/${period}`;
  }
};

/**
 * Get regional term for common job-related terminology
 * @param term The term to regionalize
 * @param region The region code
 * @returns The regionalized term
 */
export const getRegionalTerm = (
  term: 'resume' | 'cover letter' | 'application' | 'interview',
  region?: RegionCode
): string => {
  const userRegion = region || detectUserRegion();
  
  const termMap: Record<string, Record<RegionCode, string>> = {
    'resume': {
      'US': 'resume',
      'UK': 'CV',
      'CA': 'resume',
      'AU': 'resume',
      'EU': 'CV',
      'OTHER': 'resume/CV'
    },
    'cover letter': {
      'US': 'cover letter',
      'UK': 'covering letter',
      'CA': 'cover letter',
      'AU': 'cover letter',
      'EU': 'motivation letter',
      'OTHER': 'cover letter'
    },
    'application': {
      'US': 'application',
      'UK': 'application',
      'CA': 'application',
      'AU': 'application',
      'EU': 'application',
      'OTHER': 'application'
    },
    'interview': {
      'US': 'interview',
      'UK': 'interview',
      'CA': 'interview',
      'AU': 'interview',
      'EU': 'interview',
      'OTHER': 'interview'
    }
  };
  
  return termMap[term]?.[userRegion] || term;
};
