import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../lib/db';
import { 
  CATEGORIES, 
  STATES,
  getModifierInfo,
  isExperienceLevel 
} from '../../data/programmaticSeo';

/**
 * API endpoint for fetching jobs filtered by programmatic SEO parameters
 * 
 * Query parameters:
 * - category: Job category slug (data-entry, virtual-assistant, etc.)
 * - state: State slug (texas, california, etc.)
 * - modifier: Experience level or employment type (entry-level, part-time, etc.)
 * - page: Page number for pagination (default: 1)
 * - limit: Number of results per page (default: 25, max: 100)
 * 
 * Example: /api/programmatic-jobs?category=data-entry&state=texas&modifier=entry-level
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    category: categorySlug,
    state: stateSlug,
    modifier: modifierSlug,
    page = '1',
    limit = '25'
  } = req.query;

  // Validate required parameters
  if (!categorySlug || typeof categorySlug !== 'string') {
    return res.status(400).json({ error: 'Category parameter is required' });
  }

  if (!stateSlug || typeof stateSlug !== 'string') {
    return res.status(400).json({ error: 'State parameter is required' });
  }

  // Validate category
  const category = CATEGORIES[categorySlug];
  if (!category) {
    return res.status(404).json({ 
      error: 'Invalid category',
      validCategories: Object.keys(CATEGORIES)
    });
  }

  // Validate state
  const state = STATES[stateSlug];
  if (!state) {
    return res.status(404).json({ 
      error: 'Invalid state',
      validStates: Object.keys(STATES)
    });
  }

  // Validate modifier (optional)
  let modifier = null;
  if (modifierSlug && typeof modifierSlug === 'string') {
    modifier = getModifierInfo(modifierSlug);
    if (!modifier) {
      return res.status(404).json({ 
        error: 'Invalid modifier',
        message: 'Modifier must be a valid experience level or employment type'
      });
    }
  }

  // Parse pagination
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 25));
  const skip = (pageNum - 1) * limitNum;

  try {
    await connectDB();
    const mongoose = require('mongoose');
    
    const JobModel = mongoose.models.Job || mongoose.model('Job', new mongoose.Schema({}, { strict: false, collection: 'jobs' }));
    
    // Build query
    const query: any = {
      $and: [
        // Category filter
        {
          $or: [
            { jobCategory: { $regex: category.name, $options: 'i' } },
            { title: { $regex: category.name, $options: 'i' } },
            { tags: { $in: [category.slug, category.name.toLowerCase()] } }
          ]
        },
        // State filter
        {
          $or: [
            { location_restriction: { $regex: state.name, $options: 'i' } },
            { location: { $regex: state.name, $options: 'i' } },
            { location: { $regex: state.abbreviation, $options: 'i' } }
          ]
        }
      ]
    };

    // Add modifier-specific filters
    if (modifier) {
      if (isExperienceLevel(modifierSlug as string)) {
        query.$and.push({
          $or: [
            { experienceLevel: { $regex: modifier.name, $options: 'i' } },
            { title: { $regex: modifier.name, $options: 'i' } },
            { description: { $regex: modifier.name, $options: 'i' } }
          ]
        });
      } else if (modifierSlug === 'part-time') {
        query.$and.push({
          $or: [
            { jobType: { $regex: 'part.?time', $options: 'i' } },
            { title: { $regex: 'part.?time', $options: 'i' } }
          ]
        });
      }
    }

    // Get total count
    const totalCount = await JobModel.countDocuments(query);

    // Get jobs for current page
    const jobs = await JobModel
      .find(query)
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()
      .exec();

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalJobs: totalCount,
          limit: limitNum,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? pageNum + 1 : null,
          prevPage: hasPrevPage ? pageNum - 1 : null
        },
        filters: {
          category: {
            slug: category.slug,
            name: category.name
          },
          state: {
            slug: state.slug,
            name: state.name
          },
          modifier: modifier ? {
            slug: modifierSlug,
            name: modifier.name
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching programmatic jobs:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch jobs'
    });
  }
}
