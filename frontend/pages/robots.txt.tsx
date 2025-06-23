import { GetServerSideProps } from 'next';
import { generateRobotsTxt } from '../utils/sitemapGenerator';

// This component doesn't render anything - it's just for the robots.txt generation
export default function RobotsTxt() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://clickclickjob.com';
    
    // Generate the robots.txt content
    const robotsTxt = generateRobotsTxt(baseUrl);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200'); // Cache for 24 hours
    
    // Write the robots.txt to the response
    res.write(robotsTxt);
    res.end();
    
    return {
      props: {},
    };
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    
    // Return a basic robots.txt if there's an error
    const basicRobots = `User-agent: *
Allow: /

Sitemap: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://clickclickjob.com'}/sitemap.xml`;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.write(basicRobots);
    res.end();
    
    return {
      props: {},
    };
  }
}; 