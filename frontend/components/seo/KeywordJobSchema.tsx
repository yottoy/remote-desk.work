import React from 'react';
import { EnhancedJobListing } from '../../types/job';
import { generateJobPostingSchema, JobData } from '../../utils/schemaGenerator';

interface KeywordJobSchemaProps {
  jobs: EnhancedJobListing[];
  keyword: string;
}

/**
 * KeywordJobSchema Component - Generates Google-compliant JobPosting schema for keyword landing pages
 * This component creates schema markup for multiple jobs displayed on category/keyword pages
 */
const KeywordJobSchema: React.FC<KeywordJobSchemaProps> = ({ jobs, keyword }) => {
  if (!jobs || jobs.length === 0) return null;

  // Generate schema for each job using enhanced generator
  const jobSchemas = jobs.map((job) => {
    const jobData: JobData = {
      _id: job._id,
      title: job.title,
      company: job.company,
      location: job.location || 'Remote',
      description: job.descriptionText || job.description || `Remote ${job.title} position at ${job.company}. Work-from-home opportunity in ${keyword}.`,
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

    return generateJobPostingSchema(jobData);
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
