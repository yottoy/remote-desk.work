/**
 * Content generation templates for programmatic SEO pages
 * These templates help create unique content for each page combination
 */

import { StateInfo } from './states';
import { CategoryInfo } from './categories';
import { ModifierInfo } from './modifiers';

/**
 * Generate unique introductory paragraphs for each page
 */
export function generateIntroParagraphs(
  category: CategoryInfo,
  state: StateInfo,
  modifier?: ModifierInfo,
  jobCount: number = 0
): { paragraph1: string; paragraph2: string } {
  
  // Paragraph 1: State + Category context
  const paragraph1 = `Finding remote ${category.name} work in ${state.name} offers unique advantages for job seekers. ${state.fact} With ${jobCount} active positions currently available, ${state.name} employers are actively hiring for ${category.name} roles that allow you to work from anywhere in the state—whether you're in ${state.cities}.`;

  // Paragraph 2: Category details + modifier context
  let paragraph2: string;
  
  if (modifier) {
    const modDescription = modifier.description.replace('{category}', category.name);
    paragraph2 = `These ${state.name} ${category.name} positions are ${modDescription}. ${modifier.requirements} The average salary for ${category.name} work in ${state.name} ranges from $${category.salaryAnnual[0].toLocaleString()} to $${category.salaryAnnual[1].toLocaleString()} annually`;
    
    // Add modifier-specific salary context
    if (modifier.slug.includes('entry') || modifier.slug.includes('no-experience') || modifier.slug.includes('beginner')) {
      paragraph2 += `, with entry-level positions typically starting at $${category.salaryHourly[0]}-$${category.salaryHourly[0] + 4} per hour`;
    } else if (modifier.slug === 'part-time') {
      const avgHourly = Math.round((category.salaryHourly[0] + category.salaryHourly[1]) / 2);
      const weeklyHours = 20;
      const monthlyEarnings = avgHourly * weeklyHours * 4;
      paragraph2 += `. Part-time positions working ${weeklyHours} hours per week typically yield $${monthlyEarnings.toLocaleString()} per month`;
    }
    paragraph2 += '.';
  } else {
    paragraph2 = `These ${state.name} ${category.name} positions include ${category.typicalDuties}. Most roles require proficiency in ${category.software}`;
    if (category.typingRequirement) {
      paragraph2 += ` and typing speeds of ${category.typingRequirement}`;
    }
    paragraph2 += `. The average salary ranges from $${category.salaryAnnual[0].toLocaleString()} to $${category.salaryAnnual[1].toLocaleString()} annually, depending on experience level and specialization.`;
  }

  return { paragraph1, paragraph2 };
}

/**
 * Generate FAQ section content
 */
