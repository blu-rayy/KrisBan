import express from 'express';
import {
  getRequirements,
  getOverallProgress,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  bulkSeed
} from '../controllers/requirementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Anyone can read
router.get('/overall-progress', getOverallProgress);
router.get('/', getRequirements);

// Admin-only writes — enforced in middleware below
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

router.post('/seed', adminOnly, bulkSeed);
router.post('/', adminOnly, createRequirement);
router.put('/:id', adminOnly, updateRequirement);
router.delete('/:id', adminOnly, deleteRequirement);

export default router;
