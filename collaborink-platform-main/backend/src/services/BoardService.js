// backend/src/services/BoardService.js
import Board from '../models/Board.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';

export class BoardService {
  static async getBoardByProject(projectId) {
    let board = await Board.findOne({ project: projectId });
    if (!board) {
      const project = await Project.findById(projectId);
      if (!project) throw new Error('Project not found');
      board = new Board({
        project: projectId,
        workspace: project.workspace,
        createdBy: project.owner,
        columns: [
          { title: 'To Do', order: 0 },
          { title: 'In Progress', order: 1 },
          { title: 'Done', order: 2 },
        ],
      });
      await board.save();
    }
    return board;
  }

  static async addColumn(projectId, title, createdBy, color = '#EEF2FF') {
    const board = await this.getBoardByProject(projectId);
    const maxOrder = board.columns.length ? Math.max(...board.columns.map(c => c.order)) : -1;
    board.columns.push({ title, color, order: maxOrder + 1 });
    await board.save();

    await Activity.create({
      workspace: board.workspace,
      user: createdBy,
      type: 'board_updated',
      action: `Added column "${title}"`,
      resource: 'board',
      resourceId: board._id,
    });

    return board;
  }

  static async updateColumn(projectId, columnId, patch) {
    const board = await this.getBoardByProject(projectId);
    const col = board.columns.id(columnId);
    if (!col) throw new Error('Column not found');
    if (patch.title !== undefined) col.title = patch.title;
    if (patch.color !== undefined) col.color = patch.color;
    if (patch.settings !== undefined) col.settings = patch.settings;
    await board.save();
    return board;
  }

  static async reorderColumns(projectId, orderedColumnIds) {
    const board = await this.getBoardByProject(projectId);
    board.columns.sort((a, b) => orderedColumnIds.indexOf(a._id.toString()) - orderedColumnIds.indexOf(b._id.toString()));
    board.columns.forEach((c, idx) => { c.order = idx; });
    await board.save();
    return board;
  }

  static async notifyTaskMoved(projectId, taskId, fromColumnId, toColumnId, position, userId) {
    const board = await this.getBoardByProject(projectId);
    await Activity.create({
      workspace: board.workspace,
      user: userId,
      type: 'task_moved',
      action: 'Moved task',
      resource: 'task',
      resourceId: taskId,
      details: { fromColumnId, toColumnId, position },
    });
    return { boardId: board._id };
  }
}