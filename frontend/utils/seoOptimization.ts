// SEO Optimization utilities for ClickClickJob.com - Remote Jobs Website
import { Job, EnhancedJobListing } from '../types/job';

/**
 * Enhanced JobPosting Schema for Remote Jobs
 * Includes all Google-recommended fields for better rich results performance
 */
export interface EnhancedJobPostingSchema {
  '@context': string;
  '@type': string;
  title: string;
  description: string;
  hiringOrganization: {
    '@type': string;
    name: string;
    sameAs?: string[];
    logo?: {
      '@type': string;
      url: string;
    };
  };
  jobLocation: {
    '@type': string;
    address: {
      '@type': string;
      addressLocality?: string;
      addressRegion?: string;
      addressCountry: string;
    };
  };
  employmentType: string[];
  workHours?: string;
  datePosted: string;
  validThrough: string;
  applicantLocationRequirements: {
    '@type': string;
    name: string;
  };
  jobBenefits: string[];
  qualifications: string;
  responsibilities: string;
  skills: string[];
  identifier: {
    '@type': string;
    name: string;
    value: string;
  };
  url: string;
  industry: string;
  occupationalCategory: string;
  workEnvironment: string;
  baseSalary?: {
    '@type': string;
    currency: string;
    value: {
      '@type': string;
      minValue?: number;
      maxValue?: number;
      unitText: string;
    };
  };
  experienceRequirements?: string;
  educationRequirements?: string;
  jobImmediateStart?: boolean;
  jobFlexibleHours?: boolean;
}

/**
 * Enhanced Meta Title Templates for High-CTR Remote Jobs
 * Optimized for keywords like "remote data processing jobs", "captioning jobs", etc.
 */
export class RemoteJobMetaTemplates {
  private static readonly SITE_NAME = 'ClickClickJob';
  private static readonly MAX_TITLE_LENGTH = 60;
  private static readonly MAX_DESCRIPTION_LENGTH = 155;

  /**
   * Generate optimized meta title for job listings
   */
  static generateJobTitle(job: Job | EnhancedJobListing): string {
    const { title, company, location } = job;
    
    // For remote jobs, emphasize "Remote" keyword
    const remotePrefix = title.toLowerCase().includes('remote') ? '' : 'Remote ';
    const baseTitle = `${remotePrefix}${title}`;
    
    // Priority templates based on high-performing keywords
    const templates = [
      `${baseTitle} | ${company} | Work From Home`,
      `${baseTitle} at ${company} | Remote Work`,
      `${baseTitle} | ${company} | 100% Remote`,
      `${baseTitle} | Remote Job | ${company}`,
      `${baseTitle} | Work From Home | ${this.SITE_NAME}`
    ];

    // Select template that fits within character limit
    for (const template of templates) {
      if (template.length <= this.MAX_TITLE_LENGTH) {
        return template;
      }
    }

    // Fallback: truncate and add ellipsis
    const fallback = `${baseTitle} | ${company} | Remote`;
    return fallback.length > this.MAX_TITLE_LENGTH 
      ? `${fallback.substring(0, this.MAX_TITLE_LENGTH - 3)}...`
      : fallback;
  }

  /**
   * Generate optimized meta description for job listings
   */
  static generateJobDescription(job: Job | EnhancedJobListing): string {
    const { title, company, location } = job;
    const salary = (job as any).salary || (job as any).payRange;
    const experienceLevel = (job as any).experienceLevel;
    
    // High-converting description templates
    const templates = [
      `Apply for this ${experienceLevel ? experienceLevel.toLowerCase() + ' ' : ''}remote ${title.toLowerCase()} position at ${company}. ${salary ? `$${salary} - ` : ''}100% work from home. No commute required. Apply today!`,
      `Remote ${title} at ${company}${salary ? ` | $${salary}` : ''}. Work from anywhere with flexible schedule. ${experienceLevel === 'Entry Level' ? 'No experience required. ' : ''}Apply now for this verified remote job.`,
      `${company} is hiring a remote ${title.toLowerCase()}${salary ? ` ($${salary})` : ''}. Full-time work from home opportunity. ${experienceLevel === 'Entry Level' ? 'Perfect for beginners. ' : ''}Apply today!`
    ];

    // Select template that fits within character limit
    for (const template of templates) {
      if (template.length <= this.MAX_DESCRIPTION_LENGTH) {
        return template;
      }
    }

    // Fallback: basic description
    const fallback = `Remote ${title} at ${company}. Work from home opportunity. Apply now!`;
    return fallback.length > this.MAX_DESCRIPTION_LENGTH 
      ? `${fallback.substring(0, this.MAX_DESCRIPTION_LENGTH - 3)}...`
      : fallback;
  }

