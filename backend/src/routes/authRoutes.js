import express from 'express';
import { register, login, changePassword, getMe, updateProfile, getUsers, createMember } from '../controllers/authController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getUsers);
router.post('/users', protect, requireAdmin, createMember);

export default router;
