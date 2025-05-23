export interface KeywordPageData {
  slug: string;
  title: string;
  h1: string;
  description: string;
  valueProposition: string;
  faqItems: FAQItem[];
  jobFilters: JobFilters;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface JobFilters {
  experienceLevel?: 'no-experience' | 'entry-level' | 'mid-level' | 'senior';
  jobType?: 'full-time' | 'part-time' | 'freelance' | 'contract';
  category?: 'admin' | 'data-entry' | 'virtual-assistant' | 'executive-assistant';
  specialization?: 'medical' | 'legal' | 'bookkeeping' | 'customer-service';
  timezoneCompatible?: boolean;
  salaryRange?: {
    min: number;
    max: number;
    currency: 'USD' | 'EUR' | 'GBP';
  };
}

export interface SchemaJobPosting {
  '@context': string;
  '@type': string;
  title: string;
  description: string;
  datePosted: string;
  employmentType: string[] | string;
  jobLocation: {
    '@type': string;
    address: {
      '@type': string;
      addressLocality: string;
      addressRegion: string;
      addressCountry: string;
    }
  };
  applicantLocationRequirements: {
    '@type': string;
    name: string;
  };
  experienceRequirements: string;
  hiringOrganization: {
    '@type': string;
    name: string;
  };
  baseSalary?: {
    '@type': string;
    currency: string;
    value: {
      '@type': string;
      minValue?: number;
      maxValue?: number;
      value?: number;
      unitText: string;
    }
  };
}
