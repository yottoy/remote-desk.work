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
  const title = `${jobTitle} at ${companyName} | ${siteName}`;
  // Create a concise description, ensuring it's not too long for SERPs
  const description = `Apply for ${jobTitle} at ${companyName}. ${jobDescription.substring(0, 120)}... Find more remote admin and data entry jobs at ${siteName}.`;
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''; // Fallback for server-side

  // Combine default keywords with any job-specific ones
  const baseKeywords = ['remote work', 'work from home', 'admin jobs', 'data entry', 'ClickClickJob.com'];
  const dynamicKeywords = [jobTitle, companyName, location].filter(Boolean) as string[]; // Ensure only strings
  const allKeywords = Array.from(new Set([...keywords, ...baseKeywords, ...dynamicKeywords]));


  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords.join(', ')} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="article" />
      {pageUrl && <meta property="og:url" content={pageUrl} />}
      <meta property="og:site_name" content={siteName} />
      {/* Add more structured data specific tags later */}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {/* <meta name="twitter:site" content="@yourtwitterhandle" /> */}
      {/* <meta name="twitter:creator" content="@jobpostershandle" /> */}
      {/* <meta name="twitter:image" content="url_to_image_for_twitter_card" /> */}

      {/* Canonical URL - important for duplicate content */}
      {pageUrl && <link rel="canonical" href={pageUrl} />}
    </Head>
  );
};

export default Metadata; 