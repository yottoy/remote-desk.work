const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const { ObjectId } = require('mongodb');
const database = require('../utils/database');
const authMiddleware = require('../middleware/authMiddleware');
const { asyncHandler, createValidationError, createNotFoundError, createBadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Content types based on docs/content/ structure
const CONTENT_TYPES = {
  WEEKLY_INSIGHTS: 'weekly_insights',
  GUIDE: 'guide',
  EDITORS_PICK: 'editors_pick',
  JOB_LISTING: 'job_listing'
};

// Workflow states
const WORKFLOW_STATES = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  SCHEDULED: 'scheduled',
  ARCHIVED: 'archived'
};

/**
 * GET /api/content
 * Get all content with filtering and pagination
 */
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    type, 
    status, 
    author, 
    search,
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  if (!database.isConnected) {
    await database.connect();
  }

  const contentCollection = database.db.collection('content');

  // Build query
  const query = {};
  
  if (type && Object.values(CONTENT_TYPES).includes(type)) {
    query.type = type;
  }
  
  if (status && Object.values(WORKFLOW_STATES).includes(status)) {
    query.status = status;
  }
  
  if (author) {
    query.authorId = new ObjectId(author);
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Only show published content to non-authenticated users
  if (!req.user) {
    query.status = WORKFLOW_STATES.PUBLISHED;
    query.publishedAt = { $lte: new Date() };
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Get content
  const content = await contentCollection
    .find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limitNum)
    .toArray();

  // Populate author information
  const contentWithAuthors = await Promise.all(
    content.map(async (item) => {
      if (item.authorId) {
        const usersCollection = database.db.collection('users');
        const author = await usersCollection.findOne(
          { _id: item.authorId },
          { projection: { firstName: 1, lastName: 1, email: 1 } }
        );
        item.author = author;
      }
      return item;
    })
  );

  // Get total count
  const total = await contentCollection.countDocuments(query);

  res.json({
    content: contentWithAuthors,
    pagination: {
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      total
    }
  });
}));

/**
 * GET /api/content/:id
 * Get specific content item
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { includeAnalytics = false } = req.query;

  if (!ObjectId.isValid(id)) {
    throw createBadRequestError('Invalid content ID');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const contentCollection = database.db.collection('content');
  const content = await contentCollection.findOne({ _id: new ObjectId(id) });

  if (!content) {
    throw createNotFoundError('Content');
  }

  // Check permissions for unpublished content
  if (content.status !== WORKFLOW_STATES.PUBLISHED && !req.user) {
    throw createNotFoundError('Content');
  }

  // Populate author information
  if (content.authorId) {
    const usersCollection = database.db.collection('users');
    const author = await usersCollection.findOne(
      { _id: content.authorId },
      { projection: { firstName: 1, lastName: 1, email: 1 } }
    );
    content.author = author;
  }

  // Include analytics if requested and user is authenticated
  if (includeAnalytics && req.user) {
    const analyticsCollection = database.db.collection('content_analytics');
    const analytics = await analyticsCollection.findOne({ contentId: new ObjectId(id) });
    content.analytics = analytics;
  }

  // Track view if content is published
  if (content.status === WORKFLOW_STATES.PUBLISHED) {
    // Increment view count
    await contentCollection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { viewCount: 1 } }
    );

    // Track detailed analytics
    const analyticsService = require('../services/analyticsService');
    await analyticsService.trackContentView(id, req);
  }

  res.json({
    content
  });
}));

/**
 * POST /api/content
 * Create new content
 */
router.post('/', authMiddleware.requireAuth, asyncHandler(async (req, res) => {
  const {
    title,
    description,
    content,
    type,
    tags = [],
    metadata = {},
    scheduledPublishAt
  } = req.body;

  // Validation
  const errors = [];
  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!description || description.trim().length === 0) {
    errors.push('Description is required');
  }
  if (!content || content.trim().length === 0) {
    errors.push('Content is required');
  }
  if (!type || !Object.values(CONTENT_TYPES).includes(type)) {
    errors.push('Valid content type is required');
  }

  if (errors.length > 0) {
    throw createValidationError('Content creation validation failed', errors);
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const contentCollection = database.db.collection('content');

  // Generate slug from title
  const slug = title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  // Check for duplicate slug
  let finalSlug = slug;
  let counter = 1;
  while (await contentCollection.findOne({ slug: finalSlug })) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  // Determine initial status
  let initialStatus = WORKFLOW_STATES.DRAFT;
  if (scheduledPublishAt) {
    initialStatus = WORKFLOW_STATES.SCHEDULED;
  }

  // Create content object
  const newContent = {
    title: title.trim(),
    description: description.trim(),
    content: content.trim(),
    contentHtml: marked(content.trim()),
    type,
    slug: finalSlug,
    tags: Array.isArray(tags) ? tags.map(tag => tag.trim()) : [],
    metadata,
    status: initialStatus,
    authorId: new ObjectId(req.user._id),
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
    scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : null,
    viewCount: 0,
    likeCount: 0,
    version: 1,
    workflowHistory: [{
      status: initialStatus,
      userId: new ObjectId(req.user._id),
      timestamp: new Date(),
      comment: 'Content created'
    }]
  };

  // Insert content
  const result = await contentCollection.insertOne(newContent);
  const createdContent = await contentCollection.findOne({ _id: result.insertedId });

  logger.info(`New content created: ${title} by ${req.user.email}`);

  res.status(201).json({
    message: 'Content created successfully',
    content: createdContent
  });
}));

