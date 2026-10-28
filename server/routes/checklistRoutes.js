import express from 'express';
import { ChecklistService } from '../services/checklistService.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/checklists/:savedId
 * Get checklist for an application
 */
router.get('/:savedId', requireAuth, async (req, res, next) => {
  try {
    const checklist = await ChecklistService.getChecklistForApplication(req.params.savedId, req.user.id);
    res.json({
      success: true,
      data: checklist,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/checklists/item/:itemId
 * Update checklist item status, notes, or uploaded file name
 */
router.patch('/item/:itemId', requireAuth, async (req, res, next) => {
  try {
    const { status, notes, file_name, document_url } = req.body;
    const updated = await ChecklistService.updateChecklistItem(req.params.itemId, {
      status,
      notes,
      file_name,
      document_url,
    });

    res.json({
      success: true,
      data: updated,
      message: 'Checklist item updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
