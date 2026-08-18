import express from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { CommentController } from '../controllers/CommentController.js';

const router = express.Router();
router.use(authMiddleware);

// List comments for a task
router.get('/tasks/:taskId', CommentController.listComments);

// List activity for a task
router.get('/tasks/:taskId/activity', CommentController.listTaskActivity);

// Create comment on a task
router.post(
  '/tasks/:taskId',
  [body('content').notEmpty().trim().withMessage('Content is required')],
  CommentController.createComment
);

// Delete comment
router.delete('/:commentId', CommentController.deleteComment);

export default router;
