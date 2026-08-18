import Activity from '../models/Activity.js';

// Maps the user-facing action name to the Activity model's type enum
const ACTION_TYPE_MAP = {
  created: 'task_created',
  updated: 'task_updated',
  moved: 'task_moved',
  deleted: 'task_deleted',
  assigned: 'task_updated',
};

export class ActivityController {
  // ── Internal helpers (called from TaskController, not HTTP routes) ────────

  static async logTaskCreated(taskId, userId, io) {
    return ActivityController._log({
      taskId,
      action: 'created',
      performedBy: userId,
      metadata: {},
      io,
    });
  }

  static async logTaskUpdated(taskId, userId, changedFields = [], io) {
    return ActivityController._log({
      taskId,
      action: 'updated',
      performedBy: userId,
      metadata: { fields: changedFields },
      io,
    });
  }

  static async logTaskMoved(taskId, userId, { fromColumn, toColumn, fromPosition, toPosition } = {}, io) {
    return ActivityController._log({
      taskId,
      action: 'moved',
      performedBy: userId,
      metadata: { fromColumn, toColumn, fromPosition, toPosition },
      io,
    });
  }

  static async logTaskAssigned(taskId, userId, assignedTo, io) {
    return ActivityController._log({
      taskId,
      action: 'assigned',
      performedBy: userId,
      metadata: { assignedTo },
      io,
    });
  }

  // ── HTTP handler ──────────────────────────────────────────────────────────

  static async listActivities(req, res) {
    try {
      const { taskId } = req.params;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 50);
      const skip = (page - 1) * limit;

      const [activities, total] = await Promise.all([
        Activity.find({ resourceId: taskId, resource: 'task' })
          .populate('user', 'firstName lastName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Activity.countDocuments({ resourceId: taskId, resource: 'task' }),
      ]);

      // Normalise field names: expose `performedBy` and `metadata`
      const normalised = activities.map(a => {
        const obj = a.toObject();
        return {
          ...obj,
          action: obj.action || obj.type,
          performedBy: obj.user,
          metadata: obj.details || {},
        };
      });

      res.json({
        activities: normalised,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  // ── Private helper ────────────────────────────────────────────────────────

  static async _log({ taskId, action, performedBy, metadata = {}, io } = {}) {
    try {
      const activity = await Activity.create({
        user: performedBy,
        type: ACTION_TYPE_MAP[action] || 'task_updated',
        action: `Task ${action}`,
        resource: 'task',
        resourceId: taskId,
        details: metadata,
      });

      if (io) {
        const populated = await Activity.findById(activity._id).populate('user', 'firstName lastName avatar');
        const obj = populated.toObject();
        io.to(`task:${taskId}`).emit('activity:added', {
          ...obj,
          performedBy: obj.user,
          action: obj.action,
          metadata: obj.details || {},
        });
      }

      return activity;
    } catch {
      // Activity logging must never break the main operation
    }
  }
}
