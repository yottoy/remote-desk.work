import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../utils/mongodb';

interface Category {
  slug: string;
  updatedAt?: Date;
  createdAt?: Date;
}

interface Job {
  _id: string;
  uniqueIdentifier?: string;
  updatedAt?: Date;
  createdAt?: Date;
  title?: string;
  company?: string;
}

// Hardcoded category slugs that match the ones used in the category pages
const STATIC_CATEGORY_SLUGS = [
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
  'quality-assurance',
  'administrative-assistant'
];

const sitemapXml = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clickclickjob.com';

    // Try to connect to MongoDB
    let jobs: Job[] = [];
    let categories: Category[] = [];
    
    try {
      const { db } = await connectToDatabase();
      
      // Get jobs with EXACT SAME filtering as the jobs API to prevent orphan pages
      // This ensures sitemap only includes jobs that are actually accessible
      const filterConditions = [];
      
      // ENHANCED: More comprehensive remote job filtering (SAME AS JOBS API)
      // Focus on excluding jobs that require physical presence, travel, or specific locations
      filterConditions.push({
        $and: [
          // Basic job validity checks
          { description: { $exists: true, $nin: [null, ""] } },
          { title: { $exists: true, $nin: [null, ""] } },
          
          // Exclude jobs requiring transportation, travel, or mileage
          { description: { $not: { $regex: /(reliable transportation|valid driver|mileage reimbursement|travel.*to.*client|visit.*client|client.*home|client.*site|travel.*required|commute|driving.*to)/i } } },
          
          // Exclude jobs with clear on-site requirements
          { description: { $not: { $regex: /(on-site required|onsite required|in-person required|must work on-site|must work onsite|must work in-person|office attendance required|must commute to|relocation required|must relocate|physical presence required|work location.*in person|report.*to.*office|based.*in.*office)/i } } },
          
          // Exclude facility-based work locations
          { description: { $not: { $regex: /(work.*at.*our.*location|work.*at.*facility|work.*at.*center|work.*at.*clinic|work.*at.*hospital|work.*at.*store|work.*at.*warehouse)/i } } },
          
          // Exclude jobs with on-site indicators in title
          { title: { $not: { $regex: /(on-site only|onsite only|in-person only|office based only)/i } } },
          
          // NEW: Exclude reception and client-facing jobs that require physical presence
          { description: { $not: { $regex: /(reception area|reception desk|front desk|greet.*client|welcome.*client|check.*in.*client|check.*out.*client|reception duties|receptionist role|reception work|office reception|clinic reception|hospital reception|front office|customer service desk|client reception|visitor reception)/i } } },
          
          // NEW: Exclude jobs with physical workplace indicators
          { description: { $not: { $regex: /(our office|the office|office hours|office environment|come to work|report to work|work schedule.*monday.*friday|office location|physical office|corporate office|main office|branch office|headquarters)/i } } },
          
          // NEW: Exclude medical/clinical jobs requiring physical presence  
          { description: { $not: { $regex: /(animal clinic|veterinary clinic|medical clinic|dental office|doctor office|practice location|clinic location|hospital floor|patient care|clinical setting|medical facility|healthcare facility|examination room)/i } } },
          
          // NEW: Exclude retail and service jobs
          { description: { $not: { $regex: /(retail location|store location|service center|customer location|work site|job site|construction site|manufacturing plant|warehouse location|distribution center|call center location)/i } } },
          
          // NEW: Exclude jobs with specific workplace hazards (indicating physical work)
          { description: { $not: { $regex: /(exposed to.*bite|exposed to.*scratch|animal waste|unpleasant odor|physical demand|lifting.*pound|standing.*hour|walking.*mile|safety equipment|protective equipment)/i } } },
          
          // Exclude jobs with specific address patterns (street addresses)
          { location: { $not: { $regex: /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr|lane|ln|way|court|ct|circle|cir|place|pl)/i } } },
          
          // Exclude jobs with specific city/state targeting that suggests in-person work
          { description: { $not: { $regex: /(cities targeting|targeting.*cities|serve.*cities|cover.*cities|work.*in.*[A-Z][a-z]+,\s*[A-Z]{2}|clients in.*[A-Z][a-z]+)/i } } }
        ]
      });
        
      // IMPORTANT: Add filters to exclude mock jobs (SAME AS JOBS API)
      filterConditions.push({
        $and: [
          // Exclude jobs with ID like "job1", "job2", etc.
          { _id: { $not: { $regex: /^job\d+$/ } } },
          // Explicitly block any TechCorp jobs
          { company: { $ne: "TechCorp Solutions" } },
          // Extra safety: block anything with TechCorp in the name
          { company: { $not: { $regex: /TechCorp/ } } },
          // Exclude jobs explicitly marked as mock
          { $or: [
              { isMock: { $ne: true } },
              { isMock: { $exists: false } }
            ]
          },
          // Exclude jobs with mock data flag
          { $or: [
              { is_mock_data: { $ne: true } },
              { is_mock_data: { $exists: false } }
            ]
          }
        ]
      });

      jobs = await db.collection('jobs').find({
        $and: filterConditions
      }, {
        projection: { 
          _id: 1, 
          uniqueIdentifier: 1,
          updatedAt: 1,
          createdAt: 1,
          title: 1,
          company: 1
        }
      }).limit(10000).toArray(); // Limit to 10,000 to keep sitemap size manageable
      
      // Further filter jobs to ensure they have valid identifiers
      jobs = jobs.filter((job: Job) => {
        const jobIdentifier = job.uniqueIdentifier || job._id;
        // Ensure the identifier exists and is not empty
        return jobIdentifier && jobIdentifier.toString().trim() !== '';
      });
      
      // Get categories if they exist
      try {
        categories = await db.collection('categories').find({}, {
          projection: {
            slug: 1,
            updatedAt: 1,
            createdAt: 1
          }
        }).toArray();
      } catch (error) {
        console.warn('Categories not found for sitemap', error);
      }
    } catch (error) {
      console.error('Database connection error for sitemap', error);
      // Fallback to empty arrays - will still output the static pages
    }

    // Static URLs with fixed priorities and change frequencies
    const staticUrls = [
      { url: '', changefreq: 'daily', priority: '1.0' },
      { url: 'jobs', changefreq: 'daily', priority: '0.9' },
      { url: 'about', changefreq: 'monthly', priority: '0.5' },
      { url: 'categories', changefreq: 'weekly', priority: '0.8' },
      { url: 'contact', changefreq: 'monthly', priority: '0.5' },
      { url: 'privacy-policy', changefreq: 'monthly', priority: '0.3' },
      { url: 'terms-of-service', changefreq: 'monthly', priority: '0.3' },
      { url: 'resources/remote-work-guide', changefreq: 'monthly', priority: '0.6' }
    ];
    
    // Start building the sitemap XML
    res.setHeader('Content-Type', 'text/xml');
    
    // Use a stream approach for better memory management with large numbers of URLs
    res.write('<?xml version="1.0" encoding="UTF-8"?>\n');
    res.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
    
    // Add static URLs
    staticUrls.forEach(page => {
      res.write(`  <url>\n`);
      res.write(`    <loc>${baseUrl}/${page.url}</loc>\n`);
      res.write(`    <changefreq>${page.changefreq}</changefreq>\n`);
      res.write(`    <priority>${page.priority}</priority>\n`);
      res.write(`  </url>\n`);
    });
    
    // Add database category URLs if available
    categories.forEach((category: Category) => {
      if (category.slug) {
        res.write(`  <url>\n`);
        res.write(`    <loc>${baseUrl}/categories/${category.slug}</loc>\n`);
        const lastmod = category.updatedAt || category.createdAt;
        if (lastmod) {
          res.write(`    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`);
        }
        res.write(`    <changefreq>weekly</changefreq>\n`);
        res.write(`    <priority>0.7</priority>\n`);
        res.write(`  </url>\n`);
      }
    });
    
    // Add hardcoded category URLs to ensure they're always included
    STATIC_CATEGORY_SLUGS.forEach((categorySlug: string) => {
      // Only add if it's not already included from the database
      const alreadyIncluded = categories.some(cat => cat.slug === categorySlug);
      if (!alreadyIncluded) {
        res.write(`  <url>\n`);
        res.write(`    <loc>${baseUrl}/categories/${categorySlug}</loc>\n`);
        res.write(`    <changefreq>weekly</changefreq>\n`);
        res.write(`    <priority>0.7</priority>\n`);
        res.write(`  </url>\n`);
      }
    });
    
    // Add job URLs - only valid jobs that won't redirect
    jobs.forEach((job: Job) => {
      // Use uniqueIdentifier if available, otherwise fall back to _id
      const jobIdentifier = job.uniqueIdentifier || job._id;
      if (jobIdentifier && jobIdentifier.toString().trim() !== '') {
        res.write(`  <url>\n`);
        res.write(`    <loc>${baseUrl}/jobs/${jobIdentifier}</loc>\n`);
        const lastmod = job.updatedAt || job.createdAt;
        if (lastmod) {
          res.write(`    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`);
        }
        res.write(`    <changefreq>weekly</changefreq>\n`);
        res.write(`    <priority>0.8</priority>\n`);
        res.write(`  </url>\n`);
      }
    });
    
    // Close the XML
    res.write('</urlset>');
    res.end();
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Provide a basic fallback sitemap with just the main pages
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clickclickjob.com';
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${baseUrl}/jobs</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
      <url>
        <loc>${baseUrl}/about</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
      </url>
      <url>
        <loc>${baseUrl}/categories</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>${baseUrl}/contact</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
      </url>
      <url>
        <loc>${baseUrl}/privacy-policy</loc>
        <changefreq>monthly</changefreq>
        <priority>0.3</priority>
      </url>
      <url>
        <loc>${baseUrl}/terms-of-service</loc>
        <changefreq>monthly</changefreq>
        <priority>0.3</priority>
      </url>
      <url>
        <loc>${baseUrl}/resources/remote-work-guide</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
      </url>` +
    STATIC_CATEGORY_SLUGS.map(slug => 
      `      <url>
        <loc>${baseUrl}/categories/${slug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>`
    ).join('\n') + `
    </urlset>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(500).send(fallbackSitemap);
  }
};

export default sitemapXml; 