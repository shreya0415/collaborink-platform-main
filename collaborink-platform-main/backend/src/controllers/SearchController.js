import Task from '../models/Task.js';
import Project from '../models/Project.js';

export class SearchController {
  static async searchTasks(req, res) {
    try {
      const {
        q, projectId, status, priority, assigneeId,
        dueDateFrom, dueDateTo, page = 1,
      } = req.query;

      const query = { archived: { $ne: true } };

      if (projectId) query.project = projectId;

      if (q) {
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ];
      }

      if (status) {
        query.status = Array.isArray(status) ? { $in: status } : status;
      }

      if (priority) {
        query.priority = Array.isArray(priority) ? { $in: priority } : priority;
      }

      if (assigneeId) query.assignee = assigneeId;

      if (dueDateFrom || dueDateTo) {
        query.dueDate = {};
        if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
        if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
      }

      const limit = 25;
      const skip = (Math.max(1, parseInt(page)) - 1) * limit;

      const [tasks, total] = await Promise.all([
        Task.find(query)
          .populate('assignee', 'firstName lastName avatar')
          .populate('createdBy', 'firstName lastName')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit),
        Task.countDocuments(query),
      ]);

      res.json({ tasks, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async searchProjects(req, res) {
    try {
      const { q, workspaceId, page = 1 } = req.query;
      const limit = 25;
      const skip = (Math.max(1, parseInt(page)) - 1) * limit;

      const query = {
        archived: { $ne: true },
        'members.user': req.userId,
      };

      if (workspaceId) query.workspace = workspaceId;

      if (q) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ];
      }

      const [projects, total] = await Promise.all([
        Project.find(query)
          .populate('owner', 'firstName lastName avatar')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit),
        Project.countDocuments(query),
      ]);

      res.json({ projects, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}