  /**
   * Generate optimized meta title for category pages
   * Enhanced with high-CTR elements: numbers, urgency, benefits
   */
  static generateCategoryTitle(categoryName: string, jobCount: number): string {
    const cleanCategory = categoryName.replace(/jobs?$/i, '').trim();
    
    // Special high-CTR templates for priority categories
    if (cleanCategory.toLowerCase().includes('captioning')) {
      return `${jobCount}+ Remote Captioning Jobs - No Experience Needed | Apply Now`;
    }
    if (cleanCategory.toLowerCase().includes('data processing')) {
      return `${jobCount}+ Data Processing Jobs From Home | Entry Level Welcome`;
    }
    
    const templates = [
      `${jobCount}+ Remote ${cleanCategory} Jobs - Work From Home | Apply Today`,
      `${jobCount}+ ${cleanCategory} Jobs | No Experience Required | ${this.SITE_NAME}`,
      `Remote ${cleanCategory} Jobs | ${jobCount}+ Hiring Now | Apply Today`,
      `${jobCount}+ Work From Home ${cleanCategory} Jobs | Updated Daily`
    ];

    for (const template of templates) {
      if (template.length <= this.MAX_TITLE_LENGTH) {
        return template;
      }
    }

    return `${jobCount}+ Remote ${cleanCategory} Jobs | ${this.SITE_NAME}`;
  }

  /**
   * Generate optimized meta description for category pages
   * Enhanced with CTR-boosting elements: benefits, urgency, specificity
   */
  static generateCategoryDescription(categoryName: string, jobCount: number): string {
    const cleanCategory = categoryName.replace(/jobs?$/i, '').trim().toLowerCase();
    
    // Special high-CTR descriptions for priority categories
    if (cleanCategory.includes('captioning')) {
      return `${jobCount}+ remote captioning jobs. No experience required for entry positions. Updated daily. $15-30/hr. Apply now to verified employers!`;
    }
    if (cleanCategory.includes('data processing')) {
      return `${jobCount}+ data processing jobs from home. Entry-level to experienced. $16-28/hr. Work remotely from anywhere. Apply to verified positions today!`;
    }
    
    const templates = [
      `${jobCount}+ verified remote ${cleanCategory} jobs. Work from home, flexible schedules. Entry-level welcome. Apply now!`,
      `Find ${jobCount}+ remote ${cleanCategory} positions. Updated daily. Competitive pay. No commute. Apply to verified jobs today!`,
      `${jobCount}+ remote ${cleanCategory} jobs hiring now. Work from anywhere. Entry to senior level. Apply today!`
    ];

    for (const template of templates) {
      if (template.length <= this.MAX_DESCRIPTION_LENGTH) {
        return template;
      }
    }

    return `${jobCount}+ remote ${cleanCategory} jobs. Work from home. Apply now!`;
  }
}

/**
 * SEO-Friendly URL Generator for Remote Jobs
 * Converts /jobs/[id] to /jobs/[job-title-location-company]
 */
