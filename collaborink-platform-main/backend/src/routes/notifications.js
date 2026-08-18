import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { NotificationController } from '../controllers/NotificationController.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', NotificationController.listNotifications);
router.get('/count', NotificationController.getUnreadCount);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:notificationId', NotificationController.markAsRead);
router.delete('/:notificationId', NotificationController.deleteNotification);

export default router;
