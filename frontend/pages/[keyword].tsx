import { GetServerSideProps } from 'next';
import KeywordLandingPage from '../components/common/KeywordLandingPage';
import { keywordPagesData } from '../data/keywordPages'; // Import as named export
import { KeywordPageData } from '../types/seo';
import { EnhancedJobListing } from '../types/job';

interface KeywordPageProps {
  pageData: KeywordPageData;
  jobs: EnhancedJobListing[];
  error?: string;
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  // Get the keyword slug from the URL
  const keywordSlug = params?.keyword as string;
  
  console.log('Requested keyword slug:', keywordSlug);
  console.log('Available keywords:', Object.keys(keywordPagesData));
  
  // Redirect legacy URLs to their proper destinations
  if (keywordSlug === 'job-alerts') {
    return {
      redirect: {
        destination: '/newsletter',
        permanent: true,
      },
    };
  }

  // Exclude specific pages that have their own routes
  if (keywordSlug === 'market-insights' || keywordSlug === 'about' || keywordSlug === 'contact' || keywordSlug === 'newsletter') {
    console.log('Redirecting to static page:', keywordSlug);
    return {
      notFound: true // This will let the static page handle it
    };
  }
  
  // Check if we have data for this keyword
  if (!keywordSlug || !keywordPagesData[keywordSlug]) {
    console.log('Keyword not found in data, returning 404');
    return {
      notFound: true // This will render the 404 page
    };
  }
  
  // Get the page data for this keyword
  const pageData = keywordPagesData[keywordSlug];
  console.log('Found page data for keyword:', keywordSlug);
  
  try {
    // Fetch real jobs from the API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/jobs?limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let jobs: EnhancedJobListing[] = [];
    
    if (response.ok) {
      const data = await response.json();
      jobs = data.jobs || [];
    } else {
      console.warn('Failed to fetch jobs, using fallback data');
    }

    // If no jobs found, create some fallback content to ensure pages aren't empty
    if (jobs.length === 0) {
      jobs = [
        {
          _id: 'fallback1',
          title: `Remote ${keywordSlug.split('-').slice(0, 2).join(' ')} Opportunities`,
          company: 'Various Companies',
          location: 'Remote - Worldwide',
          salary: '$15-25/hr',
          jobType: 'Full-time',
          experienceLevel: 'entry-level',
          description: `We regularly feature new ${keywordSlug.split('-').join(' ')} positions. Check back daily for the latest opportunities.`,
          descriptionText: `We regularly feature new ${keywordSlug.split('-').join(' ')} positions. Check back daily for the latest opportunities.`,
          postedDate: new Date(),
          qualityScore: 0.8,
          featured: false
        }
      ];
    }
    
    return {
      props: {
        pageData,
        jobs: jobs.slice(0, 10) // Limit to 10 jobs
      }
    };
  } catch (error) {
    console.error(`Error fetching jobs for keyword ${keywordSlug}:`, error);
    
    // Return fallback data instead of empty
    const fallbackJobs: EnhancedJobListing[] = [
      {
        _id: 'fallback1',
        title: `Remote ${keywordSlug.split('-').slice(0, 2).join(' ')} Opportunities`,
        company: 'Various Companies',
        location: 'Remote - Worldwide',
        salary: '$15-25/hr',
        jobType: 'Full-time',
        experienceLevel: 'entry-level',
        description: `We regularly feature new ${keywordSlug.split('-').join(' ')} positions. Check back daily for the latest opportunities.`,
        descriptionText: `We regularly feature new ${keywordSlug.split('-').join(' ')} positions. Check back daily for the latest opportunities.`,
        postedDate: new Date(),
        qualityScore: 0.8,
        featured: false
      }
    ];
    
    return {
      props: {
        pageData,
        jobs: fallbackJobs,
        error: 'Unable to load latest jobs. Please check back later.'
      }
    };
  }
};

const KeywordPage: React.FC<KeywordPageProps> = ({ pageData, jobs, error }) => {
  return (
    <KeywordLandingPage
      pageData={pageData}
      jobs={jobs}
      isLoading={false}
      error={error}
    />
  );
};

export default KeywordPage;