export function generateFAQs(
  category: CategoryInfo,
  state: StateInfo,
  modifier?: ModifierInfo
): Array<{ question: string; answer: string }> {
  
  const faqs: Array<{ question: string; answer: string }> = [];

  // FAQ 1: How to get job with no experience
  faqs.push({
    question: `How do I get a ${category.name} job in ${state.name} with no experience?`,
    answer: `Focus on entry-level positions that offer training, highlight transferable skills like attention to detail and computer literacy, and consider obtaining certifications like ${category.certifications[0]}. Many ${state.name} employers offer paid training programs for remote ${category.name} positions. Start by applying to jobs marked "entry level" or "no experience required" and emphasize your willingness to learn and strong work ethic.`
  });

  // FAQ 2: Typing speed (for relevant categories)
  if (category.typingRequirement) {
    faqs.push({
      question: `What typing speed do I need for ${category.name} work?`,
      answer: `Most ${category.name} positions require ${category.typingRequirement} for entry-level roles. Experienced positions may require higher speeds (60-80 WPM). You can test and improve your typing speed using free tools like TypingTest.com, 10FastFingers.com, or Keybr.com. Regular practice with online typing tutors can help you reach the required speed within a few weeks of consistent effort.`
    });
  }

  // FAQ 3: Legitimacy concerns
  faqs.push({
    question: `Are remote ${category.name} jobs in ${state.name} legitimate?`,
    answer: `Yes, legitimate ${category.name} positions exist with reputable companies, but scams are common in the remote work field. Warning signs include requests for payment upfront, unclear job descriptions, promises of unrealistic earnings (e.g., "$5,000/week guaranteed"), or pressure to make immediate decisions. All jobs on ClickClickJob are verified and screened before posting. Legitimate employers never ask for money or sensitive financial information during the application process.`
  });

  // FAQ 4: Residency requirements
  const taxContext = state.taxInfo.includes('No state income tax') 
    ? `${state.name}'s lack of state income tax makes it particularly attractive for remote workers, as you'll keep more of your earnings.`
    : `${state.name} has ${state.taxInfo.toLowerCase()}, which affects how much you take home from your remote earnings.`;
  
  faqs.push({
    question: `Do I need to live in ${state.name} to apply for these jobs?`,
    answer: `Most positions listed require ${state.name} residency for tax and legal purposes. Employers typically need you to be a resident of the state where you're filing taxes, and many use state-specific payroll systems. Some companies hire from multiple states—always check individual job requirements. ${taxContext}`
  });

  // FAQ 5: Equipment requirements
  faqs.push({
    question: `What equipment do I need to work from home as a ${category.name} professional?`,
    answer: `Basic requirements include a reliable computer (Windows or Mac from the last 5 years), high-speed internet (minimum 25 Mbps download speed), and a quiet workspace. Most employers provide necessary software like ${category.software}. Some positions may require a headset with microphone for video calls or phone work. Initial equipment investment is typically $500-1,000 if starting from scratch, though many people already own suitable equipment.`
  });

  // FAQ 6: Earnings potential
  const hourlyLow = category.salaryHourly[0];
  const hourlyHigh = category.salaryHourly[1];
  const partTimeMonthlyLow = hourlyLow * 20 * 4;
  const partTimeMonthlyHigh = hourlyHigh * 20 * 4;
  
  faqs.push({
    question: `How much can I earn doing ${category.name} work in ${state.name}?`,
    answer: `${category.name} positions in ${state.name} typically pay $${hourlyLow}-$${hourlyHigh}/hour, depending on experience, industry, and specialization. Full-time work (40 hours/week) yields approximately $${category.salaryAnnual[0].toLocaleString()}-$${category.salaryAnnual[1].toLocaleString()} annually. Part-time positions working 20 hours per week would generate approximately $${partTimeMonthlyLow.toLocaleString()}-$${partTimeMonthlyHigh.toLocaleString()} per month before taxes. ${state.taxInfo.includes('No state income tax') ? `Since ${state.name} has no state income tax, you keep more of your earnings compared to high-tax states.` : ''}`
  });

  // Add modifier-specific FAQ if applicable
  if (modifier && modifier.slug === 'part-time') {
    faqs.push({
      question: `Can I work multiple part-time ${category.name} jobs simultaneously?`,
      answer: `Many remote workers successfully manage multiple part-time ${category.name} positions, provided there are no conflicts of interest and you can meet all deadlines. Always check employment agreements for any restrictions. Managing 2-3 part-time roles can provide income diversification and skills variety. Use scheduling tools and maintain clear boundaries between jobs to avoid burnout. Some employers prefer exclusive arrangements, so clarify expectations during the interview process.`
    });
  }

  return faqs;
}

/**
 * Generate related page links for internal linking
 */
export function generateRelatedLinks(
  currentCategory: string,
  currentState: string,
  modifier?: string,
  allCategories: string[] = [],
  allStates: StateInfo[] = []
): Array<{ text: string; url: string; description: string }> {
  
  const links: Array<{ text: string; url: string; description: string }> = [];

  // Link to parent category page
  links.push({
    text: `All ${currentCategory.replace(/-/g, ' ')} Jobs`,
    url: `/jobs/${currentCategory}`,
    description: `Browse nationwide ${currentCategory.replace(/-/g, ' ')} opportunities`
  });

  // Link to same category, different modifier (if modifier present)
  if (modifier === 'entry-level') {
    links.push({
      text: `No Experience ${currentCategory.replace(/-/g, ' ')} Jobs in ${currentState.replace(/-/g, ' ')}`,
      url: `/jobs/${currentCategory}/${currentState}/no-experience`,
      description: `Find beginner-friendly positions`
    });
    links.push({
      text: `Part Time ${currentCategory.replace(/-/g, ' ')} Jobs in ${currentState.replace(/-/g, ' ')}`,
      url: `/jobs/${currentCategory}/${currentState}/part-time`,
      description: `Flexible part-time opportunities`
    });
  } else if (modifier === 'part-time') {
    links.push({
      text: `Entry Level ${currentCategory.replace(/-/g, ' ')} Jobs in ${currentState.replace(/-/g, ' ')}`,
      url: `/jobs/${currentCategory}/${currentState}/entry-level`,
      description: `Start your career with entry-level roles`
    });
  } else if (!modifier) {
    links.push({
      text: `Entry Level ${currentCategory.replace(/-/g, ' ')} Jobs in ${currentState.replace(/-/g, ' ')}`,
      url: `/jobs/${currentCategory}/${currentState}/entry-level`,
      description: `Entry-level opportunities`
    });
    links.push({
      text: `Part Time ${currentCategory.replace(/-/g, ' ')} Jobs in ${currentState.replace(/-/g, ' ')}`,
      url: `/jobs/${currentCategory}/${currentState}/part-time`,
      description: `Flexible schedules`
    });
  }

  // Link to same category in nearby/related states
  const statesByPopularity = ['texas', 'california', 'florida', 'new-york', 'georgia'];
  const nearbyStates = statesByPopularity
    .filter(s => s !== currentState)
    .slice(0, 2);
  
  nearbyStates.forEach(state => {
    const stateName = state.replace(/-/g, ' ');
    const formattedStateName = stateName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    links.push({
      text: `${currentCategory.replace(/-/g, ' ')} Jobs in ${formattedStateName}`,
      url: `/jobs/${currentCategory}/${state}`,
      description: `Explore opportunities in ${formattedStateName}`
    });
  });

  // Link to different categories in same state
  const categoryAlternatives: Record<string, string[]> = {
    'data-entry': ['virtual-assistant', 'transcription'],
    'virtual-assistant': ['data-entry', 'customer-service'],
    'customer-service': ['virtual-assistant', 'data-entry'],
    'transcription': ['data-entry', 'virtual-assistant'],
    'bookkeeping': ['data-entry', 'virtual-assistant']
  };

  const altCategories = categoryAlternatives[currentCategory] || [];
  altCategories.forEach(cat => {
    const categoryName = cat.replace(/-/g, ' ');
    const formattedCategoryName = categoryName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    links.push({
      text: `${formattedCategoryName} Jobs in ${currentState.replace(/-/g, ' ')}`,
      url: `/jobs/${cat}/${currentState}`,
      description: `Explore ${categoryName} roles`
    });
  });

  return links.slice(0, 8); // Limit to 8 links
}

