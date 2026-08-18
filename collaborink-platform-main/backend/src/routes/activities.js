import express from 'express';
import { query } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { ActivityController } from '../controllers/ActivityController.js';

const router = express.Router();
router.use(authMiddleware);

// GET /tasks/:taskId/activities
router.get(
  '/tasks/:taskId',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  ActivityController.listActivities
);

export default router;
