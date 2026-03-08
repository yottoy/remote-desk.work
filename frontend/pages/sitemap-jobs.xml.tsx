import { GetServerSideProps } from 'next';
import { generateJobsSitemap } from '../utils/sitemapGenerator';
import { connectToDatabase } from '../utils/mongodb';

// This component doesn't render anything - it's just for the sitemap generation
export default function JobsSitemap() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';

    // Query DB directly to only include fresh, valid jobs
    // This avoids the API's pagination limit and ensures we filter by date
    let jobIds: string[] = [];

    try {
      const { db } = await connectToDatabase();

      if (db) {
        // Only include jobs posted within the last 60 days
        // This matches the noindex threshold in [id].tsx and prevents
        // stale jobs from appearing in the sitemap
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const jobs = await db.collection('jobs').find({
          // Must have basic required fields
          title: { $exists: true, $ne: null },
          company: { $exists: true, $ne: null },
          description: { $exists: true, $ne: null },
          // Only fresh jobs (posted within last 60 days)
          postedDate: { $gte: sixtyDaysAgo },
          // Exclude mock/test jobs
          _id: { $not: { $regex: /^job\d+$/ } },
          $and: [
            { company: { $ne: 'TechCorp Solutions' } },
            { $or: [{ isMock: { $ne: true } }, { isMock: { $exists: false } }] },
            { $or: [{ is_mock_data: { $ne: true } }, { is_mock_data: { $exists: false } }] },
          ]
        }, {
          projection: { _id: 1 },
        })
        .limit(10000)
        .toArray();

        jobIds = jobs.map((job: any) => job._id.toString());
        console.log(`Generated jobs sitemap with ${jobIds.length} fresh jobs (within 60 days)`);
      }
    } catch (dbError) {
      console.error('Error querying jobs for sitemap:', dbError);
      // Continue with empty jobIds array
    }

    // Generate the jobs sitemap XML
    const sitemapXML = generateJobsSitemap(baseUrl, jobIds);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800'); // Cache for 1 hour

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