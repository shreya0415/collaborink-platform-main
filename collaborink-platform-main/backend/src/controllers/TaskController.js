import Task from '../models/Task.js';
import { validationResult } from 'express-validator';
import { ActivityController } from './ActivityController.js';
import { NotificationController } from './NotificationController.js';

export class TaskController {
  static async createTask(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const payload = {
        title: req.body.title,
        description: req.body.description,
        project: req.body.project,
        priority: req.body.priority,
        dueDate: req.body.dueDate,
        assignee: req.body.assignee,
        createdBy: req.userId,
      };
      if (req.body.column) payload.column = req.body.column;
      if (typeof req.body.position !== 'undefined') payload.position = req.body.position;

      const task = new Task(payload);
      await task.save();

      const populated = await Task.findById(task._id).populate('assignee createdBy');

      ActivityController.logTaskCreated(task._id, req.userId, req.app.get('io'));

      // Notify assignee if different from creator
      if (payload.assignee && payload.assignee.toString() !== req.userId) {
        NotificationController.createNotification({
          type: 'task_assigned',
          recipient: payload.assignee,
          sender: req.userId,
          title: 'Task assigned to you',
          message: `You were assigned to "${payload.title}"`,
          link: `/board/${payload.project}?taskId=${task._id}`,
          resourceId: task._id,
          resourceType: 'task',
          io: req.app.get('io'),
        });
      }

      res.status(201).json(populated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getTask(req, res) {
    try {
      const task = await Task.findById(req.params.taskId).populate('assignee createdBy watchers attachments');
      if (!task) return res.status(404).json({ message: 'Task not found' });
      res.json(task);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async updateTask(req, res) {
    try {
      const update = { ...req.body };
      const allowed = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'column', 'position', 'labels', 'archived', 'metadata'];
      Object.keys(update).forEach(k => { if (!allowed.includes(k)) delete update[k]; });

      const oldTask = await Task.findById(req.params.taskId);
      if (!oldTask) return res.status(404).json({ message: 'Task not found' });

      const task = await Task.findByIdAndUpdate(req.params.taskId, update, { new: true }).populate('assignee createdBy watchers attachments');

      const changedFields = Object.keys(update);

      // Log column change as a move
      if (update.column && update.column.toString() !== oldTask.column?.toString()) {
        ActivityController.logTaskMoved(task._id, req.userId, {
          fromColumn: oldTask.column,
          toColumn: update.column,
          fromPosition: oldTask.position,
          toPosition: update.position,
        }, req.app.get('io'));
      } else if (changedFields.length > 0) {
        // Log assignee change separately
        if (update.assignee && update.assignee.toString() !== oldTask.assignee?.toString()) {
          ActivityController.logTaskAssigned(task._id, req.userId, update.assignee, req.app.get('io'));
          // Notify the newly assigned user
          NotificationController.createNotification({
            type: 'task_assigned',
            recipient: update.assignee,
            sender: req.userId,
            title: 'Task assigned to you',
            message: `You were assigned to "${task.title}"`,
            link: `/board/${task.project}?taskId=${task._id}`,
            resourceId: task._id,
            resourceType: 'task',
            io: req.app.get('io'),
          });
        } else {
          ActivityController.logTaskUpdated(task._id, req.userId, changedFields, req.app.get('io'));
        }
      }

      res.json(task);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async updateTaskStatus(req, res) {
    try {
      const { status } = req.body;
      const task = await Task.findByIdAndUpdate(req.params.taskId, { status }, { new: true }).populate('assignee createdBy');
      if (!task) return res.status(404).json({ message: 'Task not found' });

      ActivityController.logTaskUpdated(task._id, req.userId, ['status'], req.app.get('io'));

      res.json(task);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async deleteTask(req, res) {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });

      // Log before deleting so we have the taskId for the activity record
      await ActivityController._log({
        taskId: task._id,
        action: 'deleted',
        performedBy: req.userId,
        metadata: { title: task.title },
        io: req.app.get('io'),
      });

      await Task.findByIdAndDelete(req.params.taskId);
      res.json({ message: 'Task deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async searchTasks(req, res) {
    try {
      const { projectId, query } = req.query;
      const q = { project: projectId, $text: { $search: query } };
      const results = await Task.find(q).limit(50);
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}
