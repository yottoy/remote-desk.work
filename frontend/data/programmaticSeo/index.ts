/**
 * Central export for all programmatic SEO data
 */

export * from './states';
export * from './categories';
export * from './modifiers';
export * from './contentTemplates';

// Re-export commonly used items
export { STATES, STATE_SLUGS, ALL_STATES, TIER_1_STATES, TIER_2_STATES, TIER_3_STATES } from './states';
export { CATEGORIES, CATEGORY_SLUGS, ALL_CATEGORIES } from './categories';
export { 
  EXPERIENCE_LEVELS, 
  EMPLOYMENT_TYPES, 
  EXPERIENCE_LEVEL_SLUGS,
  MODIFIER_SLUGS,
  getModifierInfo,
  isExperienceLevel,
  isEmploymentType
} from './modifiers';
export {
  generateIntroParagraphs,
  generateFAQs,
  generateRelatedLinks,
  generatePageMetadata,
  generateSalaryTable
} from './contentTemplates';
