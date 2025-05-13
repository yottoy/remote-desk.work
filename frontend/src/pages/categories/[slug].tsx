import React, { useState } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import SearchBar from '../../components/common/SearchBar';
import JobCard from '../../components/common/JobCard';
import CategoryCard from '../../components/common/CategoryCard';

// Mock category data
const categoryData = {
  'data-entry': {
    name: 'Remote Data Entry Jobs',
    description: `Data entry jobs involve inputting information from various sources into company databases, spreadsheets, or other management systems. Remote data entry positions typically require accuracy, attention to detail, and moderate typing speed (usually 40-60 WPM).

These roles are popular among work-from-home seekers because they often require minimal qualifications and can be performed entirely remotely. Many data entry positions are entry-level, making them accessible for those with limited experience or who are just starting their remote work careers.

Companies typically pay between $14-20 per hour for data entry specialists, with experienced professionals commanding higher rates. While many positions are full-time, you'll also find numerous part-time and flexible schedule opportunities in this category.

Common employers include insurance companies, healthcare providers, e-commerce businesses, and third-party business service providers. The tools most frequently used include Microsoft Excel, Google Sheets, and proprietary data management systems.`,
    count: 56,
    requirements: [
      { title: 'Typing Speed', description: '40-60 WPM' },
      { title: 'Software', description: 'Microsoft Office, Google Workspace' },
      { title: 'Attention to Detail', description: 'High accuracy required' },
      { title: 'Data Management', description: 'Basic organization skills' }
    ],
    faqs: [
      {
        question: 'How much do remote data entry jobs pay?',
        answer: 'Remote data entry positions typically pay between $14-20 per hour, depending on experience, typing speed, and the complexity of the data being processed. Entry-level positions generally start at the lower end of this range, while specialized data entry roles (like medical or legal data entry) can pay more.'
      },
      {
        question: 'Do I need experience for data entry jobs?',
        answer: 'Many data entry positions are entry-level and require no prior professional experience. However, you should be comfortable with computers, have reasonable typing speed (40+ WPM), and demonstrate attention to detail. Some specialized data entry positions may require experience or familiarity with specific industries or software.'
      },
      {
        question: 'What equipment do I need for remote data entry work?',
        answer: 'The basic requirements include a reliable computer (desktop or laptop), high-speed internet connection, and sometimes a headset for communication. Some employers may require dual monitors, specific software installations, or a quiet workspace. Most companies will specify their technical requirements in the job listing.'
      },
      {
        question: 'Are remote data entry jobs legitimate?',
        answer: 'Yes, many legitimate remote data entry jobs exist. However, this category also attracts scammers. Be wary of any position requiring you to pay for training, software, or "registration fees." Legitimate companies will never ask you to pay to work for them. Always research potential employers thoroughly before applying or sharing personal information.'
      }
    ],
    relatedCategories: [
      { name: 'Transcription Jobs', slug: 'transcription' },
      { name: 'Data Processing', slug: 'data-processing' },
      { name: 'Administrative Assistant', slug: 'administrative' }
    ]
  },
  'administrative': {
    name: 'Remote Administrative Jobs',
    description: `Administrative jobs involve providing support to executives, teams, or entire organizations by handling various tasks including calendar management, correspondence, report preparation, and general office administration.

Remote administrative positions are ideal for organized, detail-oriented professionals with excellent communication skills and the ability to prioritize tasks effectively. These roles vary from entry-level administrative assistants to executive assistants with specialized experience.

Typical salaries range from $15-25 per hour, with virtual executive assistants earning $20-30+ per hour. Most positions require intermediate to advanced proficiency with office productivity tools including email management, calendar systems, video conferencing, and document preparation.

Companies across all industries hire remote administrative professionals, including startups, established corporations, non-profits, and individual executives or entrepreneurs seeking support.`,
    count: 42,
    requirements: [
      { title: 'Organization Skills', description: 'Essential for managing multiple tasks' },
      { title: 'Software', description: 'Microsoft Office, Google Workspace, project management tools' },
      { title: 'Communication', description: 'Excellent written and verbal skills' },
      { title: 'Calendar Management', description: 'Experience with scheduling systems' }
    ],
    faqs: [
      {
        question: 'What do remote administrative assistants do?',
        answer: 'Remote administrative assistants handle a variety of tasks including email and calendar management, scheduling appointments, arranging travel, preparing documents and presentations, managing filing systems, and sometimes basic bookkeeping or customer service. The exact responsibilities vary by employer and seniority level.'
      },
      {
        question: 'How much experience is needed for remote administrative jobs?',
        answer: 'Entry-level administrative positions may require minimal experience (0-1 years), while executive assistant roles typically require 3-5+ years of administrative experience. Many employers value previous remote work experience, as it demonstrates your ability to work independently and stay organized outside a traditional office environment.'
      },
      {
        question: 'What is the difference between a virtual assistant and an administrative assistant?',
        answer: 'While there is significant overlap, virtual assistants typically work as independent contractors or freelancers and may support multiple clients simultaneously. Administrative assistants are more likely to be employees of a single company. Virtual assistants might also offer specialized services beyond administration, such as social media management or basic graphic design.'
      },
      {
        question: 'Do remote administrative jobs offer benefits?',
        answer: 'Full-time remote administrative positions with established companies often include standard benefits like health insurance, paid time off, and retirement plans. Contract or part-time positions typically do not include benefits. Independent contractors (including many virtual assistants) are responsible for their own benefits and taxes.'
      }
    ],
    relatedCategories: [
      { name: 'Virtual Assistant Jobs', slug: 'virtual-assistant' },
      { name: 'Data Entry Jobs', slug: 'data-entry' },
      { name: 'Customer Service', slug: 'customer-service' }
    ]
  },
  // Add more categories as needed
};

