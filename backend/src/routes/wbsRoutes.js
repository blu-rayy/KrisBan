import express from 'express';
import { getWbsState, saveWbsState, importBoard } from '../controllers/wbsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getWbsState);
router.put('/', saveWbsState);
router.post('/import', importBoard);

export default router;
