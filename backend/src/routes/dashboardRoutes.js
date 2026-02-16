import express from 'express';
import { getDashboard, getProgressReport } from '../controllers/dashboardController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.get('/', protect, getDashboard);
router.get('/admin/progress-report', protect, requireAdmin, getProgressReport);

export default router;
