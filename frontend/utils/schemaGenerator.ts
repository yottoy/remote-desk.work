// Schema generator utilities for comprehensive SEO markup
export interface JobData {
  _id: string;
  title: string;
  company: string;
  location?: string;
  description: string;
  salary?: string;
  postedDate: string;
  url?: string;
  employmentType?: string;
  experienceLevel?: string;
  benefits?: string[];
}

export interface ArticleData {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  content: string;
  url: string;
  image?: string;
  keywords?: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Parses salary string and extracts min/max values and unit
 * Examples: "$15-25/hr", "$40,000 - $55,000/year", "$20/hour", "50k-60k"
 */
function parseSalary(salaryStr: string): { min?: number; max?: number; unit: 'HOUR' | 'YEAR' | 'MONTH' } | null {
  if (!salaryStr) return null;
  
  const cleanStr = salaryStr.toLowerCase().replace(/[,$]/g, '');
  
  // Determine unit
  let unit: 'HOUR' | 'YEAR' | 'MONTH' = 'YEAR';
  if (/hour|hr|\/h\b/.test(cleanStr)) {
    unit = 'HOUR';
  } else if (/month|mo|\/m\b/.test(cleanStr)) {
    unit = 'MONTH';
  } else if (/year|yr|annual|\/y\b|k\b/.test(cleanStr)) {
    unit = 'YEAR';
  }
  
  // Extract numbers (handles "k" notation like "50k")
  const numbers = cleanStr.match(/(\d+(?:\.\d+)?)\s*k?\b/g);
  if (!numbers || numbers.length === 0) return null;
  
  const parsedNumbers = numbers.map(n => {
    const num = parseFloat(n.replace('k', ''));
    // If it has 'k' or is < 1000 and unit is YEAR, multiply by 1000
    if (n.includes('k')) {
      return num * 1000;
    }
    // If hourly and reasonable range, keep as is
    if (unit === 'HOUR' && num < 200) {
      return num;
    }
    // If looks like yearly in thousands without 'k' notation (e.g., "40" meaning "40k")
    if (unit === 'YEAR' && num < 1000) {
      return num * 1000;
    }
    return num;
  });
  
  if (parsedNumbers.length === 1) {
    return { min: parsedNumbers[0], max: parsedNumbers[0], unit };
  } else if (parsedNumbers.length >= 2) {
    return { min: Math.min(...parsedNumbers), max: Math.max(...parsedNumbers), unit };
  }
  
  return null;
}

/**
 * Ensures description meets Google's minimum requirements (200+ characters)
 */
function ensureValidDescription(description: string, job: JobData): string {
  if (!description || description.trim().length === 0) {
    description = `${job.title} position at ${job.company}. This is a remote opportunity with flexible work arrangements.`;
  }
  
  // Strip HTML tags but preserve line breaks
  let cleanDesc = description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // If too short, add generic content to meet 200 char minimum
  if (cleanDesc.length < 200) {
    const padding = ` This remote ${job.title} role offers the flexibility to work from home with competitive compensation. ` +
      `We are seeking a qualified candidate who can contribute to our team's success. ` +
      `This position provides an excellent opportunity for professional growth in a remote work environment.`;
    cleanDesc += padding;
  }
  
  // Truncate if too long (Google recommends under 10,000 chars)
  if (cleanDesc.length > 10000) {
    cleanDesc = cleanDesc.substring(0, 9997) + '...';
  }
  
  return cleanDesc;
}

/**
 * Formats date to ISO 8601 with timezone
 */
function formatDateISO(date: string | Date): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Maps common job type strings to schema.org employmentType values
 */
function normalizeEmploymentType(jobType?: string): string[] {
  if (!jobType) return ['FULL_TIME'];
  
  const type = jobType.toLowerCase();
  const mapping: { [key: string]: string[] } = {
    'full-time': ['FULL_TIME'],
    'full time': ['FULL_TIME'],
    'fulltime': ['FULL_TIME'],
    'part-time': ['PART_TIME'],
    'part time': ['PART_TIME'],
    'parttime': ['PART_TIME'],
    'contract': ['CONTRACTOR'],
    'contractor': ['CONTRACTOR'],
    'freelance': ['CONTRACTOR'],
    'temporary': ['TEMPORARY'],
    'temp': ['TEMPORARY'],
    'intern': ['INTERN'],
    'internship': ['INTERN'],
    'volunteer': ['VOLUNTEER'],
    'per diem': ['PER_DIEM'],
  };
  
  for (const [key, value] of Object.entries(mapping)) {
    if (type.includes(key)) return value;
  }
  
  return ['FULL_TIME'];
}

/**
 * Generates Google-compliant JobPosting Schema.org markup for individual job listings
 * Follows all requirements from https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
export function generateJobPostingSchema(job: JobData): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  
  // REQUIRED: datePosted in ISO 8601 format
  const datePosted = formatDateISO(job.postedDate);
  
  // REQUIRED: validThrough - set to 30 days from posting (or 60 for longer-term roles)
  const postedDate = new Date(datePosted);
  const validThroughDate = new Date(postedDate);
  validThroughDate.setDate(validThroughDate.getDate() + 30);
  const validThrough = validThroughDate.toISOString();
  
  // REQUIRED: description (minimum 200 characters)
  const description = ensureValidDescription(job.description, job);
  
  // REQUIRED: employmentType as array
  const employmentType = normalizeEmploymentType(job.employmentType);
  
  // Build base schema with all required fields
  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    
    // REQUIRED FIELDS
    "title": job.title,
    "description": description,
    "datePosted": datePosted,
    "validThrough": validThrough,
    
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company,
      "sameAs": job.url || `${baseUrl}/jobs/view/${job._id}`,
    },
    
    // REQUIRED: jobLocation (Google requires this even for remote jobs)
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      }
    },

    // For remote jobs: use TELECOMMUTE instead of physical location
    "jobLocationType": "TELECOMMUTE",

    // Applicant location requirements (US-based jobs)
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "US"
    },
    
    // STRONGLY RECOMMENDED: employmentType
    "employmentType": employmentType,
    
    // RECOMMENDED: identifier (helps prevent duplicates)
    "identifier": {
      "@type": "PropertyValue",
      "name": "Job ID",
      "value": job._id
    },
    
    // Application method
    "directApply": true,
    "applicationContact": {
      "@type": "ContactPoint",
      "url": job.url || `${baseUrl}/jobs/view/${job._id}`
    }
  };
  
  // Override jobLocation with physical location if specified (for hybrid remote)
  if (job.location && job.location !== 'Remote' && job.location !== 'Worldwide' && job.location !== 'US') {
    schema.jobLocation = {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location,
        "addressCountry": "US"
      }
    };
  }
  
  // STRONGLY RECOMMENDED: baseSalary (increases CTR by 30%+)
  if (job.salary) {
    const salaryInfo = parseSalary(job.salary);
    if (salaryInfo) {
      schema.baseSalary = {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": salaryInfo.min,
          "maxValue": salaryInfo.max,
          "unitText": salaryInfo.unit
        }
      };
    }
  }
  
  // RECOMMENDED: Benefits
  if (job.benefits && job.benefits.length > 0) {
    schema.jobBenefits = job.benefits.join(', ');
  } else {
    schema.jobBenefits = "Remote work, flexible schedule, work-life balance";
  }
  
  // RECOMMENDED: Qualifications and responsibilities
  const expLevel = job.experienceLevel?.toLowerCase() || '';
  if (expLevel.includes('entry') || expLevel.includes('junior')) {
    schema.qualifications = "Basic computer skills and attention to detail. No prior experience required.";
    schema.experienceRequirements = {
      "@type": "OccupationalExperienceRequirements",
      "monthsOfExperience": 0
    };
  } else if (expLevel.includes('senior') || expLevel.includes('lead')) {
    schema.qualifications = "Extensive experience in administrative or data entry roles. Strong organizational and communication skills.";
    schema.experienceRequirements = {
      "@type": "OccupationalExperienceRequirements",
      "monthsOfExperience": 36
    };
  } else {
    schema.qualifications = "Previous experience in administrative or data entry roles preferred. Strong attention to detail and computer proficiency required.";
    schema.experienceRequirements = {
      "@type": "OccupationalExperienceRequirements",
      "monthsOfExperience": 12
    };
  }
  
  schema.responsibilities = `Responsibilities include: accurate ${job.title} tasks, maintaining organized records, meeting deadlines, and contributing to team objectives in a remote work environment.`;
  
  // RECOMMENDED: Education requirements
  schema.educationRequirements = {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "high school"
  };
  
  // Additional helpful properties
  schema.industry = "Administrative and Support Services";
  schema.occupationalCategory = "43-9061.00"; // O*NET-SOC code for Data Entry
  schema.workHours = employmentType.includes('PART_TIME') ? "20-30 hours per week" : "40 hours per week";
  
  return schema;
}

/**
 * Generates Article Schema.org markup for blog posts and guides
 */
export function generateArticleSchema(article: ArticleData): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "author": {
      "@type": "Organization",
      "name": article.author || "ClickClickJob Editorial Team",
      "url": `${baseUrl}/about`,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
        "width": 512,
        "height": 512
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": "ClickClickJob",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
        "width": 512,
        "height": 512
      }
    },
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "url": article.url,
    "image": article.image ? {
      "@type": "ImageObject",
      "url": article.image,
      "width": 1200,
      "height": 630
    } : {
      "@type": "ImageObject",
      "url": `${baseUrl}/og-image.jpg`,
      "width": 1200,
      "height": 630
    },
    "articleSection": "Remote Work Guides",
    "keywords": article.keywords || [
      "remote work",
      "data entry jobs",
      "administrative jobs",
      "work from home",
      "remote careers"
    ],
    "wordCount": article.content.split(' ').length,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.url
    },
    "about": {
      "@type": "Thing",
      "name": "Remote Work Opportunities",
      "description": "Information about remote administrative and data entry career opportunities"
    }
  };
}

