import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import Notification from '../models/Notification.js';

export class TaskService {
  static async createTask(taskData, userId) {
    const task = new Task({
      ...taskData,
      createdBy: userId,
    });

    await task.save();
    await task.populate('assignee createdBy');

    // Create notification for assignee
    if (taskData.assignee) {
      await Notification.create({
        recipient: taskData.assignee,
        sender: userId,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `You have been assigned to "${task.title}"`,
        resourceId: task._id,
        resourceType: 'task',
        workspace: taskData.project, // Should be workspace, but using project for simplicity
      });
    }

    await Activity.create({
      user: userId,
      type: 'task_created',
      action: `Created task "${task.title}"`,
      resource: 'task',
      resourceId: task._id,
    });

    return task;
  }

  static async updateTask(taskId, updateData, userId) {
    const task = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    ).populate('assignee creator');

    // Create notification if assignee changed
    if (updateData.assignee && updateData.assignee !== task.assignee) {
      await Notification.create({
        recipient: updateData.assignee,
        sender: userId,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `You have been assigned to "${task.title}"`,
        resourceId: taskId,
        resourceType: 'task',
      });
    }

    // Log activity
    await Activity.create({
      user: userId,
      type: 'task_updated',
      action: 'Updated task',
      resource: 'task',
      resourceId: taskId,
    }).catch(() => {});

    return task;
  }

  static async updateTaskStatus(taskId, newStatus, userId) {
    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        status: newStatus,
        ...(newStatus === 'done' && { completedDate: new Date(), progress: 100 }),
      },
      { new: true }
    );

    // Notify watchers
    if (task.watchers.length > 0) {
      await Notification.insertMany(
        task.watchers.map(watcherId => ({
          recipient: watcherId,
          sender: userId,
          type: 'task_updated',
          title: 'Task Updated',
          message: `Task "${task.title}" status changed to ${newStatus}`,
          resourceId: taskId,
          resourceType: 'task',
        }))
      );
    }

    return task;
  }

  static async getTask(taskId) {
    return await Task.findById(taskId)
      .populate('assignee createdBy watchers')
      .populate({ path: 'comments', populate: { path: 'author', select: 'firstName lastName avatar' } });
  }

  static async deleteTask(taskId, userId) {
    const task = await Task.findByIdAndDelete(taskId);

    await Activity.create({
      user: userId,
      type: 'task_deleted',
      action: 'Deleted task',
      resource: 'task',
      resourceId: taskId,
    }).catch(() => {});

    return task;
  }

  static async addWatcher(taskId, userId) {
    return await Task.findByIdAndUpdate(
      taskId,
      { $addToSet: { watchers: userId } },
      { new: true }
    );
  }

  static async removeWatcher(taskId, userId) {
    return await Task.findByIdAndUpdate(
      taskId,
      { $pull: { watchers: userId } },
      { new: true }
    );
  }

  static async searchTasks(projectId, searchQuery) {
    return await Task.find({
      project: projectId,
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
      ],
    }).populate('assignee creator');
  }
}