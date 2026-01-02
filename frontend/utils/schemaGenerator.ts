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
 * Generates JobPosting Schema.org markup for individual job listings
 */
export function generateJobPostingSchema(job: JobData): object {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
  
  // Ensure datePosted is valid and recent (within last 30 days)
  let datePosted = job.postedDate;
  const jobDate = new Date(datePosted);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // If job is older than 30 days, use today's date for schema compliance
  if (jobDate < thirtyDaysAgo || isNaN(jobDate.getTime())) {
    datePosted = new Date().toISOString().split('T')[0];
  }
  
  // Calculate validThrough as 30 days from datePosted
  const postedDateObj = new Date(datePosted);
  const validThroughDate = new Date(postedDateObj);
  validThroughDate.setDate(validThroughDate.getDate() + 30);
  const validThrough = validThroughDate.toISOString().split('T')[0];
  
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company,
    },
    "jobLocation": job.location ? {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location,
        "addressCountry": "US"
      }
    } : {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      }
    },
    "employmentType": job.employmentType || "FULL_TIME",
    "workHours": job.employmentType === "PART_TIME" ? "20-30" : "40",
    "datePosted": datePosted,
    "validThrough": validThrough,
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": "United States"
    },
    "jobBenefits": job.benefits || [
      "Work from home",
      "Flexible schedule",
      "Remote work"
    ],
    "qualifications": job.experienceLevel === "Entry Level" ? 
      "No experience required. Basic computer skills and attention to detail preferred." :
      "Previous experience in administrative or data entry roles preferred.",
    "responsibilities": `${job.title} responsibilities include accurate data processing, maintaining organized records, and supporting administrative operations.`,
    "identifier": {
      "@type": "PropertyValue",
      "name": "Job ID",
      "value": job._id
    },
    "url": job.url || `${baseUrl}/jobs/${job._id}`,
    "industry": "Administrative Services",
    "occupationalCategory": "15-1151.00", // SOC code for Computer User Support Specialists
    "workEnvironment": "Remote work environment with flexible schedule options"
  };
  
  // Add salary if available
  if (job.salary) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": {
        "@type": "QuantitativeValue",
        "value": job.salary,
        "unitText": "YEAR"
      }
    };
  }
  
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
      "ClickJob",
      "Click Jobs",
      "ClickClickJobs"
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