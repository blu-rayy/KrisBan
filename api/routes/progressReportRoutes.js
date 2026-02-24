import express from 'express';
import {
  createProgressReport,
  getProgressReports,
  getProgressReportById,
  updateProgressReport,
  deleteProgressReport,
  getProgressReportSummary,
  getLastWeekProgressStats
} from '../controllers/progressReportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// GET routes
router.get('/stats/summary', getProgressReportSummary);
router.get('/stats/last-week', getLastWeekProgressStats);
router.get('/:id', getProgressReportById);
router.get('/', getProgressReports);

// POST route
router.post('/', createProgressReport);

// PUT route
router.put('/:id', updateProgressReport);

// DELETE route
router.delete('/:id', deleteProgressReport);

export default router;
