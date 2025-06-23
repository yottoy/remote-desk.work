import Head from 'next/head';

interface JobMetadataProps {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  location?: string;
  keywords?: string[];
}

const Metadata: React.FC<JobMetadataProps> = ({
  jobTitle,
  companyName,
  jobDescription,
  location,
  keywords = ['remote admin jobs', 'remote data entry jobs'],
}) => {
  const siteName = 'ClickClickJob.com';
  const isAdminJob = jobTitle.toLowerCase().includes('admin') || 
                     jobTitle.toLowerCase().includes('administrative');
  const isDataEntryJob = jobTitle.toLowerCase().includes('data entry') || 
                         jobTitle.toLowerCase().includes('data');
  
  // Create a more targeted title for SEO
  const title = isAdminJob 
    ? `${jobTitle} at ${companyName} | Remote Admin Jobs | ${siteName}`
    : isDataEntryJob 
      ? `${jobTitle} at ${companyName} | Remote Data Entry Jobs | ${siteName}`
      : `${jobTitle} at ${companyName} | Remote Jobs | ${siteName}`;
      
  // Create a more detailed description for better CTR
  const description = `Apply for this remote ${jobTitle} position at ${companyName}${location ? ` (${location})` : ''}. ${jobDescription.substring(0, 120)}... Find more legitimate remote admin and data entry jobs at ${siteName}.`;
  
  // Get page URL safely (works in SSR and client)
  const pageUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : null;
  
  // Combine default keywords with any job-specific ones
  const adminKeywords = ['remote admin', 'administrative assistant', 'virtual assistant', 'remote office manager', 'executive assistant'];
  const dataEntryKeywords = ['remote data entry', 'data processing', 'typing jobs', 'data clerk', 'remote data specialist'];
  const baseKeywords = ['work from home', 'remote work', 'telecommute', isAdminJob ? adminKeywords : isDataEntryJob ? dataEntryKeywords : []].flat();
  const dynamicKeywords = [jobTitle, companyName, location].filter(Boolean) as string[]; // Ensure only strings
  const allKeywords = Array.from(new Set([...keywords, ...baseKeywords, ...dynamicKeywords]));

  // AI-specific descriptions
  const aiDescription = `A verified remote ${jobTitle} opportunity at ${companyName}. This position is for professional ${isAdminJob ? 'administrative support' : isDataEntryJob ? 'data entry' : 'remote work'} with legitimate compensation and benefits. Part of our curated collection of remote work opportunities for admin and data entry professionals.`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords.join(', ')} />
      
      {/* AI-specific meta tags */}
      <meta name="description-ai" content={aiDescription} />
      <meta name="job-type" content={isAdminJob ? 'administrative' : isDataEntryJob ? 'data-entry' : 'remote'} />
      <meta name="job-location" content="remote" />
      <meta name="ai-content-quality" content="verified-legitimate-job" />
      <meta name="ai-targeted-audience" content="remote admin and data entry professionals" />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {/* Canonical URL - important for duplicate content */}
      {pageUrl && <link rel="canonical" href={pageUrl} />}
      
      {/* Mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Head>
  );
};

export default Metadata; 