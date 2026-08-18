import Notification from '../models/Notification.js';

export class NotificationController {
  /**
   * Internal helper called from other controllers to create + push a real-time notification.
   * Non-critical: errors are silently swallowed so they never break the calling request.
   */
  static async createNotification({ type, recipient, sender, title, message, link, resourceId, resourceType, io }) {
    try {
      const notification = await Notification.create({
        type,
        recipient,
        sender,
        title,
        message,
        link,
        resourceId,
        resourceType,
      });

      if (io && recipient) {
        io.to(`user:${recipient}`).emit('notification:new', {
          _id: notification._id,
          type,
          title,
          message,
          link,
          createdAt: notification.createdAt,
        });
      }

      return notification;
    } catch {
      // swallow — notifications must not break the calling request
    }
  }

  static async listNotifications(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = 25;
      const skip = (page - 1) * limit;

      const query = { recipient: req.userId };
      if (req.query.unread === 'true') query.isRead = false;
      if (req.query.type) query.type = req.query.type;

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .populate('sender', 'firstName lastName avatar')
          .sort({ isRead: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments(query),
      ]);

      res.json({ notifications, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const unreadCount = await Notification.countDocuments({
        recipient: req.userId,
        isRead: false,
      });
      res.json({ unreadCount });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async markAsRead(req, res) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.notificationId, recipient: req.userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );
      if (!notification) return res.status(404).json({ message: 'Notification not found' });
      res.json(notification);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async markAllAsRead(req, res) {
    try {
      await Notification.updateMany(
        { recipient: req.userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      res.json({ message: 'All notifications marked as read' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async deleteNotification(req, res) {
    try {
      await Notification.findOneAndDelete({
        _id: req.params.notificationId,
        recipient: req.userId,
      });
      res.json({ message: 'Notification deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}
