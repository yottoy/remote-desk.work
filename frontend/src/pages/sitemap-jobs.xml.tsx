import { GetServerSideProps } from 'next';
import { generateJobsSitemap } from '../utils/sitemapGenerator';

// This component doesn't render anything - it's just for the sitemap generation
export default function JobsSitemap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';
    
    // Fetch job IDs from the API
    let jobIds: string[] = [];
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/jobs`
        : (process.env.NODE_ENV === 'development'
          ? 'http://localhost:3004/api/jobs'
          : 'https://clickclickjob.vercel.app/api/jobs');
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'ClickClickJob-Sitemap/1.0'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        let jobs = [];
        
        if (Array.isArray(result)) {
          jobs = result;
        } else if (result.jobs && Array.isArray(result.jobs)) {
          jobs = result.jobs;
        }
        
        // Extract job IDs and filter out mock jobs
        jobIds = jobs
          .filter((job: any) => job && job._id && job.title && job.company)
          .filter((job: any) => job.company !== 'TechCorp Solutions')
          .filter((job: any) => !/^job\d+$/.test(job._id))
          .map((job: any) => job._id)
          .slice(0, 10000); // Limit to 10,000 jobs to avoid sitemap size issues
        
        console.log(`Generated jobs sitemap with ${jobIds.length} jobs`);
      }
    } catch (apiError) {
      console.error('Error fetching jobs for sitemap:', apiError);
      // Continue with empty jobIds array
    }
    
    // Generate the jobs sitemap XML
    const sitemapXML = generateJobsSitemap(baseUrl, jobIds);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Cache for 5 minutes to ensure freshness after job deletions
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=1800');
    
    // Write the XML to the response
    res.write(sitemapXML);
    res.end();
    
    return {
      props: {},
    };
  } catch (error) {
    console.error('Error generating jobs sitemap:', error);
    
    // Return a basic sitemap if there's an error
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.NEXT_PUBLIC_BASE_URL || 'https://clickclickjob.com'}/jobs</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
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