/**
 * Generate page metadata for SEO
 */
export interface PageMetadata {
  title: string;
  description: string;
  canonical: string;
  h1: string;
  breadcrumbs: Array<{ name: string; url: string }>;
}

export function generatePageMetadata(
  category: CategoryInfo,
  state: StateInfo,
  modifier: ModifierInfo | null,
  jobCount: number,
  baseUrl: string = 'https://clickclickjob.com'
): PageMetadata {
  
  const currentYear = new Date().getFullYear();
  const modifierText = modifier ? `${modifier.name} ` : '';
  const stateName = state.name;
  const categoryName = category.name;

  // Title tag (under 60 characters)
  const title = `${jobCount} ${modifierText}${categoryName} Jobs in ${stateName} ${currentYear} | ClickClickJob`;

  // Meta description (under 160 characters)
  const description = `Find ${modifierText.toLowerCase()}${categoryName.toLowerCase()} jobs in ${stateName}. ${jobCount} remote positions available. ${modifier ? modifier.benefits.split(',')[0] : 'Apply today'}.`;

  // H1 tag
  const h1 = `${jobCount} ${modifierText}${categoryName} Jobs in ${stateName} - Hiring Now`;

  // Canonical URL
  const urlParts = ['/jobs', category.slug, state.slug];
  if (modifier) urlParts.push(modifier.slug);
  const canonical = `${baseUrl}${urlParts.join('/')}`;

  // Breadcrumbs
  const breadcrumbs = [
    { name: 'Home', url: baseUrl },
    { name: 'Jobs', url: `${baseUrl}/jobs` },
    { name: categoryName, url: `${baseUrl}/jobs/${category.slug}` },
    { name: stateName, url: `${baseUrl}/jobs/${category.slug}/${state.slug}` }
  ];

  if (modifier) {
    breadcrumbs.push({
      name: modifier.name,
      url: canonical
    });
  }

  return {
    title,
    description,
    canonical,
    h1,
    breadcrumbs
  };
}

/**
 * Generate salary table data
 */
export interface SalaryRow {
  experienceLevel: string;
  hourlyRate: string;
  annualSalary: string;
}

export function generateSalaryTable(category: CategoryInfo, state: StateInfo): SalaryRow[] {
  const [minHourly, maxHourly] = category.salaryHourly;
  const [minAnnual, maxAnnual] = category.salaryAnnual;

  return [
    {
      experienceLevel: 'Entry Level (0-1 year)',
      hourlyRate: `$${minHourly}-$${minHourly + 4}/hour`,
      annualSalary: `$${minAnnual.toLocaleString()}-$${Math.round(minAnnual * 1.3).toLocaleString()}/year`
    },
    {
      experienceLevel: 'Experienced (2-3 years)',
      hourlyRate: `$${minHourly + 4}-$${maxHourly - 3}/hour`,
      annualSalary: `$${Math.round(minAnnual * 1.3).toLocaleString()}-$${Math.round(maxAnnual * 0.85).toLocaleString()}/year`
    },
    {
      experienceLevel: 'Senior (4+ years)',
      hourlyRate: `$${maxHourly - 3}-$${maxHourly + 5}/hour`,
      annualSalary: `$${Math.round(maxAnnual * 0.85).toLocaleString()}-$${Math.round(maxAnnual * 1.2).toLocaleString()}/year`
    }
  ];
}
