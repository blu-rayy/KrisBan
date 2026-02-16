import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createSprint,
  getSprints,
  getSprintById,
  updateSprint,
  deleteSprint,
  addTeamPlan,
  updateTeamPlan,
  removeTeamPlan,
  cleanupDuplicates
} from '../controllers/sprintsController.js';

const router = express.Router();

// All sprint routes require authentication
router.use(protect);

// Sprint routes
router.post('/', createSprint);
router.get('/', getSprints);
router.get('/:id', getSprintById);
router.put('/:id', updateSprint);
router.delete('/:id', deleteSprint);

// Team Plan routes
router.post('/:id/team-plans', addTeamPlan);
router.put('/team-plans/:teamPlanId', updateTeamPlan);
router.delete('/team-plans/:teamPlanId', removeTeamPlan);

// Cleanup routes
router.post('/cleanup/duplicates', cleanupDuplicates);

export default router;
