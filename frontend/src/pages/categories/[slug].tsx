import React, { useState } from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import SearchBar from '../../components/common/SearchBar';
import JobCard from '../../components/common/JobCard';
import CategoryCard from '../../components/common/CategoryCard';
import { connectToDatabase, isValidJob, serializeJobForNextJS } from '../../utils/mongodb';
import type { Job } from '../../types/job';
import { isMockJob } from '../../types/job';

// List of valid category slugs (matching the ones in CategoryCard component)
const validCategorySlugs = [
  'data-entry',
  'administrative',
  'customer-service',
  'transcription',
  'virtual-assistant',
  'data-processing',
  'customer-support',
  'bookkeeping',
  'content-writing',
  'social-media',
  'project-management',
  'quality-assurance'
];

// Helper function to generate a generic category if specific data isn't available
const createGenericCategory = (slug: string) => {
  const nameMap: Record<string, string> = {
    'data-entry': 'Remote Data Entry Jobs',
    'administrative': 'Remote Administrative Jobs',
    'customer-service': 'Remote Customer Service Jobs',
    'transcription': 'Remote Transcription Jobs',
    'virtual-assistant': 'Remote Virtual Assistant Jobs',
    'data-processing': 'Remote Data Processing Jobs',
    'customer-support': 'Remote Customer Support Jobs',
    'bookkeeping': 'Remote Bookkeeping Jobs',
    'content-writing': 'Remote Content Writing Jobs',
    'social-media': 'Remote Social Media Jobs',
    'project-management': 'Remote Project Management Jobs',
    'quality-assurance': 'Remote Quality Assurance Jobs'
  };

  const name = nameMap[slug] || `Remote ${slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Jobs`;
  const formattedName = name.replace('Remote ', '');
  
  return {
    name,
    description: `${formattedName} involve working remotely on projects related to ${slug.replace(/-/g, ' ')}. These positions typically require attention to detail, good communication skills, and familiarity with relevant tools and technologies.

Remote ${slug.replace(/-/g, ' ')} positions offer flexibility and the ability to work from anywhere with a reliable internet connection. Many companies are increasingly hiring remote workers for these roles, recognizing the benefits of accessing talent regardless of geographic location.

Pay for these positions varies based on experience, specific skills, and employer, but typically ranges from $15-30 per hour depending on specialization and complexity of work.

If you're looking for opportunities in this field, ensure you highlight relevant experience, technical skills, and your ability to work independently while maintaining strong communication with remote teams.`,
    count: 0, // Default to 0 since we don't know if actual jobs exist
    requirements: [
      { title: 'Technical Skills', description: `Proficiency in ${slug.replace(/-/g, ' ')} related tools` },
      { title: 'Communication', description: 'Strong written and verbal skills' },
      { title: 'Organization', description: 'Ability to manage tasks independently' },
      { title: 'Technical Setup', description: 'Reliable computer and internet connection' }
    ],
    faqs: [
      {
        question: `What does a remote ${slug.replace(/-/g, ' ')} professional do?`,
        answer: `Remote ${slug.replace(/-/g, ' ')} professionals handle various tasks related to ${slug.replace(/-/g, ' ')} for their employers or clients. This typically includes tasks relevant to the field, using specialized software and tools to deliver high-quality work from a home office environment.`
      },
      {
        question: `What qualifications do I need for ${slug.replace(/-/g, ' ')} jobs?`,
        answer: `Qualifications vary by employer, but most positions require some combination of relevant education, experience with industry-standard tools, and demonstrated skills in the field. Many employers value strong communication skills and the ability to work independently.`
      },
      {
        question: `How much do remote ${slug.replace(/-/g, ' ')} jobs pay?`,
        answer: `Pay varies widely based on experience, specific skills, and employer. Entry-level positions typically start around $15-20 per hour, while more experienced professionals can earn $25-40+ per hour depending on specialization.`
      },
      {
        question: `Are remote ${slug.replace(/-/g, ' ')} jobs full-time or part-time?`,
        answer: `Both full-time and part-time positions are available. Many employers offer flexible scheduling options, and there are also contract or freelance opportunities in this field.`
      }
    ],
    relatedCategories: validCategorySlugs
      .filter(s => s !== slug)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(s => {
        const relatedName = s.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return {
          name: `${relatedName} Jobs`,
          slug: s
        };
      })
  };
};

