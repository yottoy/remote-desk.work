const express = require('express');
const { ObjectId } = require('mongodb');
const database = require('../utils/database');
const authMiddleware = require('../middleware/authMiddleware');
const { asyncHandler, createValidationError, createNotFoundError, createBadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/analytics/overview
 * Get analytics overview dashboard
 */
router.get('/overview', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const daysInt = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysInt);

  if (!database.isConnected) {
    await database.connect();
  }

  // Get content analytics
  const contentCollection = database.db.collection('content');
  const analyticsCollection = database.db.collection('content_analytics');
  const jobsCollection = database.db.collection('jobs');

  // Content metrics
  const contentMetrics = await contentCollection.aggregate([
    {
      $group: {
        _id: null,
        totalContent: { $sum: 1 },
        publishedContent: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        totalViews: { $sum: '$viewCount' },
        totalLikes: { $sum: '$likeCount' },
        avgViewsPerContent: { $avg: '$viewCount' }
      }
    }
  ]).toArray();

  // Content by type
  const contentByType = await contentCollection.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        totalViews: { $sum: '$viewCount' }
      }
    }
  ]).toArray();

  // Recent content performance
  const recentContent = await contentCollection.find({
    publishedAt: { $gte: startDate },
    status: 'published'
  }).sort({ publishedAt: -1 }).limit(10).toArray();

  // Job metrics
  const jobMetrics = await jobsCollection.aggregate([
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        activeJobs: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] } },
        featuredJobs: { $sum: { $cond: ['$isFeatured', 1, 0] } }
      }
    }
  ]).toArray();

  // Analytics data for the period
  const analyticsData = await analyticsCollection.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          event: '$event'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        events: {
          $push: {
            event: '$_id.event',
            count: '$count'
          }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]).toArray();

  // SEO metrics
  const seoMetrics = await analyticsCollection.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        event: 'page_view'
      }
    },
    {
      $group: {
        _id: '$metadata.source',
        count: { $sum: 1 }
      }
    }
  ]).toArray();

  res.json({
    overview: {
      period: { days: daysInt, startDate, endDate: new Date() },
      content: contentMetrics.length > 0 ? contentMetrics[0] : null,
      contentByType,
      jobs: jobMetrics.length > 0 ? jobMetrics[0] : null,
      recentContent,
      analytics: analyticsData,
      seo: seoMetrics
    }
  });
}));

/**
 * GET /api/analytics/content/:id
 * Get detailed analytics for specific content
 */
router.get('/content/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { days = 30 } = req.query;

  if (!ObjectId.isValid(id)) {
    throw createBadRequestError('Invalid content ID');
  }

  const daysInt = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysInt);

  if (!database.isConnected) {
    await database.connect();
  }

  const contentCollection = database.db.collection('content');
  const analyticsCollection = database.db.collection('content_analytics');

  // Get content details
  const content = await contentCollection.findOne({ _id: new ObjectId(id) });
  if (!content) {
    throw createNotFoundError('Content');
  }

  // Get analytics for this content
  const analytics = await analyticsCollection.aggregate([
    {
      $match: {
        contentId: new ObjectId(id),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          event: '$event'
        },
        count: { $sum: 1 },
        totalTime: { $sum: '$metadata.timeOnPage' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        metrics: {
          $push: {
            event: '$_id.event',
            count: '$count',
            totalTime: '$totalTime'
          }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]).toArray();

  // Get traffic sources
  const trafficSources = await analyticsCollection.aggregate([
    {
      $match: {
        contentId: new ObjectId(id),
        timestamp: { $gte: startDate },
        event: 'page_view'
      }
    },
    {
      $group: {
        _id: '$metadata.source',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]).toArray();

  // Get referrers
  const referrers = await analyticsCollection.aggregate([
    {
      $match: {
        contentId: new ObjectId(id),
        timestamp: { $gte: startDate },
        event: 'page_view',
        'metadata.referrer': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$metadata.referrer',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]).toArray();

  // Calculate engagement metrics
  const engagementMetrics = await analyticsCollection.aggregate([
    {
      $match: {
        contentId: new ObjectId(id),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 },
        avgTimeOnPage: { $avg: '$metadata.timeOnPage' },
        avgScrollDepth: { $avg: '$metadata.scrollDepth' }
      }
    }
  ]).toArray();

  res.json({
    content: {
      id: content._id,
      title: content.title,
      type: content.type,
      publishedAt: content.publishedAt,
      viewCount: content.viewCount,
      likeCount: content.likeCount
    },
    analytics: {
      period: { days: daysInt, startDate, endDate: new Date() },
      dailyMetrics: analytics,
      trafficSources,
      referrers,
      engagement: engagementMetrics
    }
  });
}));

/**
 * GET /api/analytics/seo-performance
 * Get SEO performance metrics
 */
router.get('/seo-performance', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const daysInt = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysInt);

  if (!database.isConnected) {
    await database.connect();
  }

  const contentCollection = database.db.collection('content');
  const analyticsCollection = database.db.collection('content_analytics');
  const seoCollection = database.db.collection('seo_metrics');

  // Get SEO metrics by content
  const seoByContent = await seoCollection.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$contentId',
        avgPosition: { $avg: '$searchPosition' },
        impressions: { $sum: '$impressions' },
        clicks: { $sum: '$clicks' },
        ctr: { $avg: '$clickThroughRate' },
        keywords: { $addToSet: '$keyword' }
      }
    },
    {
      $lookup: {
        from: 'content',
        localField: '_id',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $unwind: '$content'
    },
    {
      $project: {
        title: '$content.title',
        type: '$content.type',
        slug: '$content.slug',
        avgPosition: 1,
        impressions: 1,
        clicks: 1,
        ctr: 1,
        keywordCount: { $size: '$keywords' }
      }
    },
    {
      $sort: { clicks: -1 }
    },
    {
      $limit: 20
    }
  ]).toArray();

  // Get top performing keywords
  const topKeywords = await seoCollection.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$keyword',
        avgPosition: { $avg: '$searchPosition' },
        impressions: { $sum: '$impressions' },
        clicks: { $sum: '$clicks' },
        ctr: { $avg: '$clickThroughRate' }
      }
    },
    {
      $sort: { clicks: -1 }
    },
    {
      $limit: 50
    }
  ]).toArray();

  // Get organic traffic trends
  const organicTraffic = await analyticsCollection.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        event: 'page_view',
        'metadata.source': 'organic'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        organicViews: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]).toArray();

  res.json({
    seoPerformance: {
      period: { days: daysInt, startDate, endDate: new Date() },
      contentPerformance: seoByContent,
      topKeywords,
      organicTraffic
    }
  });
}));

