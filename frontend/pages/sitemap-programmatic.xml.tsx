import { GetServerSideProps } from 'next';
import { 
  CATEGORY_SLUGS, 
  STATE_SLUGS, 
  MODIFIER_SLUGS 
} from '../data/programmaticSeo';

function generateSiteMap(): string {
  const baseUrl = 'https://clickclickjob.com';
  const today = new Date().toISOString().split('T')[0];
  
  const urls: string[] = [];

  // 1. Category pages (5 pages)
  CATEGORY_SLUGS.forEach(category => {
    urls.push(`
    <url>
      <loc>${baseUrl}/jobs/${category}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>`);
  });

  // 2. Category + State pages (5 categories × 15 states = 75 pages)
  CATEGORY_SLUGS.forEach(category => {
    STATE_SLUGS.forEach(state => {
      urls.push(`
    <url>
      <loc>${baseUrl}/jobs/${category}/${state}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>`);
    });
  });

  // 3. Category + State + Modifier pages
  // Priority combinations for Phase 1 (75 pages)
  const priorityStates = ['texas', 'california', 'florida', 'new-york', 'georgia'];
  const priorityModifiers = ['entry-level', 'no-experience', 'part-time'];
  
  CATEGORY_SLUGS.forEach(category => {
    priorityStates.forEach(state => {
      priorityModifiers.forEach(modifier => {
        urls.push(`
    <url>
      <loc>${baseUrl}/jobs/${category}/${state}/${modifier}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
    </url>`);
      });
    });
  });

  // Add Tier 2 states for data-entry
  const tier2States = ['north-carolina', 'pennsylvania', 'ohio', 'illinois', 'michigan'];
  tier2States.forEach(state => {
    ['entry-level', 'no-experience', 'part-time'].forEach(modifier => {
      urls.push(`
    <url>
      <loc>${baseUrl}/jobs/data-entry/${state}/${modifier}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
    </url>`);
    });
  });

  // Add Tier 3 states for data-entry and virtual-assistant
  const tier3States = ['arizona', 'colorado', 'virginia', 'washington', 'tennessee'];
  tier3States.forEach(state => {
    ['data-entry', 'virtual-assistant'].forEach(category => {
      ['entry-level', 'no-experience'].forEach(modifier => {
        urls.push(`
    <url>
      <loc>${baseUrl}/jobs/${category}/${state}/${modifier}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`);
      });
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join('')}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const sitemap = generateSiteMap();

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default function SitemapProgrammatic() {
  // This component will never be rendered
  return null;
}