// Catalog of detailed category descriptions (not job data)
const categoryDescriptions = {
  'data-entry': {
    name: 'Remote Data Entry Jobs',
    description: `Data entry jobs involve inputting information from various sources into company databases, spreadsheets, or other management systems. Remote data entry positions typically require accuracy, attention to detail, and moderate typing speed (usually 40-60 WPM).

These roles are popular among work-from-home seekers because they often require minimal qualifications and can be performed entirely remotely. Many data entry positions are entry-level, making them accessible for those with limited experience or who are just starting their remote work careers.

Companies typically pay between $14-20 per hour for data entry specialists, with experienced professionals commanding higher rates. While many positions are full-time, you'll also find numerous part-time and flexible schedule opportunities in this category.

Common employers include insurance companies, healthcare providers, e-commerce businesses, and third-party business service providers. The tools most frequently used include Microsoft Excel, Google Sheets, and proprietary data management systems.`,
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
      { name: 'Data Processing Jobs', slug: 'data-processing' },
      { name: 'Administrative Jobs', slug: 'administrative' }
    ]
  },
  'administrative': {
    name: 'Remote Administrative Jobs',
    description: `Administrative jobs involve providing support to executives, teams, or entire organizations by handling various tasks including calendar management, correspondence, report preparation, and general office administration.

Remote administrative positions are ideal for organized, detail-oriented professionals with excellent communication skills and the ability to prioritize tasks effectively. These roles vary from entry-level administrative assistants to executive assistants with specialized experience.

Typical salaries range from $15-25 per hour, with virtual executive assistants earning $20-30+ per hour. Most positions require intermediate to advanced proficiency with office productivity tools including email management, calendar systems, video conferencing, and document preparation.

Companies across all industries hire remote administrative professionals, including startups, established corporations, non-profits, and individual executives or entrepreneurs seeking support.`,
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
      { name: 'Customer Service Jobs', slug: 'customer-service' }
    ]
  },
  'customer-service': {
    name: 'Remote Customer Service Jobs',
    description: `Customer service jobs involve directly assisting customers with inquiries, issues, and requests across various channels including phone, email, chat, and social media. Remote customer service positions require excellent communication skills, patience, and problem-solving abilities.

These roles are abundant in the remote work market as many companies have shifted their customer support operations to distributed teams. Positions range from entry-level representatives to specialized support roles and team leaders.

Salaries typically range from $14-22 per hour depending on experience, technical knowledge, and required language skills. Most remote customer service positions require reliable internet, a quiet workspace, and sometimes specific technical setups like dual monitors or landline phones.

Industries hiring remote customer service representatives include e-commerce, technology, healthcare, financial services, travel, and telecommunications. Many positions offer flexible scheduling options including part-time, full-time, and sometimes alternate shifts.`,
    requirements: [
      { title: 'Communication', description: 'Excellent verbal and written skills' },
      { title: 'Problem Solving', description: 'Ability to resolve customer issues efficiently' },
      { title: 'Technical Setup', description: 'Reliable internet, headset, quiet workspace' },
      { title: 'Software Knowledge', description: 'CRM systems, ticket management tools' }
    ],
    faqs: [
      {
        question: 'What skills do I need for remote customer service jobs?',
        answer: 'Essential skills include clear communication, active listening, problem-solving, patience, and basic computer proficiency. Depending on the role, you may also need experience with specific software platforms, typing speed requirements, or industry knowledge. Empathy and the ability to maintain a positive attitude when dealing with challenging situations are highly valued.'
      },
      {
        question: 'Do I need previous experience for remote customer service jobs?',
        answer: 'Many entry-level remote customer service positions require little or no previous experience in the field. Companies often provide training on their specific products, services, and procedures. However, any customer-facing experience (retail, hospitality, etc.) can be beneficial. For specialized customer service roles, relevant experience or knowledge may be required.'
      },
      {
        question: 'What is the work schedule like for remote customer service?',
        answer: 'Schedules vary widely by employer. Some companies offer standard business hours, while others require coverage for evening, overnight, or weekend shifts. Many remote customer service jobs offer flexible scheduling options, part-time positions, or the ability to pick up shifts. Companies that provide 24/7 support may require some non-standard hours.'
      },
      {
        question: 'What equipment do I need for remote customer service jobs?',
        answer: 'Requirements typically include a reliable computer, high-speed internet connection, and a quality headset. Some companies may require a landline phone, dual monitors, wired (not Wi-Fi) internet connection, or specific security software. Most employers will specify their technical requirements in the job listing and may perform a technical check before hiring.'
      }
    ],
    relatedCategories: [
      { name: 'Customer Support Jobs', slug: 'customer-support' },
      { name: 'Virtual Assistant Jobs', slug: 'virtual-assistant' },
      { name: 'Administrative Jobs', slug: 'administrative' }
    ]
  },
  'quality-assurance': {
    name: 'Remote Quality Assurance Jobs',
    description: `Quality Assurance jobs involve testing, monitoring, and ensuring the quality of products or services before they reach customers. Remote QA positions focus on identifying defects, verifying functionality, and helping maintain high standards across various industries.

These roles typically require attention to detail, critical thinking, and the ability to document findings clearly. Remote QA professionals work with various testing methodologies and tools to validate that products meet specified requirements and user expectations.

Salaries for remote QA positions typically range from $18-35 per hour depending on experience, technical skills, and industry specialization. Entry-level positions may focus on manual testing, while more advanced roles often involve automated testing, test planning, and quality process improvement.

Industries hiring remote QA professionals include software development, e-commerce, manufacturing, healthcare technology, and financial services. These positions may be titled Quality Assurance Analyst, QA Tester, Software Tester, or Quality Control Specialist.`,
    requirements: [
      { title: 'Attention to Detail', description: 'Ability to identify issues and inconsistencies' },
      { title: 'Documentation', description: 'Clear reporting of findings and test results' },
      { title: 'Testing Tools', description: 'Familiarity with relevant QA software and methodologies' },
      { title: 'Technical Skills', description: 'Basic understanding of the systems being tested' }
    ],
    faqs: [
      {
        question: 'What does a remote quality assurance professional do?',
        answer: 'Remote QA professionals test products, applications, or services to ensure they meet quality standards before release. This typically includes executing test cases, identifying and documenting bugs or issues, verifying fixes, and providing feedback to development teams. Depending on the role, they may also develop test plans, create automated tests, or help establish quality standards and processes.'
      },
      {
        question: 'Do I need a specific degree for quality assurance jobs?',
        answer: 'While a degree in computer science, engineering, or a related field can be helpful, many QA positions focus more on relevant skills and experience than formal education. Entry-level positions often require basic technical aptitude, attention to detail, and strong communication skills. Certifications in quality assurance methodologies (like ISTQB) can be valuable, especially for advancing in the field.'
      },
      {
        question: 'What tools do remote QA professionals use?',
        answer: 'Common tools include test management systems (like TestRail, Zephyr), bug tracking software (Jira, Bugzilla), automation tools (Selenium, Cypress, TestComplete), performance testing tools (JMeter, LoadRunner), and various specialized testing software depending on the industry. Familiarity with communication and collaboration tools is also essential for remote work.'
      },
      {
        question: 'Is quality assurance a good remote career?',
        answer: 'Yes, quality assurance is well-suited for remote work as most testing activities can be performed from anywhere with the right technical setup. The field offers various entry points, opportunities for specialization, and paths for career growth. As companies continue to prioritize quality and user experience, demand for skilled QA professionals remains strong across many industries.'
      }
    ],
    relatedCategories: [
      { name: 'Data Entry Jobs', slug: 'data-entry' },
      { name: 'Project Management Jobs', slug: 'project-management' },
      { name: 'Content Writing Jobs', slug: 'content-writing' }
    ]
  },
};

