import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMyStats, updateMyStats, getUserStats } from '../controllers/users.controller.js';

const router = Router();

router.get('/me/stats', requireAuth, getMyStats);
router.patch('/me/stats', requireAuth, updateMyStats);
router.get('/:userId/stats', requireAuth, getUserStats);

export default router;
