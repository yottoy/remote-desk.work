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
    const { period = '30d', content_type, metric } = req.query;

    // Mock comprehensive analytics data
    const analyticsData = {
      overview: {
        total_page_views: 15847,
        unique_visitors: 8934,
        avg_session_duration: 245,
        bounce_rate: 0.34,
        conversion_rate: 0.045,
        period: period
      },
      content_performance: [
        {
          title: 'Remote Administrative Jobs: Complete Guide',
          views: 3421,
          unique_views: 2876,
          avg_time_on_page: 245,
          scroll_depth: 82,
          social_shares: 45,
          content_type: 'guide',
          quality_score: 8.7
        },
        {
          title: 'Weekly Job Market Insights',
          views: 2847,
          unique_views: 2456,
          avg_time_on_page: 198,
          scroll_depth: 75,
          social_shares: 23,
          content_type: 'weekly_insights',
          quality_score: 7.9
        },
        {
          title: 'Entry-Level Remote Positions',
          views: 1523,
          unique_views: 1398,
          avg_time_on_page: 156,
          scroll_depth: 65,
          social_shares: 12,
          content_type: 'editors_pick',
          quality_score: 8.2
        }
      ],
      traffic_sources: {
        organic_search: 0.62,
        direct: 0.23,
        social_media: 0.08,
        referral: 0.05,
        email: 0.02
      },
      top_keywords: [
        { keyword: 'remote data entry jobs', impressions: 12450, clicks: 890, position: 3.2 },
        { keyword: 'work from home admin', impressions: 8765, clicks: 654, position: 4.1 },
        { keyword: 'virtual assistant jobs', impressions: 6543, clicks: 432, position: 5.8 }
      ],
      user_engagement: {
        pages_per_session: 2.8,
        new_vs_returning: {
          new_users: 0.68,
          returning_users: 0.32
        },
        device_breakdown: {
          desktop: 0.45,
          mobile: 0.42,
          tablet: 0.13
        }
      },
      job_alert_metrics: {
        total_subscriptions: 1247,
        weekly_signups: 89,
        email_open_rate: 0.34,
        click_through_rate: 0.12,
        unsubscribe_rate: 0.02
      },
      seo_metrics: {
        average_position: 4.2,
        total_impressions: 45672,
        total_clicks: 3421,
        ctr: 0.075,
        indexed_pages: 28
      }
    };

    // Apply filters if provided
    let responseData = { ...analyticsData };

    if (content_type) {
      responseData.content_performance = responseData.content_performance.filter(
        item => item.content_type === content_type
      );
    }

    if (metric) {
      // Return specific metric if requested
      const metricValue = getMetricValue(analyticsData, metric);
      if (metricValue !== null) {
        responseData = { metric, value: metricValue, period };
      }
    }

    res.status(200).json({
      success: true,
      data: responseData,
      generated_at: new Date().toISOString(),
      period: period
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch analytics data'
    });
  }
}

function getMetricValue(data, metric) {
  switch (metric) {
    case 'page_views':
      return data.overview.total_page_views;
    case 'unique_visitors':
      return data.overview.unique_visitors;
    case 'bounce_rate':
      return data.overview.bounce_rate;
    case 'conversion_rate':
      return data.overview.conversion_rate;
    case 'subscriptions':
      return data.job_alert_metrics.total_subscriptions;
    default:
      return null;
  }
} 