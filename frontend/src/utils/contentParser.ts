import fs from 'fs';
import path from 'path';
import { ArticleData, FAQItem } from './schemaGenerator';

export interface ContentMetadata {
  title: string;
  description: string;
  author?: string;
  date?: string;
  dateModified?: string;
  keywords?: string[];
  category?: string;
  image?: string;
  [key: string]: any;
}

export interface ParsedContent {
  metadata: ContentMetadata;
  content: string;
  slug: string;
  filePath: string;
}

/**
 * Parses markdown frontmatter and content
 */
export function parseMarkdownContent(filePath: string): ParsedContent | null {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    
    // Split frontmatter and content
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = fileContent.match(frontmatterRegex);
    
    let metadata: ContentMetadata = {
      title: '',
      description: ''
    };
    let content = fileContent;
    
    if (match) {
      // Parse YAML-like frontmatter
      const frontmatterText = match[1];
      const contentText = match[2];
      
      // Simple frontmatter parser
      const lines = frontmatterText.split('\n');
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
          metadata[key] = value;
        }
      }
      
      content = contentText;
    }
    
    // Extract title from first H1 if not in frontmatter
    if (!metadata.title) {
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        metadata.title = titleMatch[1];
      }
    }
    
    // Extract description from first paragraph if not in frontmatter
    if (!metadata.description) {
      const descMatch = content.match(/^(?!#)(.+)$/m);
      if (descMatch) {
        metadata.description = descMatch[1].substring(0, 160).trim();
      }
    }
    
    // Generate slug from filename
    const fileName = path.basename(filePath, path.extname(filePath));
    const slug = fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    return {
      metadata,
      content,
      slug,
      filePath
    };
  } catch (error) {
    console.error(`Error parsing markdown file ${filePath}:`, error);
    return null;
  }
}

/**
 * Extracts FAQ items from markdown content
 */
export function extractFAQsFromContent(content: string): FAQItem[] {
  const faqs: FAQItem[] = [];
  
  // Pattern to match Q&A format or FAQ sections
  const faqPatterns = [
    // Pattern: ## Question\nAnswer
    /^##\s+(.+?)\n\n(.+?)(?=\n##|\n#|\n\n$|$)/gm,
    // Pattern: **Q:** Question\n**A:** Answer
    /\*\*Q:\*\*\s*(.+?)\n\*\*A:\*\*\s*(.+?)(?=\n\*\*Q:\*\*|\n#|\n\n$|$)/gm,
    // Pattern: ### Question?\nAnswer
    /^###\s+(.+?\?)\n\n(.+?)(?=\n###|\n##|\n#|\n\n$|$)/gm
  ];
  
  for (const pattern of faqPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim().replace(/\n+/g, ' ').substring(0, 500);
      
      if (question && answer) {
        faqs.push({ question, answer });
      }
    }
  }
  
  return faqs;
}

/**
 * Scans the docs/content directory and returns all parsed content
 */
export function getAllContent(): ParsedContent[] {
  const contentDir = path.join(process.cwd(), 'docs', 'content');
  const content: ParsedContent[] = [];
  
  if (!fs.existsSync(contentDir)) {
    console.warn('Content directory not found:', contentDir);
    return content;
  }
  
  try {
    const files = fs.readdirSync(contentDir);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join('docs', 'content', file);
        const parsed = parseMarkdownContent(filePath);
        if (parsed) {
          content.push(parsed);
        }
      }
    }
  } catch (error) {
    console.error('Error reading content directory:', error);
  }
  
  return content;
}

/**
 * Converts parsed content to ArticleData format for schema generation
 */
export function contentToArticleData(parsedContent: ParsedContent, baseUrl: string): ArticleData {
  const { metadata, content, slug } = parsedContent;
  
  return {
    title: metadata.title,
    description: metadata.description,
    author: metadata.author || 'ClickClickJob Editorial Team',
    datePublished: metadata.date || new Date().toISOString().split('T')[0],
    dateModified: metadata.dateModified || metadata.date || new Date().toISOString().split('T')[0],
    content: content,
    url: `${baseUrl}/resources/${slug}`,
    image: metadata.image || `${baseUrl}/images/articles/${slug}-cover.jpg`,
    keywords: metadata.keywords || extractKeywordsFromContent(content)
  };
}

