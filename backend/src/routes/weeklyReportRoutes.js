import express from 'express';
import {
  exportWeeklyReportDocxFile,
  exportWeeklyReportPdfFile,
  generateWeeklyReportDraft,
  getWeeklyReportByWeek,
  getWeeklyReports,
  saveWeeklyReportDraft
} from '../controllers/weeklyReportController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/', getWeeklyReports);
router.post('/generate', generateWeeklyReportDraft);
router.post('/:reportWeek/save', saveWeeklyReportDraft);
router.post('/:reportWeek/export-pdf', exportWeeklyReportPdfFile);
router.post('/:reportWeek/export-docx', exportWeeklyReportDocxFile);
router.get('/:reportWeek', getWeeklyReportByWeek);

export default router;
