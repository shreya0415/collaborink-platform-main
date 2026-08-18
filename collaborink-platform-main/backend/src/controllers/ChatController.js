import { ChatService } from '../services/ChatService.js';
import Channel from '../models/Channel.js';
import Message from '../models/Message.js';
import Project from '../models/Project.js';

export class ChatController {
  static async createChannel(req, res) {
    try {
      const channel = await ChatService.createChannel(req.body, req.userId);
      res.status(201).json(channel);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getChannelMessages(req, res) {
    try {
      const messages = await ChatService.getChannelMessages(
        req.params.channelId,
        req.query.page,
        req.query.limit
      );
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async sendMessage(req, res) {
    try {
      const message = await ChatService.sendMessage(req.body, req.userId);
      // Broadcast to channel room
      req.app.get('io')?.to(`channel:${req.body.channel}`).emit('chat:message', message);
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async listChannels(req, res) {
    try {
      const query = {};
      if (req.query.workspaceId) query.workspace = req.query.workspaceId;
      if (req.query.projectId) query.project = req.query.projectId;
      const channels = await Channel.find(query)
        .populate('creator', 'firstName lastName')
        .sort({ createdAt: 1 });
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async editMessage(req, res) {
    try {
      const { content } = req.body;
      const message = await ChatService.editMessage(
        req.params.messageId,
        content,
        req.userId
      );
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteMessage(req, res) {
    try {
      const message = await ChatService.deleteMessage(req.params.messageId, req.userId);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async addReaction(req, res) {
    try {
      const { emoji } = req.body;
      const message = await ChatService.addReaction(
        req.params.messageId,
        emoji,
        req.userId
      );
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createDirectMessage(req, res) {
    try {
      const { recipientId } = req.body;
      const dm = await ChatService.createDirectMessage(recipientId, req.userId);
      res.status(201).json(dm);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // --- Project-channel routes (/api/chats) ---

  static async createProjectChannel(req, res) {
    try {
      const { projectId, name, description } = req.body;
      if (!name || !projectId) {
        return res.status(400).json({ message: 'projectId and name are required' });
      }

      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const isMember = project.members.some(m => m.user.toString() === req.userId);
      if (!isMember) return res.status(403).json({ message: 'Not a member of this project' });

      const channel = new Channel({
        name: name.toLowerCase().trim(),
        description,
        project: projectId,
        workspace: project.workspace,
        creator: req.userId,
        members: [{ user: req.userId, role: 'owner' }],
      });
      await channel.save();
      await channel.populate('project');
      res.status(201).json(channel);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async listProjectChannels(req, res) {
    try {
      const { projectId } = req.query;
      const query = {};
      if (projectId) query.project = projectId;
      const channels = await Channel.find(query)
        .populate('project')
        .sort({ createdAt: 1 });
      res.json({ channels });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getChannel(req, res) {
    try {
      const channel = await Channel.findById(req.params.channelId).populate('project');
      if (!channel) return res.status(404).json({ message: 'Channel not found' });
      res.json(channel);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async sendChannelMessage(req, res) {
    try {
      const { channelId } = req.params;
      const { content } = req.body;
      if (!content) return res.status(400).json({ message: 'content is required' });

      const channel = await Channel.findById(channelId);
      if (!channel) return res.status(404).json({ message: 'Channel not found' });

      if (channel.project) {
        const project = await Project.findById(channel.project);
        if (project) {
          const isMember = project.members.some(m => m.user.toString() === req.userId);
          if (!isMember) return res.status(403).json({ message: 'Not a member of this project' });
        }
      }

      const message = new Message({ channel: channelId, content, author: req.userId });
      await message.save();
      await message.populate('author', 'email firstName lastName avatar');

      await Channel.findByIdAndUpdate(channelId, { $push: { messages: message._id } });

      req.app.get('io')?.to(`channel:${channelId}`).emit('chat:message', {
        channelId,
        message,
        projectId: channel.project,
      });

      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async listMessages(req, res) {
    try {
      const { channelId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const channel = await Channel.findById(channelId);
      if (!channel) return res.status(404).json({ message: 'Channel not found' });

      const total = await Message.countDocuments({ channel: channelId, isDeleted: false });
      const messages = await Message.find({ channel: channelId, isDeleted: false })
        .populate('author', 'email firstName lastName avatar')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit);

      res.json({ messages, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteChannelMessage(req, res) {
    try {
      const { channelId, messageId } = req.params;

      const message = await Message.findById(messageId);
      if (!message) return res.status(404).json({ message: 'Message not found' });

      const channel = await Channel.findById(channelId);
      if (!channel) return res.status(404).json({ message: 'Channel not found' });

      const isSender = message.author.toString() === req.userId;
      let isLead = false;
      if (channel.project) {
        const project = await Project.findById(channel.project);
        if (project) {
          const member = project.members.find(m => m.user.toString() === req.userId);
          isLead = member && (member.role === 'owner' || member.role === 'lead');
        }
      }
      if (!isSender && !isLead) {
        return res.status(403).json({ message: 'Not authorized to delete this message' });
      }

      await Message.findByIdAndDelete(messageId);
      await Channel.findByIdAndUpdate(channelId, { $pull: { messages: messageId } });

      req.app.get('io')?.to(`channel:${channelId}`).emit('message:deleted', {
        channelId,
        messageId,
        projectId: channel.project,
      });

      res.json({ message: 'Message deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}