/**
 * GET /api/analytics/job-alerts
 * Get job alert system analytics
 */
router.get('/job-alerts', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const daysInt = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysInt);

  if (!database.isConnected) {
    await database.connect();
  }

  const alertsCollection = database.db.collection('job_alert_subscriptions');
  const logsCollection = database.db.collection('job_alert_logs');

  // Subscription metrics
  const subscriptionMetrics = await alertsCollection.aggregate([
    {
      $group: {
        _id: null,
        totalSubscriptions: { $sum: 1 },
        activeSubscriptions: { $sum: { $cond: ['$isActive', 1, 0] } },
        verifiedSubscriptions: { $sum: { $cond: ['$isVerified', 1, 0] } }
      }
    }
  ]).toArray();

  // Subscription growth over time
  const subscriptionGrowth = await alertsCollection.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        newSubscriptions: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]).toArray();

  // Email sending metrics
  const emailMetrics = await logsCollection.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        type: 'email_sent'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        emailsSent: { $sum: 1 },
        uniqueRecipients: { $addToSet: '$email' }
      }
    },
    {
      $project: {
        date: '$_id',
        emailsSent: 1,
        uniqueRecipients: { $size: '$uniqueRecipients' }
      }
    },
    {
      $sort: { date: 1 }
    }
  ]).toArray();

  // Preferences breakdown
  const preferencesBreakdown = await alertsCollection.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$frequency',
        count: { $sum: 1 }
      }
    }
  ]).toArray();

  res.json({
    jobAlerts: {
      period: { days: daysInt, startDate, endDate: new Date() },
      subscriptions: subscriptionMetrics.length > 0 ? subscriptionMetrics[0] : null,
      growth: subscriptionGrowth,
      emails: emailMetrics,
      preferences: preferencesBreakdown
    }
  });
}));

/**
 * GET /api/analytics/quality-metrics
 * Get content quality metrics
 */