type CategoryPageProps = {
  category: {
    name: string;
    description: string;
    count: number;
    requirements: { title: string; description: string }[];
    faqs: { question: string; answer: string }[];
    relatedCategories: { name: string; slug: string }[];
  };
  jobs: any[]; // Using any[] since we don't have a fixed schema for real jobs
  slug: string;
  hasJobs: boolean;
};

const CategoryPage: React.FC<CategoryPageProps> = ({ category, jobs, slug, hasJobs }) => {
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

      {/* Jobs Section - Only displayed if real jobs exist */}
      {hasJobs && !jobs.some(job => job._id === 'job1' || job.company === 'TechCorp Solutions') ? (
        <section className="py-12 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              AVAILABLE {slug.toUpperCase().replace('-', ' ')} JOBS
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs
                // Extra safety filter to prevent mock jobs in the UI
                .filter(job => 
                  job && 
                  job.company !== 'TechCorp Solutions' && 
                  !job._id.toString().startsWith('job') && 
                  !job._id.toString().includes('job')
                )
                .map(job => (
                  <JobCard key={job._id} job={job} />
                ))
              }
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
      ) : (
        <section className="py-12 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No {category.name} Available
              </h3>
              <p className="text-gray-600 mb-6">
                We don't have any {category.name.toLowerCase()} available right now. New opportunities are added frequently, so check back soon!
              </p>
              <Link 
                href="/jobs"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse All Jobs
              </Link>
            </div>
          </div>
        </section>
      )}

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

