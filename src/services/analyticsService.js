const { ObjectId } = require('mongodb');
const database = require('../utils/database');
const logger = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the analytics service
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set up analytics collections and indexes
      await this.setupAnalyticsCollections();
      this.isInitialized = true;
      logger.info('Analytics Service initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize Analytics Service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set up analytics collections and indexes
   */
  async setupAnalyticsCollections() {
    if (!database.isConnected) {
      await database.connect();
    }

    const db = database.db;

    // Create indexes for better performance
    try {
      // Content analytics indexes
      await db.collection('content_analytics').createIndex({ contentId: 1, timestamp: -1 });
      await db.collection('content_analytics').createIndex({ event: 1, timestamp: -1 });
      await db.collection('content_analytics').createIndex({ sessionId: 1 });

      // SEO metrics indexes
      await db.collection('seo_metrics').createIndex({ contentId: 1, timestamp: -1 });
      await db.collection('seo_metrics').createIndex({ keyword: 1, timestamp: -1 });

      // Quality metrics indexes
      await db.collection('quality_metrics').createIndex({ contentId: 1, timestamp: -1 });

      logger.info('Analytics indexes created successfully');
    } catch (error) {
      logger.warn(`Failed to create analytics indexes: ${error.message}`);
    }
  }

  /**
   * Track content view
   * @param {string} contentId - Content ID
   * @param {Object} req - Request object
   */
  async trackContentView(contentId, req) {
    try {
      const sessionId = this.getSessionId(req);
      const metadata = this.extractMetadata(req);

      await this.trackEvent('page_view', contentId, {
        ...metadata,
        sessionId,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error(`Error tracking content view: ${error.message}`);
    }
  }

  /**
   * Track custom event
   * @param {string} event - Event name
   * @param {string} contentId - Content ID (optional)
   * @param {Object} metadata - Additional metadata
   */
  async trackEvent(event, contentId = null, metadata = {}) {
    try {
      if (!database.isConnected) {
        await database.connect();
      }

      const analyticsCollection = database.db.collection('content_analytics');

      const analyticsRecord = {
        event,
        contentId: contentId ? new ObjectId(contentId) : null,
        metadata,
        timestamp: new Date()
      };

      await analyticsCollection.insertOne(analyticsRecord);

    } catch (error) {
      logger.error(`Error tracking event ${event}: ${error.message}`);
    }
  }

  /**
   * Track SEO metrics
   * @param {string} contentId - Content ID
   * @param {Object} seoData - SEO data
   */
  async trackSEOMetrics(contentId, seoData) {
    try {
      if (!database.isConnected) {
        await database.connect();
      }

      const seoCollection = database.db.collection('seo_metrics');

      const seoRecord = {
        contentId: new ObjectId(contentId),
        keyword: seoData.keyword,
        searchPosition: seoData.position,
        impressions: seoData.impressions || 0,
        clicks: seoData.clicks || 0,
        clickThroughRate: seoData.ctr || 0,
        source: seoData.source || 'google',
        timestamp: new Date()
      };

      await seoCollection.insertOne(seoRecord);

    } catch (error) {
      logger.error(`Error tracking SEO metrics: ${error.message}`);
    }
  }

  /**
   * Calculate and store content quality metrics
   * @param {string} contentId - Content ID
   */
  async calculateQualityMetrics(contentId) {
    try {
      if (!database.isConnected) {
        await database.connect();
      }

      const contentCollection = database.db.collection('content');
      const content = await contentCollection.findOne({ _id: new ObjectId(contentId) });

      if (!content) {
        throw new Error('Content not found');
      }

      const qualityMetrics = {
        readabilityScore: this.calculateReadabilityScore(content.content),
        seoScore: this.calculateSEOScore(content),
        engagementScore: await this.calculateEngagementScore(contentId),
        timestamp: new Date()
      };

      const qualityCollection = database.db.collection('quality_metrics');
      await qualityCollection.insertOne({
        contentId: new ObjectId(contentId),
        ...qualityMetrics
      });

      return qualityMetrics;

    } catch (error) {
      logger.error(`Error calculating quality metrics: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate readability score using Flesch Reading Ease
   * @param {string} content - Content text
   * @returns {number} Readability score
   */
  calculateReadabilityScore(content) {
    try {
      if (!content || content.length === 0) return 0;

      // Remove markdown and HTML
      const cleanText = content
        .replace(/[#*_`\[\]()]/g, '')
        .replace(/<[^>]*>/g, '')
        .trim();

      const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = cleanText.split(/\s+/).filter(w => w.length > 0);
      const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);

      if (sentences.length === 0 || words.length === 0) return 0;

      const avgWordsPerSentence = words.length / sentences.length;
      const avgSyllablesPerWord = syllables / words.length;

      // Flesch Reading Ease formula
      const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

      // Normalize to 0-100 scale
      return Math.max(0, Math.min(100, readabilityScore));

    } catch (error) {
      logger.error(`Error calculating readability: ${error.message}`);
      return 0;
    }
  }

  /**
   * Count syllables in a word (simplified)
   * @param {string} word - Word to count syllables
   * @returns {number} Syllable count
   */
  countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Adjust for silent 'e'
    if (word.endsWith('e')) {
      count--;
    }

    return Math.max(1, count);
  }

  /**
   * Calculate SEO score
   * @param {Object} content - Content object
   * @returns {number} SEO score
   */
  calculateSEOScore(content) {
    try {
      let score = 0;
      const maxScore = 100;

      // Title length (10 points)
      if (content.title && content.title.length >= 30 && content.title.length <= 60) {
        score += 10;
      } else if (content.title && content.title.length > 0) {
        score += 5;
      }

      // Description length (10 points)
      if (content.description && content.description.length >= 120 && content.description.length <= 160) {
        score += 10;
      } else if (content.description && content.description.length > 0) {
        score += 5;
      }

      // Content length (15 points)
      if (content.content && content.content.length >= 1000) {
        score += 15;
      } else if (content.content && content.content.length >= 500) {
        score += 10;
      } else if (content.content && content.content.length >= 200) {
        score += 5;
      }

      // Tags (10 points)
      if (content.tags && content.tags.length >= 3) {
        score += 10;
      } else if (content.tags && content.tags.length > 0) {
        score += 5;
      }

      // Slug quality (10 points)
      if (content.slug && content.slug.length > 0 && !content.slug.includes('_')) {
        score += 10;
      }

      // Headings structure (15 points)
      const headingMatches = content.content.match(/^#+\s/gm);
      if (headingMatches && headingMatches.length >= 3) {
        score += 15;
      } else if (headingMatches && headingMatches.length > 0) {
        score += 8;
      }

      // Internal links (10 points)
      const internalLinks = content.content.match(/\[.*?\]\((?!http)/g);
      if (internalLinks && internalLinks.length >= 2) {
        score += 10;
      } else if (internalLinks && internalLinks.length > 0) {
        score += 5;
      }

      // Keywords in title and description (20 points)
      if (content.tags && content.tags.length > 0) {
        const titleLower = content.title ? content.title.toLowerCase() : '';
        const descLower = content.description ? content.description.toLowerCase() : '';
        
        let keywordScore = 0;
        content.tags.forEach(tag => {
          if (titleLower.includes(tag.toLowerCase())) keywordScore += 5;
          if (descLower.includes(tag.toLowerCase())) keywordScore += 5;
        });
        score += Math.min(20, keywordScore);
      }

      return Math.min(maxScore, score);

    } catch (error) {
      logger.error(`Error calculating SEO score: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate engagement score based on analytics
   * @param {string} contentId - Content ID
   * @returns {number} Engagement score
   */
  async calculateEngagementScore(contentId) {
    try {
      if (!database.isConnected) {
        await database.connect();
      }

      const analyticsCollection = database.db.collection('content_analytics');
      const contentCollection = database.db.collection('content');

      // Get content age in days
      const content = await contentCollection.findOne({ _id: new ObjectId(contentId) });
      if (!content || !content.publishedAt) return 0;

      const ageInDays = (new Date() - content.publishedAt) / (1000 * 60 * 60 * 24);
      if (ageInDays < 1) return 0; // Too new to calculate meaningful engagement

      // Get analytics data
      const analytics = await analyticsCollection.aggregate([
        {
          $match: {
            contentId: new ObjectId(contentId),
            timestamp: { $gte: content.publishedAt }
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

      let score = 0;

      analytics.forEach(metric => {
        switch (metric._id) {
          case 'page_view':
            // Views per day (up to 30 points)
            const viewsPerDay = metric.count / ageInDays;
            score += Math.min(30, viewsPerDay * 2);
            break;
          
          case 'like':
            // Likes (up to 20 points)
            score += Math.min(20, metric.count * 2);
            break;
          
          case 'share':
            // Shares (up to 20 points)
            score += Math.min(20, metric.count * 5);
            break;
          
          case 'comment':
            // Comments (up to 15 points)
            score += Math.min(15, metric.count * 3);
            break;
        }

        // Time on page bonus (up to 10 points)
        if (metric.avgTimeOnPage && metric.avgTimeOnPage > 60) {
          score += Math.min(10, (metric.avgTimeOnPage - 60) / 60 * 2);
        }

        // Scroll depth bonus (up to 5 points)
        if (metric.avgScrollDepth && metric.avgScrollDepth > 0.5) {
          score += Math.min(5, (metric.avgScrollDepth - 0.5) * 10);
        }
      });

      return Math.min(100, Math.round(score));

    } catch (error) {
      logger.error(`Error calculating engagement score: ${error.message}`);
      return 0;
    }
  }

  /**
   * Generate analytics report
   * @param {Object} options - Report options
   * @returns {Object} Analytics report
   */
  async generateReport(options = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        contentType = null,
        includeQuality = true
      } = options;

      if (!database.isConnected) {
        await database.connect();
      }

      const report = {
        period: { startDate, endDate },
        overview: await this.getOverviewMetrics(startDate, endDate),
        topContent: await this.getTopContent(startDate, endDate, contentType),
        trafficSources: await this.getTrafficSources(startDate, endDate),
        userBehavior: await this.getUserBehaviorMetrics(startDate, endDate)
      };

      if (includeQuality) {
        report.qualityMetrics = await this.getQualityMetrics(startDate, endDate);
      }

      return report;

    } catch (error) {
      logger.error(`Error generating analytics report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get overview metrics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Overview metrics
   */
  async getOverviewMetrics(startDate, endDate) {
    const analyticsCollection = database.db.collection('content_analytics');

    const metrics = await analyticsCollection.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$event',
          count: { $sum: 1 },
          uniqueContent: { $addToSet: '$contentId' },
          uniqueSessions: { $addToSet: '$sessionId' }
        }
      }
    ]).toArray();

    const overview = {
      totalEvents: 0,
      uniqueVisitors: 0,
      uniqueContent: new Set(),
      events: {}
    };

    metrics.forEach(metric => {
      overview.totalEvents += metric.count;
      overview.events[metric._id] = metric.count;
      overview.uniqueVisitors = Math.max(overview.uniqueVisitors, metric.uniqueSessions.length);
      metric.uniqueContent.forEach(contentId => {
        if (contentId) overview.uniqueContent.add(contentId.toString());
      });
    });

    overview.uniqueContent = overview.uniqueContent.size;

    return overview;
  }

  /**
   * Get top performing content
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} contentType - Content type filter
   * @returns {Array} Top content
   */
  async getTopContent(startDate, endDate, contentType = null) {
    const analyticsCollection = database.db.collection('content_analytics');

    const matchStage = {
      timestamp: { $gte: startDate, $lte: endDate },
      contentId: { $ne: null }
    };

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$contentId',
          views: { $sum: { $cond: [{ $eq: ['$event', 'page_view'] }, 1, 0] } },
          likes: { $sum: { $cond: [{ $eq: ['$event', 'like'] }, 1, 0] } },
          shares: { $sum: { $cond: [{ $eq: ['$event', 'share'] }, 1, 0] } },
          avgTimeOnPage: { $avg: '$metadata.timeOnPage' },
          avgScrollDepth: { $avg: '$metadata.scrollDepth' }
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
      { $unwind: '$content' },
      {
        $project: {
          title: '$content.title',
          type: '$content.type',
          slug: '$content.slug',
          views: 1,
          likes: 1,
          shares: 1,
          avgTimeOnPage: 1,
          avgScrollDepth: 1,
          engagementScore: {
            $add: [
              { $multiply: ['$views', 1] },
              { $multiply: ['$likes', 3] },
              { $multiply: ['$shares', 5] }
            ]
          }
        }
      },
      { $sort: { engagementScore: -1 } },
      { $limit: 10 }
    ];

    if (contentType) {
      pipeline.splice(2, 0, { $match: { 'content.type': contentType } });
    }

    return await analyticsCollection.aggregate(pipeline).toArray();
  }

  /**
   * Get traffic sources
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Traffic sources
   */
  async getTrafficSources(startDate, endDate) {
    const analyticsCollection = database.db.collection('content_analytics');

    return await analyticsCollection.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          event: 'page_view',
          'metadata.source': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$metadata.source',
          count: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          source: '$_id',
          visits: '$count',
          uniqueVisitors: { $size: '$uniqueVisitors' }
        }
      },
      { $sort: { visits: -1 } }
    ]).toArray();
  }

  /**
   * Get user behavior metrics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} User behavior metrics
   */
  async getUserBehaviorMetrics(startDate, endDate) {
    const analyticsCollection = database.db.collection('content_analytics');

    const behavior = await analyticsCollection.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          event: 'page_view'
        }
      },
      {
        $group: {
          _id: null,
          avgTimeOnPage: { $avg: '$metadata.timeOnPage' },
          avgScrollDepth: { $avg: '$metadata.scrollDepth' },
          totalSessions: { $addToSet: '$sessionId' }
        }
      }
    ]).toArray();

    return behavior.length > 0 ? {
      avgTimeOnPage: Math.round(behavior[0].avgTimeOnPage || 0),
      avgScrollDepth: Math.round((behavior[0].avgScrollDepth || 0) * 100),
      totalSessions: behavior[0].totalSessions.length
    } : {};
  }

  /**
   * Get quality metrics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} Quality metrics
   */
  async getQualityMetrics(startDate, endDate) {
    const qualityCollection = database.db.collection('quality_metrics');

    const metrics = await qualityCollection.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          avgReadability: { $avg: '$readabilityScore' },
          avgSeoScore: { $avg: '$seoScore' },
          avgEngagement: { $avg: '$engagementScore' },
          totalContent: { $sum: 1 }
        }
      }
    ]).toArray();

    return metrics.length > 0 ? metrics[0] : {};
  }

  /**
   * Get session ID from request
   * @param {Object} req - Request object
   * @returns {string} Session ID
   */
  getSessionId(req) {
    // Simple session ID generation based on IP and user agent
    const ip = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const sessionKey = `${ip}-${userAgent}`;
    
    // Create a simple hash
    let hash = 0;
    for (let i = 0; i < sessionKey.length; i++) {
      const char = sessionKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `session_${Math.abs(hash)}_${Date.now()}`;
  }

  /**
   * Extract metadata from request
   * @param {Object} req - Request object
   * @returns {Object} Metadata
   */
  extractMetadata(req) {
    return {
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers.referer || '',
      ip: req.ip || req.connection.remoteAddress || '',
      source: this.getTrafficSource(req.headers.referer),
      timeOnPage: 0, // Will be updated by client-side tracking
      scrollDepth: 0 // Will be updated by client-side tracking
    };
  }

  /**
   * Determine traffic source from referrer
   * @param {string} referrer - Referrer URL
   * @returns {string} Traffic source
   */
  getTrafficSource(referrer) {
    if (!referrer) return 'direct';
    
    const url = referrer.toLowerCase();
    
    if (url.includes('google.')) return 'organic';
    if (url.includes('bing.')) return 'organic';
    if (url.includes('yahoo.')) return 'organic';
    if (url.includes('facebook.')) return 'social';
    if (url.includes('twitter.')) return 'social';
    if (url.includes('linkedin.')) return 'social';
    if (url.includes('github.')) return 'social';
    
    return 'referral';
  }
}

// Export singleton instance
module.exports = new AnalyticsService(); 