// backend/src/routes/tasks.js
import express from 'express';
import { body, query } from 'express-validator';
import { TaskController } from '../controllers/TaskController.js';
import { ActivityController } from '../controllers/ActivityController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Create task
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('title is required'),
    body('project').notEmpty().withMessage('project is required'),
  ],
  TaskController.createTask
);

// List / search tasks
router.get('/', TaskController.searchTasks);

// Get task
router.get('/:taskId', TaskController.getTask);

// Update task
router.put('/:taskId', TaskController.updateTask);

// Update task status
router.patch('/:taskId/status', TaskController.updateTaskStatus);

// Delete task
router.delete('/:taskId', TaskController.deleteTask);

// Add attachment to task
router.post('/:taskId/attachments', async (req, res) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ message: 'fileId is required' });
    const Task = (await import('../models/Task.js')).default;
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $addToSet: { attachments: fileId } },
      { new: true }
    ).populate('attachments');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List activities for a task
router.get(
  '/:taskId/activities',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  ActivityController.listActivities
);

// Remove attachment from task
router.delete('/:taskId/attachments/:fileId', async (req, res) => {
  try {
    const Task = (await import('../models/Task.js')).default;
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $pull: { attachments: req.params.fileId } },
      { new: true }
    ).populate('attachments');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;