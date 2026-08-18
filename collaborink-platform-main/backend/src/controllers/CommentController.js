import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

export class CommentController {
  static async createComment(req, res) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ message: 'Content is required' });

      const task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });

      const comment = new Comment({
        task: taskId,
        author: req.userId,
        content: content.trim(),
      });
      await comment.save();
      await comment.populate('author', 'firstName lastName avatar');

      // Add comment ref to task
      await Task.findByIdAndUpdate(taskId, { $push: { comments: comment._id } });

      // Log activity
      await Activity.create({
        user: req.userId,
        type: 'comment_added',
        action: 'Added a comment',
        resource: 'task',
        resourceId: taskId,
      }).catch(() => {});

      // Notify task creator and watchers (excluding commenter)
      const recipients = [...(task.watchers || []), task.createdBy]
        .filter(id => id && id.toString() !== req.userId)
        .map(id => id.toString());
      const unique = [...new Set(recipients)];

      if (unique.length > 0) {
        await Notification.insertMany(
          unique.map(recipientId => ({
            recipient: recipientId,
            sender: req.userId,
            type: 'comment_added',
            title: 'New comment',
            message: `Someone commented on "${task.title}"`,
            resourceId: taskId,
            resourceType: 'task',
            link: `/board/${task.project}?taskId=${taskId}`,
          }))
        ).catch(() => {});

        // Emit notification events
        const io = req.app.get('io');
        if (io) {
          unique.forEach(recipientId => {
            io.to(`user:${recipientId}`).emit('notification:new', {
              type: 'comment_added',
              message: `Someone commented on "${task.title}"`,
            });
          });
        }
      }

      // Emit to task room
      req.app.get('io')?.to(`task:${taskId}`).emit('comment:added', comment);

      res.status(201).json(comment);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async listComments(req, res) {
    try {
      const { taskId } = req.params;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = 50;
      const skip = (page - 1) * limit;

      const comments = await Comment.find({ task: taskId, isDeleted: false })
        .populate('author', 'firstName lastName avatar')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit);

      res.json(comments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async deleteComment(req, res) {
    try {
      const comment = await Comment.findById(req.params.commentId);
      if (!comment) return res.status(404).json({ message: 'Comment not found' });
      if (comment.author.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      comment.isDeleted = true;
      comment.deletedAt = new Date();
      await comment.save();

      res.json({ message: 'Comment deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async listTaskActivity(req, res) {
    try {
      const { taskId } = req.params;
      const activities = await Activity.find({ resourceId: taskId, resource: 'task' })
        .populate('user', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .limit(50);
      res.json(activities);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}
