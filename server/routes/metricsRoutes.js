import express from 'express';
import { MetricsService } from '../services/metricsService.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/metrics/student
 * Student pipeline and checklist statistics
 */
router.get('/student', requireAuth, async (req, res, next) => {
  try {
    const stats = await MetricsService.getStudentMetrics(req.user.id);
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/metrics/operational
 * Operator / Admin system metrics (staleness, SLA, total funding)
 */
router.get('/operational', requireRole(['operator', 'admin']), async (req, res, next) => {
  try {
    const stats = await MetricsService.getOperationalMetrics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