// First enhance the filterMockJobs function with more aggressive filtering:
function filterMockJobs(jobs: any[]): any[] {
  if (!jobs || jobs.length === 0) return [];
  
  return jobs.filter((job: any) => {
    // If job doesn't exist or is missing critical data, filter it out
    if (!job || !job._id || !job.title || !job.company) return false;
    
    // HIGHEST PRIORITY: Explicitly filter out any TechCorp Solutions or job1 examples
    // This is the most important filter to ensure example jobs don't show
    if (job._id === 'job1' || job._id === 'mock' || job._id.includes('job')) return false;
    if (job.company === 'TechCorp Solutions' || job.company.includes('TechCorp')) return false;
    
    // Filter out mock job IDs
    if (typeof job._id === 'string' && /^job\d+$/.test(job._id)) return false;
    
    // Filter jobs with example.com or mock URLs
    if (job.url && typeof job.url === 'string' && 
        /example\.com|placeholder|test|mock/.test(job.url)) return false;
    
    // Filter jobs with mock flags
    if (job.isMock || job.is_mock_data) return false;
    
    // Filter jobs with mock prefixes in title/company
    if ((job.title && job.title.startsWith('[MOCK]')) || 
        (job.company && job.company.startsWith('[MOCK]'))) return false;
    
    // Make sure job has required fields for display
    if (!job.postedDate) return false;
    
    // Filter out engineering and other irrelevant job types that don't match our focus
    if (job.title && typeof job.title === 'string') {
      const irrelevantJobPattern = /engineer|developer|software|coding|programming|devops|architect|frontend|backend|fullstack|tech lead|IT manager|sys admin|network admin|security/i;
      if (irrelevantJobPattern.test(job.title)) return false;
    }
    
    // Filter out irrelevant job categories if present
    if (job.jobCategory && typeof job.jobCategory === 'string') {
      const irrelevantCategoryPattern = /engineering|development|programming|IT|security|networking/i;
      if (irrelevantCategoryPattern.test(job.jobCategory)) return false;
    }
    
    // If it passes all checks, it's a real job
    return true;
  });
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Get all valid category slugs instead of just the ones with defined data
  return {
    paths: validCategorySlugs.map(slug => ({ params: { slug } })),
    fallback: true // Show a loading state and generate pages on demand
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  // Check if the slug is in our valid list
  if (!validCategorySlugs.includes(slug)) {
    return {
      notFound: true
    };
  }
  
  try {
    // Try to fetch jobs directly from the database first if possible
    try {
      const { db } = await connectToDatabase();
      
      if (db) {
        console.log('Connected to database, fetching jobs directly');
        const jobsCollection = db.collection('jobs');
        
        // Query the database for jobs in this category
        const dbJobs = await jobsCollection.find({
          $and: [
            // First, match jobs in this category
            { $or: [
                { jobCategory: slug },
                { jobCategory: { $regex: `^${slug}$`, $options: 'i' } },
                { title: { $regex: slug.replace(/-/g, ' '), $options: 'i' } }
              ]
            },
            // Then explicitly filter out mock jobs
            { company: { $ne: "TechCorp Solutions" } },
            { _id: { $not: { $regex: /^job\d+$/ } } }
          ]
        })
        .sort({ postedDate: -1 })
        .limit(10)
        .toArray();
        
        if (dbJobs && dbJobs.length > 0) {
          console.log(`Found ${dbJobs.length} jobs directly from database for category: ${slug}`);
          
          // Ensure all jobs are properly serialized for Next.js static generation
          const serializedJobs = dbJobs.map((job: any) => serializeJobForNextJS(job));
          
          // Filter out any invalid/mock jobs
          const validJobs = filterMockJobs(serializedJobs.filter((job: any) => isValidJob(job) && !isMockJob(job)));
          console.log(`After filtering, ${validJobs.length} valid jobs remain`);
          
          // Get category description
          const categoryDescription = categoryDescriptions[slug as keyof typeof categoryDescriptions] || createGenericCategory(slug);
          
          // Special code to ensure NO TechCorp jobs can ever be returned
          // This is a last layer of defense to ensure cached/static builds don't include mock jobs
          const finalSanitizedJobs = validJobs.filter((job: any) => {
            // Remove any remaining TechCorp jobs (absolute fallback) 
            if (job._id === 'job1' || 
                (job.company && job.company.includes('TechCorp')) || 
                (typeof job._id === 'string' && /^job\d+$/.test(job._id))) {
              return false;
            }
            return true;
          });
          
          return {
            props: {
              category: {
                ...categoryDescription,
                count: finalSanitizedJobs.length
              },
              jobs: finalSanitizedJobs,
              slug,
              hasJobs: finalSanitizedJobs.length > 0
            },
            revalidate: 60 * 10 // Revalidate every 10 minutes
          };
        } else {
          console.log(`No jobs found directly in database for category: ${slug}, falling back to API`);
        }
      }
    } catch (dbError) {
      console.error('Error fetching directly from database:', dbError);
      // Continue to API fallback
    }
    
    // Fallback to API if direct DB access fails or returns no results
    // Use the correct API endpoint for job categories
    const apiUrl = `https://clickclickjob.vercel.app/api/jobs/?jobCategory=${slug}`;
    console.log('Fetching jobs for category:', slug, 'from:', apiUrl);
    
    // Use AbortController for timeout functionality
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    
    // Extract jobs from the response
    let jobs = [];
    if (Array.isArray(result)) {
      console.log('Result is an array with length:', result.length);
      jobs = result;
    } else if (result.jobs && Array.isArray(result.jobs)) {
      console.log('Result contains jobs array with length:', result.jobs.length);
      jobs = result.jobs;
    } else {
      console.warn('Unexpected API response format:', result);
      jobs = [];
    }
    
    // Ensure all jobs are properly serialized for Next.js static generation
    const serializedJobs = jobs.map((job: any) => serializeJobForNextJS(job));
    
    // Filter out any mock/invalid jobs
    const validJobs = filterMockJobs(serializedJobs.filter((job: any) => isValidJob(job) && !isMockJob(job)));
    console.log(`After filtering, ${validJobs.length} valid jobs remain from API response`);
    
    // Get category description (preferred) or generate one
    const categoryDescription = categoryDescriptions[slug as keyof typeof categoryDescriptions] || createGenericCategory(slug);
    
    // Special code to ensure NO TechCorp jobs can ever be returned
    // This is a last layer of defense to ensure cached/static builds don't include mock jobs
    const finalSanitizedJobs = validJobs.filter((job: any) => {
      // Remove any remaining TechCorp jobs (absolute fallback) 
      if (job._id === 'job1' || 
          (job.company && job.company.includes('TechCorp')) || 
          (typeof job._id === 'string' && /^job\d+$/.test(job._id))) {
        return false;
      }
      return true;
    });
    
    // Include the job count from the API
    const categoryWithCount = {
      ...categoryDescription,
      count: finalSanitizedJobs.length
    };
    
    return {
      props: {
        category: categoryWithCount,
        jobs: finalSanitizedJobs,
        slug,
        hasJobs: finalSanitizedJobs.length > 0
      },
      revalidate: 60 * 10 // Revalidate every 10 minutes
    };
  } catch (error) {
    console.error(`Failed to fetch jobs for category ${slug}:`, error);
    
    // If API fetch fails, still return the page but with no jobs
    const categoryDescription = categoryDescriptions[slug as keyof typeof categoryDescriptions] || createGenericCategory(slug);
    
    return {
      props: {
        category: categoryDescription,
        jobs: [], // Empty array of jobs
        slug,
        hasJobs: false
      },
      revalidate: 60 * 5 // Retry more frequently if there was an error
    };
  }
};

export default CategoryPage; 