// Mock data for jobs (in a real app, these would come from an API)
const mockJobs = [
  {
    _id: 'job1',
    title: 'Remote Data Entry Specialist',
    company: 'TechCorp Solutions',
    location: 'Remote (US Only)',
    description: 'We are looking for a detail-oriented Data Entry Specialist to join our team...',
    descriptionText: 'We are looking for a detail-oriented Data Entry Specialist to join our team. You will be responsible for entering data from various sources into company database, maintaining data accuracy and integrity.',
    salary: '$18-22/hr',
    postedDate: new Date(),
    qualityScore: 9.2,
    featured: true,
    categories: ['data-entry']
  },
  {
    _id: 'job2',
    title: 'Virtual Administrative Assistant',
    company: 'Global Services LLC',
    location: 'Remote (Worldwide)',
    description: 'Support executives by managing schedules, preparing reports, and handling correspondence...',
    descriptionText: 'Support executives by managing schedules, preparing reports, and handling correspondence. Must have excellent communication skills and be proficient in Microsoft Office suite.',
    salary: '$15-17/hr',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    qualityScore: 8.5,
    featured: true,
    categories: ['administrative', 'virtual-assistant']
  },
  {
    _id: 'job3',
    title: 'Entry-Level Data Entry Clerk',
    company: 'DataFlow Inc',
    location: 'Remote (US Only)',
    description: 'Input data from various sources into our proprietary system...',
    descriptionText: 'Input data from various sources into our proprietary system. Ensure accuracy and completeness of data. Flag discrepancies and errors. No prior experience needed - we provide training!',
    salary: '$14-16/hr',
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    qualityScore: 7.9,
    featured: false,
    categories: ['data-entry']
  },
  {
    _id: 'job4',
    title: 'Administrative Coordinator',
    company: 'Executive Support Co',
    location: 'Remote (US Only)',
    description: 'Provide administrative support to C-level executives...',
    descriptionText: 'Provide administrative support to C-level executives. Manage calendars, arrange travel, and handle correspondence. Must be highly organized and professional.',
    salary: '$22-25/hr',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    qualityScore: 9.1,
    featured: false,
    categories: ['administrative']
  },
];

