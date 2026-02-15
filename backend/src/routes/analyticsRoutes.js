import express from 'express';
import { protect } from '../middleware/auth.js';
import { getDashboard } from '../controllers/analyticsController.js';

const router = express.Router();
router.get('/dashboard', protect, getDashboard);
export default router;
