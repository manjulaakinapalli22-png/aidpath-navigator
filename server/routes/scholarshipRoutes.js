import express from 'express';
import { ScholarshipService } from '../services/scholarshipService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/scholarships
 * List curated scholarships with filters and sorting
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      education_level: req.query.education_level,
      major: req.query.major,
      verification_status: req.query.verification_status,
      need_based: req.query.need_based,
      renewable: req.query.renewable,
      max_gpa_req: req.query.max_gpa_req,
      sort_by: req.query.sort_by,
      sort_order: req.query.sort_order,
      is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : true,
    };

    const scholarships = await ScholarshipService.getAll(filters);

    res.json({
      success: true,
      count: scholarships.length,
      data: scholarships,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/scholarships/stale/list
 * Operator/Admin endpoint to view scholarships requiring verification review
 */
router.get('/stale/list', requireRole(['operator', 'admin']), async (req, res, next) => {
  try {
    const staleList = await ScholarshipService.getStaleRecords();
    res.json({
      success: true,
      count: staleList.length,
      data: staleList,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/scholarships/:id
 * Get single scholarship details with granular rules and required document templates
 */
router.get('/:id', async (req, res, next) => {
  try {
    const item = await ScholarshipService.getById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: 'Scholarship not found.' },
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/scholarships/:id/verify
 * Operator/Admin: Verify scholarship criteria, active link, and reset staleness
 */
router.post('/:id/verify', requireRole(['operator', 'admin']), async (req, res, next) => {
  try {
    const { notes, deadline, award_amount, provider_url, action } = req.body;
    const verified = await ScholarshipService.verifyRecord(req.params.id, req.user, {
      notes,
      deadline,
      award_amount,
      provider_url,
      action: action || 'verified_as_current',
    });

    res.json({
      success: true,
      data: verified,
      message: `Scholarship "${verified.title}" has been verified as current.`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/scholarships
 * Admin: Add new scholarship to curated directory
 */
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { title, provider_name, provider_url, description, award_amount, deadline } = req.body;
    if (!title || !provider_name || !provider_url || !deadline) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title, Provider Name, Provider URL, and Deadline are required.' },
      });
    }

    const created = await ScholarshipService.createScholarship(req.body, req.user);
    res.status(201).json({
      success: true,
      data: created,
      message: 'Scholarship curated and published to directory.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/scholarships/:id
 * Admin: Update existing scholarship details
 */
router.put('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const updated = await ScholarshipService.updateScholarship(req.params.id, req.body, req.user);
    res.json({
      success: true,
      data: updated,
      message: 'Scholarship details updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
