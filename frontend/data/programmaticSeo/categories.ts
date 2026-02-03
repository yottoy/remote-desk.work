/**
 * Job category data for programmatic SEO pages
 * Each category includes salary data, skills, and unique descriptions
 */

export interface CategoryInfo {
  slug: string;
  name: string;
  description: string;
  typicalDuties: string;
  software: string;
  typingRequirement?: string;
  salaryHourly: [number, number]; // [min, max]
  salaryAnnual: [number, number]; // [min, max]
  growthOutlook: string;
  certifications: string[];
  skills: string[];
  remoteRatio: number; // Percentage of roles that are remote-friendly
  totalMonthlyVolume: [number, number]; // [min, max] monthly searches
  remoteMonthlyVolume: [number, number]; // [min, max] monthly searches for remote variants
  keywordDifficulty: number; // Average KD percentage
  subNiches?: Array<{
    name: string;
    volume: [number, number];
    difficulty: number;
  }>;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  'data-entry': {
    slug: 'data-entry',
    name: 'Data Entry',
    description: 'entering information into databases and computer systems with accuracy and efficiency',
    typicalDuties: 'typing data from source documents, maintaining accurate records, verifying data for accuracy, and updating database systems',
    software: 'Microsoft Excel, Google Sheets, and company-specific database systems',
    typingRequirement: '40-60 words per minute',
    salaryHourly: [12, 21],
    salaryAnnual: [25000, 44000],
    growthOutlook: 'stable, with increasing remote opportunities as companies digitize operations',
    certifications: [
      'Microsoft Office Specialist (MOS)',
      'Certified Data Entry Specialist',
      'QuickBooks Certification (for data entry roles requiring bookkeeping)'
    ],
    skills: [
      'Typing speed of 40-60+ WPM',
      'Strong attention to detail and accuracy',
      'Basic computer literacy (Windows/Mac)',
      'Proficiency in Microsoft Office or Google Workspace',
      'Ability to follow instructions precisely',
      'Data validation and quality checking',
      '10-key proficiency (numeric keypad)',
      'Time management for remote work',
      'Basic understanding of data privacy',
      'Ability to work independently with minimal supervision'
    ],
    remoteRatio: 45,
    totalMonthlyVolume: [60000, 74000],
    remoteMonthlyVolume: [25000, 33000],
    keywordDifficulty: 40,
    subNiches: [
      {
        name: 'Medical Data Entry',
        volume: [5000, 8000],
        difficulty: 28
      },
      {
        name: 'Legal Data Entry',
        volume: [400, 600],
        difficulty: 22
      }
    ]
  },
  'virtual-assistant': {
    slug: 'virtual-assistant',
    name: 'Virtual Assistant',
    description: 'providing remote administrative, technical, or creative assistance to clients and businesses',
    typicalDuties: 'managing emails and calendars, scheduling appointments, handling customer inquiries, data entry, social media management, and various administrative tasks',
    software: 'Microsoft Office, Google Workspace, project management tools (Asana, Trello), CRM systems (Salesforce, HubSpot), and communication platforms (Slack, Zoom)',
    salaryHourly: [15, 30],
    salaryAnnual: [30000, 62000],
    growthOutlook: 'rapidly growing with 24% CAGR projected through 2026, driven by increased remote work adoption',
    certifications: [
      'Certified Virtual Assistant (CVA)',
      'Administrative Professional Certification',
      'Project Management Professional (PMP)',
      'Social Media Marketing Certification'
    ],
    skills: [
      'Excellent written and verbal communication',
      'Calendar and email management',
      'Proficiency in Microsoft Office and Google Workspace',
      'CRM software experience (Salesforce, HubSpot)',
      'Social media platform knowledge',
      'Basic bookkeeping and invoicing',
      'Project management skills',
      'Customer service excellence',
      'Time zone awareness and flexibility',
      'Self-motivation and proactive problem-solving',
      'Confidentiality and discretion',
      'Tech-savviness and quick learning ability'
    ],
    remoteRatio: 100,
    totalMonthlyVolume: [40000, 55000],
    remoteMonthlyVolume: [40000, 55000], // 100% remote by nature
    keywordDifficulty: 38
  },
  'customer-service': {
    slug: 'customer-service',
    name: 'Customer Service',
    description: 'assisting customers via phone, email, chat, or social media to resolve issues and ensure satisfaction',
    typicalDuties: 'responding to customer inquiries, troubleshooting problems, processing orders and returns, maintaining customer records, and escalating complex issues to supervisors',
    software: 'CRM systems (Zendesk, Salesforce, Freshdesk), ticketing systems, live chat platforms, and phone systems (VoIP)',
    salaryHourly: [13, 23],
    salaryAnnual: [27000, 48000],
    growthOutlook: 'steady growth with strong remote opportunities, particularly for entry-level positions',
    certifications: [
      'Customer Service Excellence Certification',
      'HDI Customer Service Representative',
      'Certified Customer Experience Professional (CCXP)',
      'Call Center Operations Certification'
    ],
    skills: [
      'Excellent verbal and written communication',
      'Active listening and empathy',
      'Problem-solving and critical thinking',
      'Patience and emotional resilience',
      'CRM and helpdesk software proficiency',
      'Multitasking and time management',
      'Conflict resolution skills',
      'Product knowledge retention',
      'Typing speed of 40+ WPM',
      'Professional phone etiquette',
      'Ability to handle difficult customers',
      'Knowledge base and documentation skills'
    ],
    remoteRatio: 40,
    totalMonthlyVolume: [110000, 135000],
    remoteMonthlyVolume: [40000, 50000],
    keywordDifficulty: 55
  },
  'transcription': {
    slug: 'transcription',
    name: 'Transcription',
    description: 'converting audio or video recordings into accurate written text documents',
    typicalDuties: 'listening to audio files, typing verbatim or edited transcripts, proofreading for accuracy, formatting documents, and meeting tight deadlines',
    software: 'transcription software (Express Scribe, oTranscribe), word processors (Microsoft Word, Google Docs), and audio/video players',
    typingRequirement: '60-80 words per minute with high accuracy',
    salaryHourly: [15, 28],
    salaryAnnual: [30000, 58000],
    growthOutlook: 'moderate growth with specialization (medical, legal) commanding higher rates',
    certifications: [
      'Registered Healthcare Documentation Specialist (RHDS)',
      'Certified Electronic Transcriber (CET)',
      'Legal Transcriptionist Certification',
      'General Transcription Certification'
    ],
    skills: [
      'Typing speed of 60-80+ WPM',
      'Exceptional listening skills',
      'Excellent grammar, spelling, and punctuation',
      'Attention to detail and accuracy',
      'Research skills for unfamiliar terminology',
      'Time management and deadline adherence',
      'Familiarity with style guides (APA, Chicago)',
      'Audio editing software knowledge',
      'Medical or legal terminology (for specialized roles)',
      'Proofreading and editing abilities',
      'Ability to understand various accents and speech patterns',
      'Confidentiality and HIPAA compliance (for medical)'
    ],
    remoteRatio: 67,
    totalMonthlyVolume: [22000, 30000],
    remoteMonthlyVolume: [15000, 20000],
    keywordDifficulty: 32,
    subNiches: [
      {
        name: 'Medical Transcription',
        volume: [5000, 8000],
        difficulty: 35
      },
      {
        name: 'Legal Transcription',
        volume: [1500, 2500],
        difficulty: 30
      }
    ]
  },
  'bookkeeping': {
    slug: 'bookkeeping',
    name: 'Bookkeeping',
    description: 'recording and organizing financial transactions for businesses and individuals',
    typicalDuties: 'recording daily transactions, reconciling bank statements, managing accounts payable and receivable, preparing financial reports, and assisting with tax preparation',
    software: 'QuickBooks, Xero, FreshBooks, Microsoft Excel, and accounting software specific to industries',
    salaryHourly: [18, 32],
    salaryAnnual: [38000, 67000],
    growthOutlook: 'steady growth with increasing demand for remote bookkeepers as small businesses seek flexible financial support',
    certifications: [
      'Certified Bookkeeper (CB) from AIPB',
      'QuickBooks Certified User',
      'Xero Certified Advisor',
      'Certified Public Bookkeeper (CPB)'
    ],
    skills: [
      'Proficiency in QuickBooks, Xero, or similar software',
      'Strong understanding of accounting principles',
      'Advanced Microsoft Excel skills',
      'Attention to detail and accuracy',
      'Mathematical aptitude',
      'Understanding of tax regulations',
      'Bank reconciliation expertise',
      'Accounts payable/receivable management',
      'Financial report preparation',
      'Confidentiality and ethical standards',
      'Analytical and problem-solving skills',
      'Communication skills for client interactions'
    ],
    remoteRatio: 60,
    totalMonthlyVolume: [20000, 28000],
    remoteMonthlyVolume: [12000, 18000],
    keywordDifficulty: 36
  }
};

// Helper arrays for easy iteration
export const ALL_CATEGORIES = Object.values(CATEGORIES);
export const CATEGORY_SLUGS = Object.keys(CATEGORIES);

// Category rankings by search volume
export const CATEGORIES_BY_VOLUME = [...ALL_CATEGORIES].sort(
  (a, b) => b.totalMonthlyVolume[0] - a.totalMonthlyVolume[0]
);

// Category rankings by keyword difficulty (easier first)
export const CATEGORIES_BY_DIFFICULTY = [...ALL_CATEGORIES].sort(
  (a, b) => a.keywordDifficulty - b.keywordDifficulty
);
