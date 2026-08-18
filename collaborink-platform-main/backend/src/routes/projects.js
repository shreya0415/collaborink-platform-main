import express from 'express';
import { body, param, query } from 'express-validator';
import { ProjectController } from '../controllers/ProjectController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Middleware
router.use(authMiddleware);

// List projects (filter by workspaceId query param or user membership)
router.get('/', async (req, res) => {
  try {
    const query = { archived: { $ne: true } };
    if (req.query.workspaceId) {
      query.workspace = req.query.workspaceId;
    } else {
      query['members.user'] = req.userId;
    }
    const projects = await (await import('../models/Project.js')).default
      .find(query)
      .populate('owner members.user board')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create project
router.post(
  '/',
  [
    body('name').notEmpty().trim(),
    body('workspace').notEmpty(),
    body('description').optional().trim(),
  ],
  ProjectController.createProject
);

// Get project
router.get('/:projectId', ProjectController.getProject);

// Get project tasks
router.get(
  '/:projectId/tasks',
  [
    query('status').optional(),
    query('priority').optional(),
    query('assignee').optional(),
  ],
  ProjectController.getProjectTasks
);

// Get project stats
router.get('/:projectId/stats', ProjectController.getProjectStats);

// Update project
router.put(
  '/:projectId',
  [
    param('projectId').notEmpty(),
    body('name').optional().trim(),
    body('description').optional().trim(),
  ],
  ProjectController.updateProject
);

// Add member to project
router.post(
  '/:projectId/members',
  [
    param('projectId').notEmpty(),
    body('userId').notEmpty(),
    body('role').optional().isIn(['owner', 'lead', 'member']),
  ],
  ProjectController.addMember
);

// Remove member from project
router.delete(
  '/:projectId/members/:memberId',
  ProjectController.removeMember
);

// Delete project
router.delete('/:projectId', ProjectController.deleteProject);

export default router;