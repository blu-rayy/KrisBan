import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createSprint,
  getSprints,
  getSprintById,
  updateSprint,
  deleteSprint,
  addTeamPlan,
  removeTeamPlan
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
router.delete('/team-plans/:teamPlanId', removeTeamPlan);

export default router;
