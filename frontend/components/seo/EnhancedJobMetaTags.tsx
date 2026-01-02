import React from 'react';
import Head from 'next/head';
import { RemoteJobMetaTemplates, MobileFirstSEOOptimizer } from '../../utils/seoOptimization';
import { Job, EnhancedJobListing } from '../../types/job';

interface EnhancedJobMetaTagsProps {
  job: Job | EnhancedJobListing;
  currentUrl: string;
  isMobile?: boolean;
  customTitle?: string;
  customDescription?: string;
}

/**
 * Enhanced Meta Tags Component for Remote Jobs
 * Optimized for high-CTR keywords and mobile-first indexing
 */
const EnhancedJobMetaTags: React.FC<EnhancedJobMetaTagsProps> = ({
  job,
  currentUrl,
  isMobile = false,
  customTitle,
  customDescription
}) => {
  // Generate optimized meta tags
  const title = customTitle || RemoteJobMetaTemplates.generateJobTitle(job);
  const description = customDescription || RemoteJobMetaTemplates.generateJobDescription(job);
  
  // Apply mobile optimizations if needed
  const { title: optimizedTitle, description: optimizedDescription } = isMobile 
    ? MobileFirstSEOOptimizer.optimizeForMobile(title, description)
    : { title, description };

  // Extract job details for additional meta tags
  const salary = (job as any).salary || (job as any).payRange;
  const experienceLevel = (job as any).experienceLevel;
  const jobType = (job as any).jobType;

  // Create structured data for job posting
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": optimizedDescription,
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "US"
      }
    },
    "employmentType": "FULL_TIME",
    "workEnvironment": "Remote work",
    "jobBenefits": ["Remote work", "Work from home", "Flexible schedule"],
    "url": currentUrl,
    "datePosted": job.postedDate ? new Date(job.postedDate).toISOString() : new Date().toISOString()
  };

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{optimizedTitle}</title>
      <meta name="description" content={optimizedDescription} />
      <meta name="keywords" content={`remote jobs, work from home, ${job.title.toLowerCase()}, ${job.company.toLowerCase()}, remote work opportunities, telecommute jobs`} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="article" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={optimizedTitle} />
      <meta property="og:description" content={optimizedDescription} />
      <meta property="og:image" content="/images/remote-job-og.jpg" />
      <meta property="og:site_name" content="ClickClickJob" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={optimizedTitle} />
      <meta property="twitter:description" content={optimizedDescription} />
      <meta property="twitter:image" content="/images/remote-job-twitter.jpg" />
      
      {/* Job-specific meta tags */}
      <meta name="job:title" content={job.title} />
      <meta name="job:company" content={job.company} />
      <meta name="job:location" content={job.location} />
      {salary && <meta name="job:salary" content={salary} />}
      {experienceLevel && <meta name="job:experience" content={experienceLevel} />}
      {jobType && <meta name="job:type" content={jobType} />}
      <meta name="job:remote" content="true" />
      
      {/* Mobile-specific optimizations */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Geographic targeting for remote jobs */}
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      <meta name="ICBM" content="39.8283, -98.5795" /> {/* Geographic center of US */}
      
      {/* Search engine directives */}
      <meta name="robots" content="index, follow, max-snippet:155, max-image-preview:large" />
      <meta name="googlebot" content="index, follow, max-snippet:155, max-image-preview:large" />
      
      {/* Language and content directives */}
      <meta httpEquiv="content-language" content="en-US" />
      <meta name="language" content="English" />
      <meta name="author" content="ClickClickJob" />
      <meta name="publisher" content="ClickClickJob" />
      <meta name="copyright" content="ClickClickJob" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      {/* Preconnect to important domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      
      {/* DNS prefetch for external resources */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
    </Head>
  );
};

export default EnhancedJobMetaTags; 