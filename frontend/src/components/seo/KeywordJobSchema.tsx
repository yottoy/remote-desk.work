import React from 'react';
import { SchemaJobPosting } from '../../types/seo';
import { EnhancedJobListing } from '../../types/job';

interface KeywordJobSchemaProps {
  jobs: EnhancedJobListing[];
  keyword: string;
}

const KeywordJobSchema: React.FC<KeywordJobSchemaProps> = ({ jobs, keyword }) => {
  if (!jobs || jobs.length === 0) return null;

  // Create schema markup for each job
  const jobSchemas: SchemaJobPosting[] = jobs.map(job => {
    // Format salary if available
    let salary = null;
    if (job.salary) {
      const salaryValue = typeof job.salary === 'string' 
        ? parseInt(job.salary.replace(/[^0-9.]/g, ''), 10) 
        : job.salary;
      
      if (!isNaN(salaryValue)) {
        salary = {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: {
            '@type': 'QuantitativeValue',
            value: salaryValue,
            unitText: 'HOUR'
          }
        };
      }
    }

    // Determine employment type
    let employmentType: string[] = [];
    if (job.jobType) {
      if (job.jobType.toLowerCase().includes('full')) employmentType.push('FULL_TIME');
      if (job.jobType.toLowerCase().includes('part')) employmentType.push('PART_TIME');
      if (job.jobType.toLowerCase().includes('contract')) employmentType.push('CONTRACTOR');
      if (job.jobType.toLowerCase().includes('freelance')) employmentType.push('CONTRACTOR');
    }
    
    if (employmentType.length === 0) employmentType.push('FULL_TIME'); // Default

    // Create the JobPosting schema data
    const jobData: SchemaJobPosting = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: `${job.title} - Remote ${job.category || 'Admin/Data Entry'}`,
      description: job.descriptionText || job.description || `Remote ${job.title} position at ${job.company}. This is a work-from-anywhere opportunity related to ${keyword}.`,
      datePosted: job.postedDate ? new Date(job.postedDate).toISOString() : new Date().toISOString(),
      employmentType,
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Remote',
          addressRegion: 'Global',
          addressCountry: 'Worldwide'
        }
      },
      applicantLocationRequirements: {
        '@type': 'Country',
        name: 'Worldwide'
      },
      experienceRequirements: job.experienceLevel || 'No experience required',
      hiringOrganization: {
        '@type': 'Organization',
        name: job.company
      }
    };

    // Add salary if available
    if (salary) {
      jobData.baseSalary = salary;
    }

    return jobData;
  });

  return (
    <>
      {jobSchemas.map((schema, index) => (
        <script
          key={`job-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
};

export default KeywordJobSchema;
