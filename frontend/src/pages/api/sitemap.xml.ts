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
}

const sitemapXml = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://clickclickjob.com';

    // Try to connect to MongoDB
    let jobs: Job[] = [];
    let categories: Category[] = [];
    
    try {
      const { db } = await connectToDatabase();
      
      // Get jobs with minimal fields needed for sitemap
      jobs = await db.collection('jobs').find({}, {
        projection: { 
          _id: 1, 
          uniqueIdentifier: 1,
          updatedAt: 1,
          createdAt: 1
        }
      }).limit(10000).toArray(); // Limit to 10,000 to keep sitemap size manageable
      
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
      { url: 'about', changefreq: 'monthly', priority: '0.5' }
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
    
    // Add category URLs if available
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
    
    // Add job URLs
    jobs.forEach((job: Job) => {
      // Use uniqueIdentifier if available, otherwise fall back to _id
      const jobIdentifier = job.uniqueIdentifier || job._id;
      if (jobIdentifier) {
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
    </urlset>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.write(fallbackSitemap);
    res.end();
  }
};

export default sitemapXml; 