export class RemoteJobURLGenerator {
  /**
   * Generate SEO-friendly URL slug for job listings
   */
  static generateJobSlug(job: Job | EnhancedJobListing): string {
    const { title, company, location } = job;
    
    // Clean and format components
    const cleanTitle = this.cleanForURL(title);
    const cleanCompany = this.cleanForURL(company);
    const cleanLocation = location ? this.cleanForURL(location) : 'remote';
    
    // Create slug: job-title-location-company
    const slug = `${cleanTitle}-${cleanLocation}-${cleanCompany}`;
    
    // Ensure slug is not too long (max 100 characters for SEO)
    return slug.length > 100 ? slug.substring(0, 97) + '...' : slug;
  }

  /**
   * Generate SEO-friendly URL for category pages
   */
  static generateCategorySlug(categoryName: string): string {
    return categoryName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Clean string for URL use
   */
  private static cleanForURL(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
}

/**
 * Enhanced Schema Generator for Remote Jobs
 * Includes all Google-recommended fields for better rich results
 */
export class RemoteJobSchemaGenerator {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';

  /**
   * Generate comprehensive JobPosting schema for remote jobs
   */
  static generateJobPostingSchema(job: Job | EnhancedJobListing): EnhancedJobPostingSchema {
    const jobSlug = RemoteJobURLGenerator.generateJobSlug(job);
    const salary = (job as any).salary || (job as any).payRange;
    const salaryRange = this.parseSalaryRange(salary);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: this.generateRichDescription(job),
      hiringOrganization: {
        '@type': 'Organization',
        name: job.company,
        sameAs: job.company.toLowerCase().includes('inc') || job.company.toLowerCase().includes('corp') 
          ? [`https://www.linkedin.com/company/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}`]
          : undefined,
        logo: {
          '@type': 'ImageObject',
          url: `${this.BASE_URL}/images/company-logos/${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.png`
        }
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.location && job.location !== 'Remote' ? job.location : undefined,
          addressRegion: job.location && job.location !== 'Remote' ? this.extractState(job.location) : undefined,
          addressCountry: 'US'
        }
      },
      employmentType: this.determineEmploymentTypes(job),
      workHours: (job as any).jobType?.toLowerCase().includes('part') ? '20-30' : '40',
      datePosted: job.postedDate ? new Date(job.postedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      validThrough: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'United States'
      },
      jobBenefits: [
        'Work from home',
        'Remote work',
        'Flexible schedule',
        'No commute',
        'Work-life balance',
        ...((job as any).benefits || [])
      ],
      qualifications: this.generateQualifications(job),
      responsibilities: this.generateResponsibilities(job),
      skills: (job as any).skills || this.generateSkills(job),
      identifier: {
        '@type': 'PropertyValue',
        name: 'Job ID',
        value: job._id
      },
      url: `${this.BASE_URL}/jobs/${jobSlug}`,
      industry: 'Remote Work Services',
      occupationalCategory: this.determineOccupationalCategory(job),
      workEnvironment: 'Remote work environment - work from home with flexible scheduling options',
      baseSalary: salaryRange ? {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: {
          '@type': 'QuantitativeValue',
          minValue: salaryRange.min,
          maxValue: salaryRange.max,
          unitText: salaryRange.unit
        }
      } : undefined,
      experienceRequirements: (job as any).experienceLevel || 'Entry level to experienced candidates welcome',
      educationRequirements: 'High school diploma or equivalent. Some positions may require specialized training.',
      jobImmediateStart: true,
      jobFlexibleHours: true
    };
  }

  /**
   * Generate rich job description for schema
   */
  private static generateRichDescription(job: Job | EnhancedJobListing): string {
    const baseDescription = job.description || `Join ${job.company} as a ${job.title} in a 100% remote position.`;
    const experienceLevel = (job as any).experienceLevel;
    const salary = (job as any).salary || (job as any).payRange;
    
    const remoteWorkBenefits = `
This is a full-time remote position offering the flexibility to work from anywhere in the United States. 
You'll enjoy the benefits of working from home including no commute, flexible scheduling, and better work-life balance.
${experienceLevel === 'Entry Level' ? 'This position is perfect for entry-level candidates looking to start their remote career.' : ''}
${salary ? `Competitive compensation of ${salary} offered.` : ''}
`;

    return baseDescription + remoteWorkBenefits;
  }

