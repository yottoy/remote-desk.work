import React from 'react';
import { EnhancedJobListing } from '../../types/job';

interface JobSchemaProps {
  job: EnhancedJobListing;
}

const JobSchema: React.FC<JobSchemaProps> = ({ job }) => {
  // Only render if we have a job
  if (!job) return null;

  // Ensure description exists for SEO compliance
  let description = job.descriptionText || job.description;
  
  // If no description available, generate a basic one for SEO compliance
  if (!description || description.trim() === '') {
    const title = job.title || 'Remote Position';
    const company = job.company || 'Company';
    const location = job.location || 'Remote';
    
    description = `${title} at ${company}. This is a remote position based in ${location}. ` +
      `We are seeking a qualified candidate for this remote administrative/data entry role. ` +
      `This position offers the flexibility of working from home with competitive compensation. ` +
      `Apply now to join our team in this remote opportunity.`;
  }

  // Format salary if available
  let salary = null;
  if (job.salary) {
    salary = {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        value: job.salary,
        unitText: 'HOUR'
      }
    };
  }

  // Create the JobPosting schema data
  const jobData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title || 'Remote Position',
    description: description, // Ensure this is always present
    datePosted: job.postedDate ? new Date(job.postedDate).toISOString() : undefined,
    validThrough: job.expiresAt ? new Date(job.expiresAt).toISOString() : undefined,
    employmentType: job.jobType || 'REMOTE',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company || 'Remote Company'
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'Remote'
      }
    },
    jobLocationType: 'TELECOMMUTE',
    baseSalary: salary
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jobData) }}
    />
  );
};

export default JobSchema; 