router.get('/quality-metrics', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const daysInt = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysInt);

  if (!database.isConnected) {
    await database.connect();
  }

  const contentCollection = database.db.collection('content');
  const analyticsCollection = database.db.collection('content_analytics');
  const qualityCollection = database.db.collection('quality_metrics');

  // Content quality scores
  const qualityScores = await qualityCollection.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$contentId',
        avgReadability: { $avg: '$readabilityScore' },
        avgSeoScore: { $avg: '$seoScore' },
        avgEngagement: { $avg: '$engagementScore' },
        latestUpdate: { $max: '$timestamp' }
      }
    },
    {
      $lookup: {
        from: 'content',
        localField: '_id',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $unwind: '$content'
    },
    {
      $project: {
        title: '$content.title',
        type: '$content.type',
        status: '$content.status',
        avgReadability: 1,
        avgSeoScore: 1,
        avgEngagement: 1,
        overallScore: {
          $avg: ['$avgReadability', '$avgSeoScore', '$avgEngagement']
        },
        latestUpdate: 1
      }
    },
    {
      $sort: { overallScore: -1 }
    }
  ]).toArray();

  // Engagement quality by content type
  const engagementByType = await analyticsCollection.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        event: 'page_view'
      }
    },
    {
      $lookup: {
        from: 'content',
        localField: 'contentId',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $unwind: '$content'
    },
    {
      $group: {
        _id: '$content.type',
        avgTimeOnPage: { $avg: '$metadata.timeOnPage' },
        avgScrollDepth: { $avg: '$metadata.scrollDepth' },
        totalViews: { $sum: 1 }
      }
    }
  ]).toArray();

  // Bounce rate by content
  const bounceRates = await analyticsCollection.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          contentId: '$contentId',
          sessionId: '$sessionId'
        },
        events: { $push: '$event' },
        timeOnPage: { $max: '$metadata.timeOnPage' }
      }
    },
    {
      $group: {
        _id: '$_id.contentId',
        totalSessions: { $sum: 1 },
        bouncedSessions: {
          $sum: {
            $cond: [
              { $and: [{ $eq: [{ $size: '$events' }, 1] }, { $lt: ['$timeOnPage', 30] }] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        bounceRate: {
          $cond: [
            { $gt: ['$totalSessions', 0] },
            { $multiply: [{ $divide: ['$bouncedSessions', '$totalSessions'] }, 100] },
            0
          ]
        },
        totalSessions: 1
      }
    },
    {
      $lookup: {
        from: 'content',
        localField: '_id',
        foreignField: '_id',
        as: 'content'
      }
    },
    {
      $unwind: '$content'
    },
    {
      $project: {
        title: '$content.title',
        type: '$content.type',
        bounceRate: 1,
        totalSessions: 1
      }
    },
    {
      $sort: { bounceRate: 1 }
    }
  ]).toArray();

  res.json({
    qualityMetrics: {
      period: { days: daysInt, startDate, endDate: new Date() },
      contentQuality: qualityScores,
      engagementByType,
      bounceRates
    }
  });
}));

/**
 * POST /api/analytics/track-event
 * Track custom analytics event
 */
router.post('/track-event', asyncHandler(async (req, res) => {
  const {
    event,
    contentId,
    metadata = {},
    sessionId,
    userId
  } = req.body;

  // Validation
  if (!event || event.trim().length === 0) {
    throw createValidationError('Event name is required');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const analyticsCollection = database.db.collection('content_analytics');

  // Create analytics record
  const analyticsRecord = {
    event: event.trim(),
    contentId: contentId ? new ObjectId(contentId) : null,
    userId: userId ? new ObjectId(userId) : null,
    sessionId: sessionId || null,
    metadata: {
      ...metadata,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date()
    },
    timestamp: new Date()
  };

  await analyticsCollection.insertOne(analyticsRecord);

  res.json({
    message: 'Event tracked successfully'
  });
}));

/**
 * GET /api/analytics/export
 * Export analytics data
 */
router.get('/export', asyncHandler(async (req, res) => {
  const { 
    type = 'content',
    format = 'json',
    days = 30,
    contentId
  } = req.query;

  const daysInt = parseInt(days);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysInt);

  if (!database.isConnected) {
    await database.connect();
  }

  let data = [];

  if (type === 'content') {
    const analyticsCollection = database.db.collection('content_analytics');
    const query = { timestamp: { $gte: startDate } };
    
    if (contentId && ObjectId.isValid(contentId)) {
      query.contentId = new ObjectId(contentId);
    }

    data = await analyticsCollection.find(query).toArray();
  } else if (type === 'seo') {
    const seoCollection = database.db.collection('seo_metrics');
    data = await seoCollection.find({ timestamp: { $gte: startDate } }).toArray();
  } else if (type === 'jobs') {
    const jobsCollection = database.db.collection('jobs');
    data = await jobsCollection.find({ createdAt: { $gte: startDate } }).toArray();
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csvData = convertToCSV(data);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=analytics-${type}-${new Date().toISOString().split('T')[0]}.csv`
    });
    res.send(csvData);
  } else {
    res.json({
      data,
      metadata: {
        type,
        period: { days: daysInt, startDate, endDate: new Date() },
        recordCount: data.length
      }
    });
  }
}));

/**
 * Helper function to convert data to CSV
 */
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router; 