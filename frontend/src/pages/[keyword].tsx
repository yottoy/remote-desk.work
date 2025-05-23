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
    // Create mock data for testing
    const mockJobs: EnhancedJobListing[] = [
      {
        _id: 'job1',
        title: 'Data Entry Specialist',
        company: 'Global Data Solutions',
        location: 'Remote - Worldwide',
        salary: '$15-20/hr',
        jobType: 'Full-time',
        experienceLevel: 'no-experience',
        description: 'Looking for detail-oriented individuals to join our remote data entry team. No prior experience required.',
        descriptionText: 'Looking for detail-oriented individuals to join our remote data entry team. No prior experience required.',
        postedDate: new Date('2025-05-15'),
        qualityScore: 0.95,
        featured: false
      },
      {
        _id: 'job2',
        title: 'Virtual Data Entry Clerk',
        company: 'RemoteWorks Inc.',
        location: 'Remote - US Based',
        salary: '$16/hr',
        jobType: 'Part-time',
        experienceLevel: 'no-experience',
        description: 'Part-time data entry position perfect for beginners. Training provided.',
        descriptionText: 'Part-time data entry position perfect for beginners. Training provided.',
        postedDate: new Date('2025-05-18'),
        qualityScore: 0.9,
        featured: true
      },
      {
        _id: 'job3',
        title: 'Administrative Assistant',
        company: 'Virtual Office Solutions',
        location: 'Remote - Worldwide',
        salary: '$18/hr',
        jobType: 'Full-time',
        experienceLevel: 'entry-level',
        description: 'Administrative support for a growing virtual team. Entry-level position with training provided.',
        descriptionText: 'Administrative support for a growing virtual team. Entry-level position with training provided.',
        postedDate: new Date('2025-05-20'),
        qualityScore: 0.85,
        featured: false
      }
    ];
    
    return {
      props: {
        pageData,
        jobs: mockJobs
      }
    };
  } catch (error) {
    console.error(`Error fetching jobs for keyword ${keywordSlug}:`, error);
    
    // Return the page data but with empty jobs array and error message
    return {
      props: {
        pageData,
        jobs: [],
        error: 'Failed to load jobs. Please try again later.'
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