/**
 * Extracts relevant keywords from content
 */
export function extractKeywordsFromContent(content: string): string[] {
  const commonKeywords = [
    'remote work', 'data entry', 'administrative', 'work from home',
    'virtual assistant', 'entry level', 'part time', 'full time',
    'customer service', 'transcription', 'data processing',
    'online jobs', 'telecommute', 'flexible schedule'
  ];
  
  const contentLower = content.toLowerCase();
  const foundKeywords = commonKeywords.filter(keyword => 
    contentLower.includes(keyword)
  );
  
  // Add some general keywords if not enough found
  if (foundKeywords.length < 5) {
    foundKeywords.push('remote jobs', 'online work', 'career opportunities');
  }
  
  return foundKeywords.slice(0, 10); // Limit to 10 keywords
}

/**
 * Generates URL-friendly slugs from titles
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extracts meta information from weekly market insights
 */
export function parseMarketInsights(content: string): {
  jobCount: number;
  analysisDate: string;
  keyTrends: string[];
  salaryData: Array<{category: string, increase: string, average: string}>;
} {
  const jobCountMatch = content.match(/(\d{1,3}(?:,\d{3})*)\s+(?:remote\s+)?(?:administrative\s+)?job\s*postings?/i);
  const jobCount = jobCountMatch ? parseInt(jobCountMatch[1].replace(/,/g, '')) : 0;
  
  const dateMatch = content.match(/(?:May|June|July|August|September|October|November|December|January|February|March|April)[\s-]+(?:June|July|August|September|October|November|December|January|February|March|April|May)?\s+\d{4}/i);
  const analysisDate = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
  
  // Extract key trends from bullet points or numbered lists
  const trendMatches = content.match(/^[\s]*[-*]\s*(.+)$/gm) || content.match(/^\d+\.\s*(.+)$/gm) || [];
  const keyTrends = trendMatches.slice(0, 5).map(trend => trend.replace(/^[\s]*[-*\d.]\s*/, '').trim());
  
  // Extract salary data
  const salaryData: Array<{category: string, increase: string, average: string}> = [];
  const salaryMatches = content.match(/\*\*(.+?):\*\*\s*(\d+%)\s*increase.*?Average:\s*\$([0-9,]+)/g);
  
  if (salaryMatches) {
    for (const match of salaryMatches) {
      const parts = match.match(/\*\*(.+?):\*\*\s*(\d+%)\s*increase.*?Average:\s*\$([0-9,]+)/);
      if (parts) {
        salaryData.push({
          category: parts[1],
          increase: parts[2],
          average: `$${parts[3]}`
        });
      }
    }
  }
  
  return {
    jobCount,
    analysisDate,
    keyTrends,
    salaryData
  };
}

/**
 * Creates structured data for job category pages
 */
export function generateCategoryData(category: string, jobCount: number) {
  const categoryDescriptions: Record<string, string> = {
    'data-entry': 'Remote data entry positions requiring accurate typing and data processing skills',
    'administrative': 'Administrative support roles including virtual assistants and office coordination',
    'customer-service': 'Customer support positions handling inquiries and client communications',
    'transcription': 'Audio and video transcription jobs requiring excellent listening and typing skills',
    'virtual-assistant': 'Virtual assistant roles providing administrative support to businesses',
    'data-processing': 'Data processing and analysis positions requiring attention to detail'
  };
  
  const categoryTitles: Record<string, string> = {
    'data-entry': 'Remote Data Entry Jobs',
    'administrative': 'Remote Administrative Jobs',
    'customer-service': 'Remote Customer Service Jobs',
    'transcription': 'Remote Transcription Jobs',
    'virtual-assistant': 'Virtual Assistant Jobs',
    'data-processing': 'Remote Data Processing Jobs'
  };
  
  return {
    title: categoryTitles[category] || `Remote ${category.replace('-', ' ')} Jobs`,
    description: categoryDescriptions[category] || `Find remote ${category.replace('-', ' ')} opportunities`,
    jobCount,
    category
  };
} 