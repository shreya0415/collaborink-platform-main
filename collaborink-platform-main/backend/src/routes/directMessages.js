import express from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../middleware/auth.js';
import { DirectMessageController } from '../controllers/DirectMessageController.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/', [
  body('recipientId').notEmpty(),
  body('content').notEmpty().trim(),
], DirectMessageController.sendDM);

router.get('/', DirectMessageController.listThreads);
router.get('/:threadId', DirectMessageController.getThread);
router.delete('/messages/:messageId', DirectMessageController.deleteMessage);

export default router;
