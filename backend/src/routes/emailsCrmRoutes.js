import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getSmes,
  getPointPeople,
  createSme,
  updateSme,
  deleteSme,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getSmeLogsForSme,
  createSmeLog,
  updateSmeLog,
  deleteSmeLog
} from '../controllers/emailsCrmController.js';

const router = express.Router();

router.use(protect);

router.get('/smes', getSmes);
router.get('/point-people', getPointPeople);
router.post('/smes', createSme);
router.put('/smes/:id', updateSme);
router.delete('/smes/:id', deleteSme);

router.get('/smes/:id/logs', getSmeLogsForSme);
router.post('/smes/:id/logs', createSmeLog);
router.put('/sme-logs/:logId', updateSmeLog);
router.delete('/sme-logs/:logId', deleteSmeLog);

router.get('/templates', getTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

export default router;
