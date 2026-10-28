import express from 'express';
import { AuditService } from '../services/auditService.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/audit-logs
 * Operator and Admin query audit trail
 */
router.get('/', requireRole(['operator', 'admin']), async (req, res, next) => {
  try {
    const filters = {
      entity_type: req.query.entity_type,
      action: req.query.action,
      actor_role: req.query.actor_role,
      limit: req.query.limit,
    };

    const logs = await AuditService.getLogs(filters);

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