  /**
   * Determine employment types for schema
   */
  private static determineEmploymentTypes(job: Job | EnhancedJobListing): string[] {
    const types = ['FULL_TIME'];
    const jobType = (job as any).jobType;
    
    if (jobType?.toLowerCase().includes('part')) {
      types.push('PART_TIME');
    }
    if (jobType?.toLowerCase().includes('contract')) {
      types.push('CONTRACTOR');
    }
    if (jobType?.toLowerCase().includes('temp')) {
      types.push('TEMPORARY');
    }
    
    return types;
  }

  /**
   * Generate qualifications based on job details
   */
  private static generateQualifications(job: Job | EnhancedJobListing): string {
    const baseQualifications = [
      'Reliable high-speed internet connection',
      'Dedicated workspace at home',
      'Strong attention to detail',
      'Excellent communication skills',
      'Ability to work independently'
    ];

    const experienceLevel = (job as any).experienceLevel;
    if (experienceLevel === 'Entry Level') {
      baseQualifications.unshift('No previous experience required');
    } else {
      baseQualifications.unshift(`Previous experience in ${job.title.toLowerCase()} or related field preferred`);
    }

    return baseQualifications.join(', ');
  }

  /**
   * Generate responsibilities based on job title
   */
  private static generateResponsibilities(job: Job | EnhancedJobListing): string {
    const title = job.title.toLowerCase();
    
    if (title.includes('data entry')) {
      return 'Accurately input data into company systems, maintain organized records, verify information accuracy, meet daily productivity targets, communicate with team members via remote collaboration tools.';
    } else if (title.includes('customer service')) {
      return 'Respond to customer inquiries via phone, email, or chat, resolve customer issues professionally, maintain customer records, follow up on customer requests, collaborate with team members remotely.';
    } else if (title.includes('administrative')) {
      return 'Provide administrative support to team members, manage schedules and appointments, organize digital files and documents, assist with project coordination, maintain communication with remote team.';
    } else if (title.includes('virtual assistant')) {
      return 'Provide comprehensive administrative support, manage email and calendar, conduct research, assist with project management, maintain organized systems, communicate effectively with remote team.';
    }
    
    return `Perform ${job.title.toLowerCase()} duties remotely, collaborate with team members via digital platforms, maintain high standards of work quality, meet project deadlines, participate in virtual team meetings.`;
  }

  /**
   * Generate skills based on job type
   */
  private static generateSkills(job: Job | EnhancedJobListing): string[] {
    const title = job.title.toLowerCase();
    const baseSkills = ['Remote work', 'Time management', 'Communication', 'Computer literacy'];
    
    if (title.includes('data entry')) {
      baseSkills.push('Data entry', 'Microsoft Excel', 'Attention to detail', 'Typing speed');
    } else if (title.includes('customer service')) {
      baseSkills.push('Customer service', 'Problem solving', 'Phone etiquette', 'CRM software');
    } else if (title.includes('administrative')) {
      baseSkills.push('Administrative support', 'Microsoft Office', 'Organization', 'Scheduling');
    } else if (title.includes('virtual assistant')) {
      baseSkills.push('Virtual assistance', 'Project management', 'Research', 'Multi-tasking');
    }
    
    return baseSkills;
  }

  /**
   * Parse salary range from salary string
   */
  private static parseSalaryRange(salary?: string): { min: number; max: number; unit: string } | null {
    if (!salary) return null;
    
    const hourlyMatch = salary.match(/\$(\d+)-(\d+)\/hr/);
    if (hourlyMatch) {
      return {
        min: parseInt(hourlyMatch[1]),
        max: parseInt(hourlyMatch[2]),
        unit: 'HOUR'
      };
    }
    
    const yearlyMatch = salary.match(/\$(\d+)k?-(\d+)k?/);
    if (yearlyMatch) {
      return {
        min: parseInt(yearlyMatch[1]) * (yearlyMatch[1].includes('k') ? 1000 : 1),
        max: parseInt(yearlyMatch[2]) * (yearlyMatch[2].includes('k') ? 1000 : 1),
        unit: 'YEAR'
      };
    }
    
    return null;
  }

