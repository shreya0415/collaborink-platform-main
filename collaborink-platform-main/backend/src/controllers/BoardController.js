// backend/src/controllers/BoardController.js
import { BoardService } from '../services/BoardService.js';

export class BoardController {
  static async getBoard(req, res) {
    try {
      const board = await BoardService.getBoardByProject(req.params.projectId);
      res.json(board);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async addColumn(req, res) {
    try {
      const { title, color } = req.body;
      const board = await BoardService.addColumn(req.params.projectId, title, req.userId, color);
      // emit via socket (server side will handle)
      req.app.get('io')?.to(`project:${req.params.projectId}`).emit('board:updated', board);
      res.status(201).json(board);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async updateColumn(req, res) {
    try {
      const board = await BoardService.updateColumn(req.params.projectId, req.params.columnId, req.body);
      req.app.get('io')?.to(`project:${req.params.projectId}`).emit('board:updated', board);
      res.json(board);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async reorderColumns(req, res) {
    try {
      const { orderedColumnIds } = req.body;
      const board = await BoardService.reorderColumns(req.params.projectId, orderedColumnIds);
      req.app.get('io')?.to(`project:${req.params.projectId}`).emit('board:updated', board);
      res.json(board);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async taskMoved(req, res) {
    try {
      const { taskId, fromColumnId, toColumnId, position } = req.body;
      const info = await BoardService.notifyTaskMoved(req.params.projectId, taskId, fromColumnId, toColumnId, position, req.userId);
      // emit an event so clients update their local tasks
      req.app.get('io')?.to(`project:${req.params.projectId}`).emit('task:moved', { taskId, fromColumnId, toColumnId, position });
      res.json(info);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}