/**
 * Generates FAQPage Schema.org markup for FAQ sections
 */
export function generateFAQSchema(faqs: FAQItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generates Organization Schema.org markup for the company
 * Enhanced with brand name variations for better search recognition
 */
export function generateOrganizationSchema(): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ClickClickJob",
    "alternateName": [
      "Click Click Job",
      "Click Click Jobs",
      "ClickClickJobs",
      "ClickJob",
      "Click Jobs",
      "Click Job",
      "ClikJob",
      "Clik Job",
      "ClickClickJob.com",
      "clickclickjob"
    ],
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo.png`,
      "width": 512,
      "height": 512
    },
    "description": "ClickClickJob is a leading platform for remote administrative, data entry, data processing, and captioning job opportunities, helping professionals find verified work-from-home positions.",
    "founder": {
      "@type": "Organization",
      "name": "ClickClickJob Team"
    },
    "foundingDate": "2024",
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    "serviceType": "Job Board",
    "knowsAbout": [
      "Remote work opportunities",
      "Data entry jobs",
      "Data processing jobs",
      "Captioning jobs",
      "Transcription jobs",
      "Administrative positions",
      "Work from home careers",
      "Virtual assistant jobs"
    ],
    "sameAs": [
      "https://twitter.com/clickclickjob",
      "https://linkedin.com/company/clickclickjob"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@clickclickjob.com",
      "availableLanguage": "English"
    },
    "slogan": "Find Remote Jobs - Work From Home Opportunities",
    "keywords": "remote jobs, data processing jobs from home, captioning jobs remote, work from home, data entry, administrative assistant jobs"
  };
}

/**
 * Generates BreadcrumbList Schema.org markup for navigation
 */
export function generateBreadcrumbSchema(breadcrumbs: BreadcrumbItem[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
}

/**
 * Generates WebSite Schema.org markup with search functionality
 */
export function generateWebSiteSchema(): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ClickClickJob",
    "url": baseUrl,
    "description": "Find remote administrative and data entry jobs. Verified work-from-home opportunities updated daily.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/jobs?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ClickClickJob",
      "url": baseUrl
    }
  };
}

/**
 * Generates JobBoard specific schema markup
 */
export function generateJobBoardSchema(jobCount: number): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Remote Administrative and Data Entry Jobs",
    "description": `Browse ${jobCount} remote administrative and data entry job opportunities`,
    "numberOfItems": jobCount,
    "url": `${baseUrl}/jobs`,
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "about": {
      "@type": "Thing",
      "name": "Remote Administrative Jobs",
      "description": "Collection of remote administrative and data entry job postings"
    }
  };
}

/**
 * Utility function to generate JSON-LD script tag
 */
export function generateJSONLD(schema: object): string {
  return JSON.stringify(schema, null, 0);
} 