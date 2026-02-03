/**
 * Experience level and employment type modifiers for programmatic SEO pages
 */

export interface ModifierInfo {
  slug: string;
  name: string;
  description: string;
  targetAudience: string;
  requirements: string;
  benefits: string;
  searchVolume: [number, number]; // [min, max] monthly searches combined
}

export const EXPERIENCE_LEVELS: Record<string, ModifierInfo> = {
  'entry-level': {
    slug: 'entry-level',
    name: 'Entry Level',
    description: 'ideal for entry-level candidates with 0-2 years of experience',
    targetAudience: 'Recent graduates, career changers, and those new to the field',
    requirements: 'Most roles require only basic computer skills and typing ability, with full training provided on company-specific systems and processes',
    benefits: 'opportunity to build professional experience while working remotely, with structured training and mentorship',
    searchVolume: [60000, 100000]
  },
  'no-experience': {
    slug: 'no-experience',
    name: 'No Experience Required',
    description: 'specifically designed for candidates with no prior experience in this field',
    targetAudience: 'First-time job seekers, stay-at-home parents returning to work, those exploring new career paths, and complete beginners',
    requirements: 'No previous experience necessary—these employers provide comprehensive training and support to help you succeed',
    benefits: 'perfect starting point for building a remote career without the barrier of experience requirements',
    searchVolume: [30000, 60000]
  },
  'for-beginners': {
    slug: 'for-beginners',
    name: 'For Beginners',
    description: 'tailored for beginners who are just starting their career journey',
    targetAudience: 'Self-identified beginners, career explorers seeking guidance, and those wanting a supportive learning environment',
    requirements: 'Beginner-friendly positions with mentorship, training resources, and patient supervision to help you develop skills',
    benefits: 'supportive environment designed to help beginners develop professional skills and confidence',
    searchVolume: [10000, 25000]
  }
};

export const EMPLOYMENT_TYPES: Record<string, ModifierInfo> = {
  'part-time': {
    slug: 'part-time',
    name: 'Part Time',
    description: 'flexible positions typically requiring 15-30 hours per week',
    targetAudience: 'Parents, students, those with other commitments, or anyone seeking work-life balance and flexibility',
    requirements: 'Most part-time roles offer flexible scheduling, allowing you to work around other commitments while still earning competitive hourly rates',
    benefits: 'flexibility to balance work with family, education, or other pursuits while maintaining professional development',
    searchVolume: [80000, 150000]
  },
  'remote': {
    slug: 'remote',
    name: 'Remote',
    description: 'positions that allow you to work from anywhere with an internet connection',
    targetAudience: 'Anyone seeking location independence, elimination of commute time, and the flexibility to work from home or anywhere',
    requirements: 'Reliable internet connection (minimum 25 Mbps), quiet workspace, and basic home office setup',
    benefits: 'complete location independence, no commute, flexible environment, and better work-life integration',
    searchVolume: [100000, 200000]
  }
};

// Helper arrays
export const ALL_EXPERIENCE_LEVELS = Object.values(EXPERIENCE_LEVELS);
export const EXPERIENCE_LEVEL_SLUGS = Object.keys(EXPERIENCE_LEVELS);
export const ALL_EMPLOYMENT_TYPES = Object.values(EMPLOYMENT_TYPES);
export const EMPLOYMENT_TYPE_SLUGS = Object.keys(EMPLOYMENT_TYPES);

// Combined modifiers for URL generation
export type ModifierType = 'experience' | 'employment';

export interface CombinedModifier {
  slug: string;
  name: string;
  type: ModifierType;
  info: ModifierInfo;
}

export const ALL_MODIFIERS: CombinedModifier[] = [
  ...ALL_EXPERIENCE_LEVELS.map(info => ({
    slug: info.slug,
    name: info.name,
    type: 'experience' as ModifierType,
    info
  })),
  ...ALL_EMPLOYMENT_TYPES.map(info => ({
    slug: info.slug,
    name: info.name,
    type: 'employment' as ModifierType,
    info
  }))
];

export const MODIFIER_SLUGS = ALL_MODIFIERS.map(m => m.slug);

/**
 * Get modifier info by slug
 */
export function getModifierInfo(slug: string): ModifierInfo | null {
  return EXPERIENCE_LEVELS[slug] || EMPLOYMENT_TYPES[slug] || null;
}

/**
 * Check if a slug is an experience level
 */
export function isExperienceLevel(slug: string): boolean {
  return slug in EXPERIENCE_LEVELS;
}

/**
 * Check if a slug is an employment type
 */
export function isEmploymentType(slug: string): boolean {
  return slug in EMPLOYMENT_TYPES;
}