/**
 * PUT /api/content/:id
 * Update content
 */
router.put('/:id', authMiddleware.requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    content,
    tags,
    metadata,
    scheduledPublishAt
  } = req.body;

  if (!ObjectId.isValid(id)) {
    throw createBadRequestError('Invalid content ID');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const contentCollection = database.db.collection('content');
  const existingContent = await contentCollection.findOne({ _id: new ObjectId(id) });

  if (!existingContent) {
    throw createNotFoundError('Content');
  }

  // Check permissions
  const canEdit = req.user.role === 'admin' || 
                  req.user.role === 'editor' || 
                  existingContent.authorId.toString() === req.user._id.toString();

  if (!canEdit) {
    throw createBadRequestError('You do not have permission to edit this content');
  }

  // Build update object
  const updateFields = {
    updatedAt: new Date()
  };

  if (title) {
    updateFields.title = title.trim();
    // Update slug if title changed
    if (title.trim() !== existingContent.title) {
      const newSlug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      // Check for duplicate slug
      let finalSlug = newSlug;
      let counter = 1;
      while (await contentCollection.findOne({ slug: finalSlug, _id: { $ne: new ObjectId(id) } })) {
        finalSlug = `${newSlug}-${counter}`;
        counter++;
      }
      updateFields.slug = finalSlug;
    }
  }

  if (description) updateFields.description = description.trim();
  if (content) {
    updateFields.content = content.trim();
    updateFields.contentHtml = marked(content.trim());
  }
  if (tags !== undefined) updateFields.tags = Array.isArray(tags) ? tags.map(tag => tag.trim()) : [];
  if (metadata !== undefined) updateFields.metadata = metadata;
  if (scheduledPublishAt !== undefined) {
    updateFields.scheduledPublishAt = scheduledPublishAt ? new Date(scheduledPublishAt) : null;
  }

  // Increment version
  updateFields.version = existingContent.version + 1;

  // Update content
  await contentCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateFields }
  );

  // Get updated content
  const updatedContent = await contentCollection.findOne({ _id: new ObjectId(id) });

  logger.info(`Content updated: ${id} by ${req.user.email}`);

  res.json({
    message: 'Content updated successfully',
    content: updatedContent
  });
}));

/**
 * PUT /api/content/:id/status
 * Update content workflow status
 */
router.put('/:id/status', authMiddleware.requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, comment = '' } = req.body;

  if (!ObjectId.isValid(id)) {
    throw createBadRequestError('Invalid content ID');
  }

  if (!status || !Object.values(WORKFLOW_STATES).includes(status)) {
    throw createValidationError('Valid status is required');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const contentCollection = database.db.collection('content');
  const content = await contentCollection.findOne({ _id: new ObjectId(id) });

  if (!content) {
    throw createNotFoundError('Content');
  }

  // Check permissions based on status transition
  const canChangeStatus = checkStatusTransitionPermission(content.status, status, req.user.role);
  if (!canChangeStatus) {
    throw createBadRequestError('You do not have permission to change this content status');
  }

  // Build update object
  const updateFields = {
    status,
    updatedAt: new Date()
  };

  // Set published timestamp when publishing
  if (status === WORKFLOW_STATES.PUBLISHED && content.status !== WORKFLOW_STATES.PUBLISHED) {
    updateFields.publishedAt = new Date();
  }

  // Add to workflow history
  const workflowEntry = {
    status,
    userId: new ObjectId(req.user._id),
    timestamp: new Date(),
    comment: comment.trim()
  };

  // Update content
  await contentCollection.updateOne(
    { _id: new ObjectId(id) },
    { 
      $set: updateFields,
      $push: { workflowHistory: workflowEntry }
    }
  );

  logger.info(`Content status updated: ${id} -> ${status} by ${req.user.email}`);

  res.json({
    message: 'Content status updated successfully'
  });
}));

/**
 * DELETE /api/content/:id
 * Delete content (admin/editor only)
 */
router.delete('/:id', authMiddleware.requireEditor, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    throw createBadRequestError('Invalid content ID');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const contentCollection = database.db.collection('content');
  const result = await contentCollection.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    throw createNotFoundError('Content');
  }

  // Also delete associated analytics
  const analyticsCollection = database.db.collection('content_analytics');
  await analyticsCollection.deleteOne({ contentId: new ObjectId(id) });

  logger.info(`Content deleted: ${id} by ${req.user.email}`);

  res.json({
    message: 'Content deleted successfully'
  });
}));

