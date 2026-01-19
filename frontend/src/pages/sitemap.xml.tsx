import { GetServerSideProps } from 'next';
import { generateMainSitemap } from '../utils/sitemapGenerator';

// This component doesn't render anything - it's just for the sitemap generation
export default function Sitemap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
    
    // Generate the main sitemap XML
    const sitemapXML = generateMainSitemap({
      baseUrl,
      excludePatterns: [
        '/test',
        '/data-test',
        '/admin',
        '/api',
        '/_next',
        '/temp-deploy',
        '/build'
      ]
    });
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200'); // Cache for 24 hours
    
    // Write the XML to the response
    res.write(sitemapXML);
    res.end();
    
    return {
      props: {},
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a basic sitemap if there's an error
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.NEXT_PUBLIC_BASE_URL || 'https://clickclickjob.com'}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.write(basicSitemap);
    res.end();
    
    return {
      props: {},
    };
  }
}; 