import fs from 'fs';
import path from 'path';
import { getAllContent, ParsedContent } from './contentParser';

export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface SitemapOptions {
  baseUrl: string;
  excludePatterns?: string[];
  customEntries?: SitemapEntry[];
}

/**
 * Generates XML sitemap content from sitemap entries
 */
export function generateSitemapXML(entries: SitemapEntry[]): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  const footer = `</urlset>`;
  
  const urls = entries.map(entry => `
  <url>
    <loc>${escapeXML(entry.url)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`).join('');
  
  return header + urls + '\n' + footer;
}

/**
 * Generates sitemap index XML for multiple sitemaps
 */
export function generateSitemapIndexXML(sitemaps: Array<{url: string; lastmod: string}>): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  const footer = `</sitemapindex>`;
  
  const sitemapEntries = sitemaps.map(sitemap => `
  <sitemap>
    <loc>${escapeXML(sitemap.url)}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('');
  
  return header + sitemapEntries + '\n' + footer;
}

/**
 * Escapes XML special characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Gets the last modified date for a file
 */
function getLastModified(filePath: string): string {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Generates static page entries for the sitemap
 */
export function generateStaticPageEntries(baseUrl: string): SitemapEntry[] {
  const staticPages = [
    { path: '', priority: 1.0, changefreq: 'daily' as const },
    { path: '/jobs', priority: 0.9, changefreq: 'hourly' as const },
    { path: '/categories', priority: 0.8, changefreq: 'weekly' as const },
    { path: '/about', priority: 0.6, changefreq: 'monthly' as const },
    { path: '/contact', priority: 0.5, changefreq: 'monthly' as const },
    { path: '/privacy-policy', priority: 0.3, changefreq: 'yearly' as const },
    { path: '/terms-of-service', priority: 0.3, changefreq: 'yearly' as const },
    { path: '/newsletter', priority: 0.7, changefreq: 'weekly' as const }
  ];
  
  const today = new Date().toISOString().split('T')[0];
  
  return staticPages.map(page => ({
    url: `${baseUrl}${page.path}`,
    lastmod: today,
    changefreq: page.changefreq,
    priority: page.priority
  }));
}

/**
 * Generates job category page entries
 */
export function generateCategoryPageEntries(baseUrl: string): SitemapEntry[] {
  const categories = [
    'data-entry',
    'administrative',
    'administrative-assistant',
    'customer-service',
    'transcription',
    'virtual-assistant',
    'data-processing',
    'captioning',
    'customer-support',
    'bookkeeping',
    'content-writing',
    'social-media',
    'project-management',
    'quality-assurance'
  ];
  
  const today = new Date().toISOString().split('T')[0];
  
  return categories.map(category => ({
    url: `${baseUrl}/categories/${category}`,
    lastmod: today,
    changefreq: 'daily' as const,
    priority: 0.8
  }));
}

/**
 * Generates content page entries from docs/content
 */
export function generateContentPageEntries(baseUrl: string): SitemapEntry[] {
  const content = getAllContent();
  
  return content.map(item => {
    const lastmod = getLastModified(path.join(process.cwd(), item.filePath));
    
    return {
      url: `${baseUrl}/resources/${item.slug}`,
      lastmod,
      changefreq: 'monthly' as const,
      priority: 0.7
    };
  });
}

/**
 * Generates job listing page entries (placeholder for dynamic job pages)
 */
export function generateJobPageEntries(baseUrl: string, jobIds: string[]): SitemapEntry[] {
  const today = new Date().toISOString().split('T')[0];
  
  return jobIds.map(jobId => ({
    url: `${baseUrl}/jobs/view/${jobId}`,
    lastmod: today,
    changefreq: 'weekly' as const,
    priority: 0.6
  }));
}

/**
 * Generates keyword-based landing page entries
 */
export function generateKeywordPageEntries(baseUrl: string): SitemapEntry[] {
  const keywordPages = [
    // Original keyword pages
    'remote-data-entry-jobs-no-experience',
    'online-administrative-jobs-no-scams',
    'work-from-anywhere-data-entry-positions',
    'virtual-assistant-jobs-part-time-remote',
    // New SEO landing pages (December 2025)
    'part-time-remote-admin-jobs',
    'data-processing-jobs-remote',
    'work-from-home-administrative-jobs',
    'remote-captioning-jobs',
    'remote-school-administrative-jobs',
    'remote-medical-administrative-jobs',
    'remote-proofreading-jobs',
    'usps-remote-jobs',
    'remote-admin-jobs-texas',
    'remote-jobs-near-me'
  ];
  
  const today = new Date().toISOString().split('T')[0];
  
  return keywordPages.map(keyword => ({
    url: `${baseUrl}/${keyword}`,
    lastmod: today,
    changefreq: 'weekly' as const,
    priority: 0.8
  }));
}

/**
 * Generates the main sitemap with all static and content pages
 */
export function generateMainSitemap(options: SitemapOptions): string {
  const { baseUrl, excludePatterns = [], customEntries = [] } = options;
  
  let entries: SitemapEntry[] = [
    ...generateStaticPageEntries(baseUrl),
    ...generateCategoryPageEntries(baseUrl),
    ...generateContentPageEntries(baseUrl),
    ...generateKeywordPageEntries(baseUrl),
    ...customEntries
  ];
  
  // Filter out excluded patterns
  if (excludePatterns.length > 0) {
    entries = entries.filter(entry => {
      return !excludePatterns.some(pattern => 
        entry.url.includes(pattern)
      );
    });
  }
  
  // Sort by priority (highest first) and then by URL
  entries.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return a.url.localeCompare(b.url);
  });
  
  return generateSitemapXML(entries);
}

/**
 * Generates a job-specific sitemap (for dynamic job listings)
 */
export function generateJobsSitemap(baseUrl: string, jobIds: string[]): string {
  const entries = generateJobPageEntries(baseUrl, jobIds);
  return generateSitemapXML(entries);
}

/**
 * Generates the sitemap index that points to all sitemaps
 */
export function generateMainSitemapIndex(baseUrl: string): string {
  const today = new Date().toISOString().split('T')[0];
  
  const sitemaps = [
    {
      url: `${baseUrl}/sitemap.xml`,
      lastmod: today
    },
    {
      url: `${baseUrl}/sitemap-jobs.xml`,
      lastmod: today
    }
  ];
  
  return generateSitemapIndexXML(sitemaps);
}

/**
 * Validates sitemap entries for common issues
 */
export function validateSitemapEntries(entries: SitemapEntry[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check for duplicate URLs
  const urls = entries.map(e => e.url);
  const duplicates = urls.filter((url, index) => urls.indexOf(url) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate URLs found: ${duplicates.join(', ')}`);
  }
  
  // Check URL format
  entries.forEach((entry, index) => {
    if (!entry.url.startsWith('http')) {
      errors.push(`Entry ${index}: URL must start with http/https`);
    }
    
    if (entry.priority < 0 || entry.priority > 1) {
      errors.push(`Entry ${index}: Priority must be between 0 and 1`);
    }
    
    // Check lastmod format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod)) {
      errors.push(`Entry ${index}: lastmod must be in YYYY-MM-DD format`);
    }
  });
  
  // Check total number of URLs (max 50,000 per sitemap)
  if (entries.length > 50000) {
    errors.push(`Too many URLs (${entries.length}). Max 50,000 per sitemap.`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generates robots.txt content with sitemap references
 */
export function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-jobs.xml

# Crawl-delay for polite crawling
Crawl-delay: 1

# Block admin and API paths
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /temp-deploy/
Disallow: /build/

# Block test and development pages
Disallow: /test
Disallow: /data-test
Disallow: /test-page
Disallow: /test-email-capture`;
} 