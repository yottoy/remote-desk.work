import React from 'react';
import { JobListing, EnhancedJobListing } from '../../types/job';

type AnyJobListing = JobListing | EnhancedJobListing;

interface TrustIndicatorProps {
  children: React.ReactNode;
  className?: string;
  title: string;
  icon: React.ReactNode;
}

const TrustIndicator: React.FC<TrustIndicatorProps> = ({ 
  children, 
  className = '',
  title,
  icon
}) => {
  return (
    <div className={`rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="mt-2 text-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CompanyVerification: React.FC<{ job: AnyJobListing }> = ({ job }) => {
  // Determine verification status based on the job's quality score
  const isVerified = job.qualityScore >= 8;

  return (
    <TrustIndicator
      className={isVerified ? "bg-green-50" : "bg-yellow-50"}
      title={isVerified ? "Verified Company" : "Company Verification"}
      icon={
        isVerified ? (
          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      }
    >
      {isVerified ? (
        <p>This company has been verified by our team. The company has a strong online presence and positive reviews.</p>
      ) : (
        <p>This company has not been fully verified. Research the company before submitting personal information.</p>
      )}
    </TrustIndicator>
  );
};

export const RedFlagWarning: React.FC<{ job: AnyJobListing }> = ({ job }) => {
  // Check for potential red flags in the job
  const hasRedFlags = job.qualityScore < 6;
  
  if (!hasRedFlags) return null;
  
  return (
    <TrustIndicator
      className="bg-red-50"
      title="Potential Red Flags Detected"
      icon={
        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      }
    >
      <p>We've detected potential warning signs with this job listing:</p>
      <ul className="list-disc list-inside mt-2">
        <li>Low quality score ({job.qualityScore}/10)</li>
        {job.salary === 'Undisclosed' && <li>No salary information provided</li>}
        {!job.company && <li>Missing company information</li>}
        {job.description?.length < 200 && <li>Very limited job description</li>}
      </ul>
    </TrustIndicator>
  );
};

export const JobSafetyTip: React.FC = () => {
  // Rotate through different safety tips
  const safetyTips = [
    "Never pay money to apply for a job. Legitimate employers don't charge application fees.",
    "Be cautious if a job requires upfront purchases of equipment or software.",
    "Research the company thoroughly before providing personal information.",
    "Legitimate remote employers won't ask for banking information during the application process.",
    "Video interviews should be professional and conducted through established platforms.",
    "Be wary of job offers that come without a proper interview process.",
    "Check company reviews on sites like Glassdoor or LinkedIn before applying."
  ];
  
  // Use a random tip or rotate through them
  const randomTip = safetyTips[Math.floor(Math.random() * safetyTips.length)];
  
  return (
    <TrustIndicator
      className="bg-blue-50"
      title="Remote Job Safety Tip"
      icon={
        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      }
    >
      <p>{randomTip}</p>
    </TrustIndicator>
  );
};

export const VerificationProcessExplanation: React.FC = () => {
  return (
    <TrustIndicator
      className="bg-indigo-50"
      title="Our Job Verification Process"
      icon={
        <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      }
    >
      <p>We evaluate every job listing using our quality scoring system that checks:</p>
      <ul className="list-disc list-inside mt-2">
        <li><strong>Company verification</strong>: We verify the company exists and has a legitimate online presence</li>
        <li><strong>Listing quality</strong>: We analyze job details for completeness and clarity</li>
        <li><strong>Source credibility</strong>: We assess the reliability of where the job was posted</li>
        <li><strong>Red flag detection</strong>: We scan for warning signs of potential scams</li>
      </ul>
      <p className="mt-2">Jobs with a quality score of 8+ receive our "Verified" badge.</p>
    </TrustIndicator>
  );
};

interface TrustIndicatorsProps {
  job: AnyJobListing;
  showAll?: boolean;
}

const TrustIndicators: React.FC<TrustIndicatorsProps> = ({ job, showAll = false }) => {
  return (
    <div className="space-y-4">
      <CompanyVerification job={job} />
      <RedFlagWarning job={job} />
      {showAll && (
        <>
          <JobSafetyTip />
          <VerificationProcessExplanation />
        </>
      )}
    </div>
  );
};

export default TrustIndicators; 