import DirectMessage from '../models/DirectMessage.js';
import Message from '../models/Message.js';

export class DirectMessageController {
  static async sendDM(req, res) {
    try {
      const { recipientId, content } = req.body;
      if (!recipientId || !content?.trim()) {
        return res.status(400).json({ message: 'recipientId and content are required' });
      }

      // Find or create DM thread
      let thread = await DirectMessage.findOne({
        participants: { $all: [req.userId, recipientId] },
      });

      if (!thread) {
        thread = new DirectMessage({ participants: [req.userId, recipientId] });
        await thread.save();
      }

      const message = new Message({
        directMessage: thread._id,
        author: req.userId,
        content: content.trim(),
      });
      await message.save();
      await message.populate('author', 'firstName lastName avatar');

      await DirectMessage.findByIdAndUpdate(thread._id, {
        $push: { messages: message._id },
        lastMessage: { content: content.trim(), author: req.userId, timestamp: new Date() },
      });

      // Emit to both participants
      const io = req.app.get('io');
      if (io) {
        thread.participants.forEach(participantId => {
          io.to(`user:${participantId.toString()}`).emit('dm:message', {
            threadId: thread._id,
            message,
          });
        });
      }

      res.status(201).json({ thread, message });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async listThreads(req, res) {
    try {
      const threads = await DirectMessage.find({
        participants: req.userId,
      })
        .populate('participants', 'firstName lastName avatar status')
        .sort({ updatedAt: -1 })
        .limit(50);

      res.json(threads);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getThread(req, res) {
    try {
      const { threadId } = req.params;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = 50;
      const skip = (page - 1) * limit;

      const thread = await DirectMessage.findOne({
        _id: threadId,
        participants: req.userId,
      }).populate('participants', 'firstName lastName avatar');

      if (!thread) return res.status(404).json({ message: 'Thread not found' });

      const messages = await Message.find({ directMessage: threadId, isDeleted: false })
        .populate('author', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({ thread, messages: messages.reverse() });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async deleteMessage(req, res) {
    try {
      const message = await Message.findById(req.params.messageId);
      if (!message) return res.status(404).json({ message: 'Message not found' });
      if (message.author.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      message.isDeleted = true;
      message.content = '[deleted]';
      await message.save();
      res.json({ message: 'Message deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}
