import express from 'express';
import { body, query } from 'express-validator';
import { ChatController } from '../controllers/ChatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// POST /chats/channels — create project channel
router.post(
  '/channels',
  [body('projectId').notEmpty(), body('name').notEmpty().trim()],
  ChatController.createProjectChannel
);

// GET /chats/channels?projectId=X — list channels
router.get(
  '/channels',
  [query('projectId').optional()],
  ChatController.listProjectChannels
);

// GET /chats/channels/:channelId — get channel details
router.get('/channels/:channelId', ChatController.getChannel);

// POST /chats/channels/:channelId/messages — send message
router.post(
  '/channels/:channelId/messages',
  [body('content').notEmpty().trim()],
  ChatController.sendChannelMessage
);

// GET /chats/channels/:channelId/messages — list messages (paginated)
router.get(
  '/channels/:channelId/messages',
  [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })],
  ChatController.listMessages
);

// DELETE /chats/channels/:channelId/messages/:messageId — delete message
router.delete('/channels/:channelId/messages/:messageId', ChatController.deleteChannelMessage);

export default router;
