/**
 * MOCK DATA REMOVED
 * 
 * We&apos;ve removed all mock job data from the application as it&apos;s no longer needed.
 * All job data should now come from the live API endpoints.
 * 
 * This file contains only the category definitions without any mock job functionality.
 */

// Job categories (without mock count data)
export const jobCategories = [
  { name: 'Data Entry', slug: 'data-entry' },
  { name: 'Administrative', slug: 'administrative' },
  { name: 'Customer Support', slug: 'customer-service' },
  { name: 'Transcription', slug: 'transcription' },
  { name: 'Virtual Assistant', slug: 'virtual-assistant' },
  { name: 'Data Processing', slug: 'data-processing' },
  { name: 'Customer Service', slug: 'customer-service' },
  { name: 'Bookkeeping', slug: 'bookkeeping' },
  { name: 'Content Writing', slug: 'content-writing' },
  { name: 'Social Media', slug: 'social-media' },
  { name: 'Project Management', slug: 'project-management' },
  { name: 'Quality Assurance', slug: 'quality-assurance' }
];

// Category detail data (without mock job counts)
export const categoryDetails = {
  'data-entry': {
    name: 'Remote Data Entry Jobs',
    description: `Data entry jobs involve inputting information from various sources into company databases, spreadsheets, or other management systems. Remote data entry positions typically require accuracy, attention to detail, and moderate typing speed (usually 40-60 WPM).

These roles are popular among work-from-home seekers because they often require minimal qualifications and can be performed entirely remotely. Many data entry positions are entry-level, making them accessible for those with limited experience or who are just starting their remote work careers.

Companies typically pay between $14-20 per hour for data entry specialists, with experienced professionals commanding higher rates. While many positions are full-time, you&apos;ll also find numerous part-time and flexible schedule opportunities in this category.

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
  // Additional categories can be added as needed
};

// Get category by slug without mock jobs
export const getCategoryBySlug = (slug: string) => {
  console.warn('Using mock category data without jobs - all job data should come from the API');
  
  const category = categoryDetails[slug as keyof typeof categoryDetails];
  if (!category) {
    throw new Error(`Category with slug "${slug}" not found`);
  }
  
  // Return category info without any mock job counts
  const categoryInfo = jobCategories.find(c => c.slug === slug);
  
  return {
    ...category,
    slug,
    count: 0 // Default to 0 as we should get real counts from the API
  };
}; 