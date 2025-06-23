import React from 'react';
import Head from 'next/head';
import { generateJSONLD } from '../../utils/schemaGenerator';

interface SchemaHeadProps {
  schemas: object[];
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  };
}

/**
 * SchemaHead component for injecting structured data and SEO meta tags
 */
const SchemaHead: React.FC<SchemaHeadProps> = ({
  schemas = [],
  title,
  description,
  canonical,
  noindex = false,
  openGraph
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://clickclickjob.com';
  
  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Robots meta */}
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow"} />
      
      {/* Open Graph meta tags */}
      {openGraph && (
        <>
          <meta property="og:title" content={openGraph.title || title} />
          <meta property="og:description" content={openGraph.description || description} />
          <meta property="og:type" content={openGraph.type || 'website'} />
          <meta property="og:url" content={openGraph.url || canonical} />
          {openGraph.image && <meta property="og:image" content={openGraph.image} />}
          <meta property="og:site_name" content="ClickClickJob" />
        </>
      )}
      
      {/* Twitter Card meta tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@clickclickjob" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      {openGraph?.image && <meta name="twitter:image" content={openGraph.image} />}
      
      {/* Additional SEO meta tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta httpEquiv="content-language" content="en-US" />
      <meta name="author" content="ClickClickJob" />
      <meta name="publisher" content="ClickClickJob" />
      
      {/* Structured Data JSON-LD */}
      {schemas.map((schema, index) => (
        <script
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJSONLD(schema)
          }}
        />
      ))}
    </Head>
  );
};

export default SchemaHead; 