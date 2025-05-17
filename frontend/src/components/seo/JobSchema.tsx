import React from 'react';
import { EnhancedJobListing } from '../../types/job';

interface JobSchemaProps {
  job: EnhancedJobListing;
}

const JobSchema: React.FC<JobSchemaProps> = ({ job }) => {
  // Only render if we have a job
  if (!job) return null;

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
    title: job.title,
    description: job.descriptionText || job.description,
    datePosted: job.postedDate ? new Date(job.postedDate).toISOString() : undefined,
    validThrough: job.expiresAt ? new Date(job.expiresAt).toISOString() : undefined,
    employmentType: job.jobType || 'REMOTE',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company
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