  /**
   * Extract state from location string
   */
  private static extractState(location: string): string | undefined {
    const stateMatch = location.match(/,\s*([A-Z]{2})\s*$/);
    return stateMatch ? stateMatch[1] : undefined;
  }

  /**
   * Determine occupational category based on job
   */
  private static determineOccupationalCategory(job: Job | EnhancedJobListing): string {
    const title = job.title.toLowerCase();
    
    if (title.includes('data entry')) {
      return '43-9021.00'; // Data Entry Keyers
    } else if (title.includes('customer service')) {
      return '43-4051.00'; // Customer Service Representatives
    } else if (title.includes('administrative')) {
      return '43-6014.00'; // Administrative Support
    } else if (title.includes('virtual assistant')) {
      return '43-6014.00'; // Administrative Support
    }
    
    return '43-9199.00'; // Office and Administrative Support Workers
  }
}

/**
 * High-Volume Keyword Optimizer for Remote Jobs
 * Targets keywords like "remote data processing jobs", "captioning jobs", etc.
 */
export class RemoteJobKeywordOptimizer {
  private static readonly HIGH_VOLUME_KEYWORDS = [
    'remote data processing jobs',
    'captioning jobs',
    'remote data entry jobs no experience',
    'work from home data entry',
    'remote administrative jobs',
    'virtual assistant jobs',
    'remote customer service jobs',
    'work from home jobs no experience',
    'remote transcription jobs',
    'online data entry jobs'
  ];

  /**
   * Optimize content for high-volume remote job keywords
   */
  static optimizeForKeywords(content: string, targetKeywords: string[]): string {
    let optimizedContent = content;
    
    // Add natural keyword variations
    targetKeywords.forEach(keyword => {
      if (keyword.includes('remote') && !optimizedContent.includes(keyword)) {
        optimizedContent += ` This ${keyword.replace('remote ', '')} opportunity offers the flexibility of remote work.`;
      }
    });
    
    return optimizedContent;
  }

  /**
   * Generate keyword-rich alt text for images
   */
  static generateImageAltText(imagePurpose: string, jobTitle?: string): string {
    const baseAlt = `${imagePurpose} for remote jobs`;
    
    if (jobTitle) {
      return `${imagePurpose} for ${jobTitle.toLowerCase()} - remote work from home opportunity`;
    }
    
    return `${baseAlt} - work from home opportunities at ClickClickJob`;
  }
}

/**
 * Mobile-First SEO Optimizer
 * Since 64% of traffic is mobile with better performance
 */
export class MobileFirstSEOOptimizer {
  /**
   * Optimize meta tags for mobile search
   */
  static optimizeForMobile(title: string, description: string): { title: string; description: string } {
    // Mobile titles should be shorter and more direct
    const mobileTitle = title.length > 50 ? 
      title.substring(0, 47) + '...' : 
      title;
    
    // Mobile descriptions should be more action-oriented
    const mobileDescription = description.includes('Apply now') ? 
      description : 
      description.replace(/\.$/, ' Apply now!');
    
    return { title: mobileTitle, description: mobileDescription };
  }

  /**
   * Generate mobile-optimized structured data
   */
  static addMobileOptimizations(schema: any): any {
    return {
      ...schema,
      // Add mobile-specific properties
      jobLocationType: 'TELECOMMUTE',
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'United States'
      },
      // Emphasize mobile-friendly application process
      applicationContact: {
        '@type': 'ContactPoint',
        contactType: 'HR',
        availableLanguage: 'English'
      }
    };
  }
} 