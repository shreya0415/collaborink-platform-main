import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import Board from '../models/Board.js';
import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';

export class ProjectService {
  static async createProject(projectData, userId) {
    const project = new Project({
      ...projectData,
      owner: userId,
      members: [{ user: userId, role: 'owner' }],
    });

    await project.save();

    // Auto-create Board with 3 default columns
    const board = new Board({
      project: project._id,
      workspace: projectData.workspace,
      createdBy: userId,
      columns: [
        { title: 'To Do', color: '#EEF2FF', order: 0 },
        { title: 'In Progress', color: '#FEF3C7', order: 1 },
        { title: 'Done', color: '#D1FAE5', order: 2 },
      ],
    });
    await board.save();

    // Store board ref in project
    project.board = board._id;
    await project.save();

    // Auto-create #general channel for the project
    const generalChannel = new Channel({
      name: 'general',
      description: 'General discussion',
      project: project._id,
      workspace: projectData.workspace,
      creator: userId,
      members: [{ user: userId, role: 'owner' }],
    });
    await generalChannel.save();

    // Add project to workspace's projects array
    await Workspace.findByIdAndUpdate(projectData.workspace, {
      $addToSet: { projects: project._id },
    });

    await Activity.create({
      workspace: projectData.workspace,
      user: userId,
      type: 'project_created',
      action: `Created project "${project.name}"`,
      resource: 'project',
      resourceId: project._id,
    });

    return project.populate('owner members.user');
  }

  static async getProject(projectId) {
    return await Project.findById(projectId)
      .populate('owner')
      .populate('members.user')
      .populate('team');
  }

  static async getProjectTasks(projectId, filters = {}) {
    const query = { project: projectId };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assignee) query.assignee = filters.assignee;

    return await Task.find(query)
      .populate('assignee')
      .populate('creator')
      .sort({ priority: -1, dueDate: 1 });
  }

  static async updateProject(projectId, updateData, userId) {
    const project = await Project.findByIdAndUpdate(
      projectId,
      updateData,
      { new: true }
    ).populate('owner members.user');

    await Activity.create({
      workspace: project.workspace,
      user: userId,
      type: 'project_updated',
      action: 'Updated project',
      resource: 'project',
      resourceId: projectId,
    });

    return project;
  }

  static async addMember(projectId, userId, role = 'member', addedBy) {
    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        $push: {
          members: { user: userId, role },
        },
      },
      { new: true }
    ).populate('members.user');

    // Log activity
    await Activity.create({
      workspace: project.workspace,
      user: addedBy,
      type: 'member_joined',
      action: 'Added member to project',
      resource: 'project',
      resourceId: projectId,
      relatedUser: userId,
    });

    return project;
  }

  static async removeMember(projectId, userId, removedBy) {
    const project = await Project.findByIdAndUpdate(
      projectId,
      {
        $pull: {
          members: { user: userId },
        },
      },
      { new: true }
    );

    // Log activity
    await Activity.create({
      workspace: project.workspace,
      user: removedBy,
      type: 'member_joined', // Could be 'member_removed' if you add it
      action: 'Removed member from project',
      resource: 'project',
      resourceId: projectId,
      relatedUser: userId,
    });

    return project;
  }

  static async deleteProject(projectId, userId) {
    // Delete all tasks in project
    await Task.deleteMany({ project: projectId });

    // Delete project
    const project = await Project.findByIdAndDelete(projectId);

    await Activity.create({
      workspace: project.workspace,
      user: userId,
      type: 'project_deleted',
      action: 'Deleted project',
      resource: 'project',
      resourceId: projectId,
    });

    return project;
  }

  static async getProjectStats(projectId) {
    const tasks = await Task.find({ project: projectId });

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
      overdue: tasks.filter(t => t.dueDate < new Date() && t.status !== 'done').length,
    };

    return stats;
  }
}