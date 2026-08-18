import express from 'express';
import { body, param, query } from 'express-validator';
import { ChatController } from '../controllers/ChatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// List channels (by workspaceId or projectId)
router.get('/channels', ChatController.listChannels);

// Create channel
router.post(
  '/channels',
  [
    body('name').notEmpty().trim().toLowerCase(),
    body('workspace').notEmpty(),
    body('type').optional().isIn(['public', 'private', 'direct']),
  ],
  ChatController.createChannel
);

// Get channel messages
router.get(
  '/channels/:channelId/messages',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  ChatController.getChannelMessages
);

// Send message
router.post(
  '/messages',
  [
    body('channel').notEmpty(),
    body('content').notEmpty().trim(),
    body('type').optional().isIn(['text', 'image', 'file', 'code']),
    body('mentions').optional().isArray(),
  ],
  ChatController.sendMessage
);

// Edit message
router.put(
  '/messages/:messageId',
  [
    param('messageId').notEmpty(),
    body('content').notEmpty().trim(),
  ],
  ChatController.editMessage
);

// Delete message
router.delete('/messages/:messageId', ChatController.deleteMessage);

// Add reaction
router.post(
  '/messages/:messageId/reactions',
  [
    param('messageId').notEmpty(),
    body('emoji').notEmpty(),
  ],
  ChatController.addReaction
);

// Create direct message (legacy, use /dms instead)
router.post(
  '/direct-messages',
  [body('recipientId').notEmpty()],
  ChatController.createDirectMessage
);

// Typing indicator
router.post('/channels/:channelId/typing', (req, res) => {
  const { isTyping } = req.body;
  req.app.get('io')?.to(`channel:${req.params.channelId}`).emit('chat:typing', {
    userId: req.userId,
    channelId: req.params.channelId,
    isTyping: Boolean(isTyping),
  });
  res.json({ ok: true });
});

export default router;