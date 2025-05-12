/**
 * Example API server for exposing job data
 * 
 * This file shows how you might create a simple Express API
 * to expose the job data to a frontend website.
 * 
 * To use this:
 * 1. Install Express: npm install express cors
 * 2. Run: node api-example.js
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const config = require('../config/config');
const logger = require('../src/utils/logger');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Apply middlewares
app.use(cors());
app.use(express.json());

// Connect to database
mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch(err => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  });

/**
 * GET /api/jobs
 * Get jobs with optional filtering
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - featured: Filter featured jobs (true/false)
 * - source: Filter by source
 * - search: Text search query
 * - sort: Sort field (default: scrapedDate)
 * - order: Sort order (asc/desc, default: desc)
 */
app.get('/api/jobs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Filter by featured
    if (req.query.featured === 'true') {
      query.featured = true;
    }
    
    // Filter by source
    if (req.query.source) {
      query.source = req.query.source;
    }
    
    // Text search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Build sort
    const sortField = req.query.sort || 'scrapedDate';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sort = {};
    sort[sortField] = sortOrder;
    
    // Add text score if searching
    const projection = req.query.search 
      ? { score: { $meta: 'textScore' } }
      : {};
    
    // If text search and no sort specified, sort by relevance
    if (req.query.search && !req.query.sort) {
      sort.score = { $meta: 'textScore' };
    }
    
    // Get jobs
    const jobs = await Job.find(query, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count
    const total = await Job.countDocuments(query);
    
    // Return response
    return res.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/jobs/:id
 * Get a single job by ID
 */
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    return res.json(job);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/stats
 * Get job statistics
 */
app.get('/api/stats', async (req, res) => {
  try {
    // Get total jobs count
    const totalJobs = await Job.countDocuments();
    
    // Get featured jobs count
    const featuredJobs = await Job.countDocuments({ featured: true });
    
    // Get jobs by source
    const sourceStats = await Job.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    
    // Get jobs in the last 24 hours
    const lastDay = new Date();
    lastDay.setDate(lastDay.getDate() - 1);
    const newJobsLastDay = await Job.countDocuments({ scrapedDate: { $gte: lastDay } });
    
    // Return stats
    return res.json({
      totalJobs,
      featuredJobs,
      sourceStats,
      newJobsLastDay
    });
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/sources
 * Get list of available sources
 */
app.get('/api/sources', async (req, res) => {
  try {
    const sources = await Job.distinct('source');
    return res.json(sources);
  } catch (error) {
    logger.error(`API error: ${error.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
});

module.exports = app; 