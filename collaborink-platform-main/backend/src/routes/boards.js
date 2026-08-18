// backend/src/routes/boards.js
import express from 'express';
import { BoardController } from '../controllers/BoardController.js';
import { authMiddleware } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

// Get board for project
router.get('/:projectId', BoardController.getBoard);

// Add column
router.post(
  '/:projectId/columns',
  [ body('title').notEmpty().trim() ],
  BoardController.addColumn
);

// Update column
router.put('/:projectId/columns/:columnId', BoardController.updateColumn);

// Reorder columns
router.post('/:projectId/columns/reorder', BoardController.reorderColumns);

// Task moved event (persist/log and broadcast)
router.post('/:projectId/task/move', BoardController.taskMoved);

export default router;