/**
 * GET /api/content/:id/versions
 * Get content version history
 */
router.get('/:id/versions', authMiddleware.requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    throw createBadRequestError('Invalid content ID');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const contentVersionsCollection = database.db.collection('content_versions');
  const versions = await contentVersionsCollection
    .find({ contentId: new ObjectId(id) })
    .sort({ version: -1 })
    .toArray();

  res.json({
    versions
  });
}));

/**
 * POST /api/content/import-from-files
 * Import content from docs/content/ directory (admin only)
 */
router.post('/import-from-files', authMiddleware.requireAdmin, asyncHandler(async (req, res) => {
  const contentDir = path.join(process.cwd(), 'docs', 'content');
  
  try {
    const files = await fs.readdir(contentDir);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    const imported = [];
    const errors = [];

    for (const file of markdownFiles) {
      try {
        const filePath = path.join(contentDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        // Extract metadata and content
        const { metadata, content } = parseMarkdownWithMetadata(fileContent);
        
        // Determine content type based on filename
        let type = CONTENT_TYPES.GUIDE;
        if (file.includes('weekly_market_insights')) {
          type = CONTENT_TYPES.WEEKLY_INSIGHTS;
        } else if (file.includes('editors_pick')) {
          type = CONTENT_TYPES.EDITORS_PICK;
        }

        // Create content object
        const newContent = {
          title: metadata.title || file.replace('.md', '').replace(/_/g, ' '),
          description: metadata.description || extractFirstParagraph(content),
          content,
          contentHtml: marked(content),
          type,
          slug: file.replace('.md', '').toLowerCase(),
          tags: metadata.tags || [],
          metadata: metadata,
          status: WORKFLOW_STATES.PUBLISHED,
          authorId: new ObjectId(req.user._id),
          createdAt: new Date(),
          updatedAt: new Date(),
          publishedAt: new Date(),
          scheduledPublishAt: null,
          viewCount: 0,
          likeCount: 0,
          version: 1,
          workflowHistory: [{
            status: WORKFLOW_STATES.PUBLISHED,
            userId: new ObjectId(req.user._id),
            timestamp: new Date(),
            comment: `Imported from file: ${file}`
          }]
        };

        if (!database.isConnected) {
          await database.connect();
        }

        const contentCollection = database.db.collection('content');
        
        // Check if content already exists
        const existing = await contentCollection.findOne({ slug: newContent.slug });
        if (!existing) {
          await contentCollection.insertOne(newContent);
          imported.push(file);
        }
        
      } catch (error) {
        errors.push({ file, error: error.message });
      }
    }

    logger.info(`Content import completed: ${imported.length} files imported, ${errors.length} errors`);

    res.json({
      message: 'Content import completed',
      imported,
      errors,
      summary: {
        total: markdownFiles.length,
        imported: imported.length,
        errors: errors.length
      }
    });

  } catch (error) {
    throw createBadRequestError(`Failed to import content: ${error.message}`);
  }
}));

/**
 * Helper function to check status transition permissions
 */
function checkStatusTransitionPermission(currentStatus, newStatus, userRole) {
  // Admin can change any status
  if (userRole === 'admin') return true;

  // Editor permissions
  if (userRole === 'editor') {
    // Can approve, publish, or archive
    if ([WORKFLOW_STATES.APPROVED, WORKFLOW_STATES.PUBLISHED, WORKFLOW_STATES.ARCHIVED].includes(newStatus)) {
      return true;
    }
    // Can move back to review
    if (newStatus === WORKFLOW_STATES.REVIEW) return true;
  }

  // Author permissions
  if (userRole === 'author') {
    // Can only submit for review or save as draft
    return [WORKFLOW_STATES.DRAFT, WORKFLOW_STATES.REVIEW].includes(newStatus);
  }

  return false;
}

/**
 * Helper function to parse markdown with metadata
 */
function parseMarkdownWithMetadata(content) {
  const lines = content.split('\n');
  const metadata = {};
  let contentStart = 0;

  // Simple metadata extraction (could be enhanced with frontmatter parsing)
  if (lines[0] && lines[0].startsWith('#')) {
    metadata.title = lines[0].replace(/^#+\s*/, '');
    contentStart = 1;
  }

  return {
    metadata,
    content: lines.slice(contentStart).join('\n')
  };
}

/**
 * Helper function to extract first paragraph for description
 */
function extractFirstParagraph(content) {
  const paragraphs = content.split('\n\n');
  for (const paragraph of paragraphs) {
    const cleaned = paragraph.replace(/#+\s*/, '').trim();
    if (cleaned.length > 0 && !cleaned.startsWith('*') && !cleaned.startsWith('-')) {
      return cleaned.substring(0, 200) + (cleaned.length > 200 ? '...' : '');
    }
  }
  return '';
}

module.exports = router; 