import { Router } from 'express';
import authRouter from './auth.routes.js';
import usersRouter from './users.routes.js';
import leaderboardRouter from './leaderboard.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/leaderboard', leaderboardRouter);

export default router;
