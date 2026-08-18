import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { SearchController } from '../controllers/SearchController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/tasks', SearchController.searchTasks);
router.get('/projects', SearchController.searchProjects);

export default router;