type CategoryPageProps = {
  category: {
    name: string;
    description: string;
    count: number;
    requirements: { title: string; description: string }[];
    faqs: { question: string; answer: string }[];
    relatedCategories: { name: string; slug: string }[];
  };
  jobs: typeof mockJobs;
  slug: string;
};

const CategoryPage: React.FC<CategoryPageProps> = ({ category, jobs, slug }) => {
  const router = useRouter();
  const [activeAccordion, setActiveAccordion] = useState<number | null>(0);

  const filterChips = [
    { label: 'No Experience', value: 'no-experience' },
    { label: 'Part-Time', value: 'part-time' },
    { label: 'Full-Time', value: 'full-time' },
    { label: 'Entry-Level', value: 'entry-level' }
  ];

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <Layout
      title={`${category.name} | Work From Home | ClickClickJob.com`}
      description={`Find verified ${category.name.toLowerCase()}. Average pay $15-20/hr. 100% work from home positions, updated daily with verified employers.`}
    >
      {/* Hero Section */}
      <section className="bg-blue-50 py-12 border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            {category.name.toUpperCase()}
          </h1>
          
          <p className="text-xl text-gray-700 max-w-4xl mx-auto text-center mb-8">
            Find verified {category.name.toLowerCase()} you can do from home. All jobs verified and updated daily.
          </p>
          
          <div className="max-w-3xl mx-auto">
            <SearchBar 
              placeholder={`Search ${slug.replace('-', ' ')} jobs...`}
              filterChips={filterChips}
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ABOUT {category.name.toUpperCase()}
          </h2>
          
          <div className="prose max-w-none text-gray-700">
            {category.description.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            FEATURED {slug.toUpperCase().replace('-', ' ')} JOBS
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.filter(job => job.featured).map(job => (
              <JobCard key={job._id} job={job} variant="featured" />
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <Link 
              href={`/jobs?category=${slug}`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse All {category.name.replace('Remote ', '')}
            </Link>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            TYPICAL REQUIREMENTS
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {category.requirements.map((requirement, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{requirement.title}</h3>
                <p className="text-gray-600">{requirement.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          
          <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {category.faqs.map((faq, index) => (
              <div key={index} className="py-4">
                <button
                  className="flex justify-between items-center w-full text-left focus:outline-none"
                  onClick={() => toggleAccordion(index)}
                >
                  <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                  <svg 
                    className={`h-6 w-6 text-gray-500 transform ${activeAccordion === index ? 'rotate-180' : ''}`} 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {activeAccordion === index && (
                  <div className="mt-3 text-gray-700 prose">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Categories Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            RELATED CATEGORIES
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            {category.relatedCategories.map((relatedCategory, index) => (
              <CategoryCard 
                key={index}
                name={relatedCategory.name}
                slug={relatedCategory.slug}
                variant="compact"
              />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Get all possible category slugs
  const slugs = Object.keys(categoryData);
  
  return {
    paths: slugs.map(slug => ({ params: { slug } })),
    fallback: true // Show a loading state for categories that don't exist yet
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  // Get category data
  const category = categoryData[slug as keyof typeof categoryData];
  
  // Get jobs for this category
  const categoryJobs = mockJobs.filter(job => job.categories.includes(slug));

  // Format dates to avoid serialization errors
  const formatJobForSerialization = (job: any) => {
    return {
      ...job,
      postedDate: job.postedDate?.toISOString() || new Date().toISOString()
    };
  };
  
  // If category doesn't exist, return 404
  if (!category) {
    return {
      notFound: true
    };
  }
  
  return {
    props: {
      category,
      jobs: categoryJobs.map(formatJobForSerialization),
      slug
    },
    revalidate: 60 * 60 // Revalidate every hour
  };
};

export default CategoryPage; 