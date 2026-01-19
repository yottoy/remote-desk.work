import React from 'react';

interface OrganizationSchemaProps {
  name: string;
  url?: string;
  logo?: string;
  description?: string;
}

const OrganizationSchema: React.FC<OrganizationSchemaProps> = ({ 
  name, 
  url = 'https://www.clickclickjob.com', 
  logo = 'https://www.clickclickjob.com/logo.png',
  description = 'A specialized job board focused exclusively on remote admin and data entry jobs.'
}) => {
  const orgData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: name,
    url: url,
    logo: logo,
    description: description,
    sameAs: [
      'https://twitter.com/clickclickjob',
      'https://www.linkedin.com/company/clickclickjob',
      'https://www.facebook.com/clickclickjob'
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(orgData) }}
    />
  );
};

export default OrganizationSchema; 