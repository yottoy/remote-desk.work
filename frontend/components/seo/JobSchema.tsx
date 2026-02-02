import React from 'react';
import { EnhancedJobListing } from '../../types/job';
import { generateJobPostingSchema, JobData } from '../../utils/schemaGenerator';

interface JobSchemaProps {
  job: EnhancedJobListing;
}

/**
 * JobSchema Component - Generates Google-compliant JobPosting structured data
 * This component adds JSON-LD schema markup to job listing pages for Google for Jobs
 */
const JobSchema: React.FC<JobSchemaProps> = ({ job }) => {
  // Only render if we have a job
  if (!job) return null;

  // Prepare job data for schema generator
  const jobData: JobData = {
    _id: job._id,
    title: job.title,
    company: job.company,
    location: job.location || 'Remote',
    description: job.descriptionText || job.description || '',
    salary: job.salary,
    postedDate: typeof job.postedDate === 'string' 
      ? job.postedDate 
      : job.postedDate 
        ? new Date(job.postedDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    url: job.url,
    employmentType: job.jobType,
    experienceLevel: job.experienceLevel,
    benefits: ['Remote work', 'Flexible schedule', 'Work-life balance']
  };

  // Generate Google-compliant schema markup
  const schema = generateJobPostingSchema(jobData);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default JobSchema; 