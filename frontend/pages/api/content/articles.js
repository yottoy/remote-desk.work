import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'clickclickjob';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    // Mock articles data with realistic content management structure
    const articles = [
      {
        id: 'art_001',
        title: 'Remote Administrative Jobs: A Complete Guide for 2025',
        content: 'The landscape of remote administrative work has evolved significantly...',
        status: 'published',
        author: 'Editorial Team',
        created_at: new Date('2025-01-15').toISOString(),
        updated_at: new Date('2025-01-20').toISOString(),
        content_type: 'guide',
        workflow_status: 'approved',
        seo_metadata: {
          meta_title: 'Remote Admin Jobs 2025 | Complete Guide | ClickClickJob',
          meta_description: 'Discover the best remote administrative job opportunities in 2025. Complete guide with salary data, requirements, and top employers.',
          keywords: ['remote admin jobs', 'administrative assistant', 'work from home']
        },
        engagement_metrics: {
          views: 2847,
          time_on_page: 245,
          scroll_depth: 78
        }
      },
      {
        id: 'art_002',
        title: 'Weekly Job Market Insights: January 2025',
        content: 'This week we analyzed 1,250 new remote job postings...',
        status: 'published',
        author: 'Data Analytics Team',
        created_at: new Date('2025-01-22').toISOString(),
        updated_at: new Date('2025-01-22').toISOString(),
        content_type: 'weekly_insights',
        workflow_status: 'approved',
        seo_metadata: {
          meta_title: 'Weekly Remote Job Market Report | ClickClickJob',
          meta_description: 'Latest remote job market trends and insights for administrative professionals.',
          keywords: ['job market trends', 'remote jobs report', 'employment data']
        },
        engagement_metrics: {
          views: 1523,
          time_on_page: 156,
          scroll_depth: 65
        }
      },
      {
        id: 'art_003',
        title: 'Editor\'s Pick: Top 5 Entry-Level Remote Positions',
        content: 'Our editorial team has curated the best entry-level opportunities...',
        status: 'published',
        author: 'Senior Editor',
        created_at: new Date('2025-01-18').toISOString(),
        updated_at: new Date('2025-01-19').toISOString(),
        content_type: 'editors_pick',
        workflow_status: 'approved',
        featured: true,
        seo_metadata: {
          meta_title: 'Best Entry-Level Remote Jobs | Editor\'s Choice | ClickClickJob',
          meta_description: 'Hand-picked entry-level remote job opportunities by our editorial experts.',
          keywords: ['entry level remote jobs', 'beginner remote work', 'no experience remote']
        },
        engagement_metrics: {
          views: 3421,
          time_on_page: 198,
          scroll_depth: 82
        }
      }
    ];

    // Apply filters if provided
    const { status, content_type, author, limit = 10 } = req.query;
    let filteredArticles = [...articles];

    if (status) filteredArticles = filteredArticles.filter(a => a.status === status);
    if (content_type) filteredArticles = filteredArticles.filter(a => a.content_type === content_type);
    if (author) filteredArticles = filteredArticles.filter(a => a.author.toLowerCase().includes(author.toLowerCase()));

    const limitedArticles = filteredArticles.slice(0, parseInt(limit));

    await client.close();

    res.status(200).json({
      success: true,
      articles: limitedArticles,
      total: filteredArticles.length,
      metadata: {
        total_published: articles.filter(a => a.status === 'published').length,
        content_types: [...new Set(articles.map(a => a.content_type))],
        authors: [...new Set(articles.map(a => a.author))],
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Content API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch articles',
      success: false 
    });
  }
} 