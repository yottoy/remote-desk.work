import React from 'react';
import Head from 'next/head';

interface KeywordMetadataProps {
  title: string;
  description: string;
  keyword: string;
  canonicalPath: string;
}

const KeywordMetadata: React.FC<KeywordMetadataProps> = ({
  title,
  description,
  keyword,
  canonicalPath,
}) => {
  const siteName = 'ClickClickJob.com';
  
  // Format title according to SEO requirements
  const formattedTitle = title || `${keyword} - Find Verified Opportunities - ${siteName}`;
  
  // Ensure description is within recommended length
  const formattedDescription = description?.substring(0, 155) || 
    `Find legitimate ${keyword} opportunities. Verified employers, no scams, worldwide remote positions available. Apply today!`;
  
  // Generate relevant keywords based on the main keyword
  const keywordVariations = [
    keyword,
    `${keyword} opportunities`,
    `${keyword} positions`,
    `${keyword} worldwide`,
    `${keyword} verified`,
    `${keyword} legitimate`,
    'remote work',
    'work from home',
    'work from anywhere',
    'global remote jobs'
  ];
  
  // Get canonical URL
  const baseUrl = 'https://www.clickclickjob.com';
  const canonicalUrl = `${baseUrl}${canonicalPath}`;
  
  return (
    <Head>
      <title>{formattedTitle}</title>
      <meta name="description" content={formattedDescription} />
      <meta name="keywords" content={keywordVariations.join(', ')} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={formattedDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={formattedDescription} />

      {/* Canonical URL - important for SEO */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Additional SEO metadata */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
    </Head>
  );
};

export default KeywordMetadata;
