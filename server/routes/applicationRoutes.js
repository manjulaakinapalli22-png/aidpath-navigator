import express from 'express';
import { ApplicationService } from '../services/applicationService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/applications
 * Get current user's saved applications and deadline urgency
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filters = {
      stage: req.query.stage,
    };
    const applications = await ApplicationService.getUserApplications(req.user.id, filters);

    res.json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/applications
 * Save a scholarship to student's pipeline
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { scholarship_id, notes, custom_deadline } = req.body;
    if (!scholarship_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'scholarship_id is required.' },
      });
    }

    const saved = await ApplicationService.saveOpportunity(req.user.id, scholarship_id, notes, custom_deadline);

    res.status(201).json({
      success: true,
      data: saved,
      message: 'Scholarship saved to your application tracker! Document checklist has been initialized.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/applications/:id/stage
 * Move application through stages
 */
router.patch('/:id/stage', requireAuth, async (req, res, next) => {
  try {
    const { stage, notes, award_amount_won } = req.body;
    if (!stage) {
      return res.status(400).json({
        success: false,
        error: { message: 'Target stage is required.' },
      });
    }

    const updated = await ApplicationService.updateStage(req.params.id, req.user.id, stage, {
      notes,
      award_amount_won,
    });

    res.json({
      success: true,
      data: updated,
      message: `Application moved to "${stage.replace('_', ' ').toUpperCase()}".`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/applications/:id
 * Remove a saved scholarship
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await ApplicationService.removeSavedOpportunity(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Application removed from your tracker.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
