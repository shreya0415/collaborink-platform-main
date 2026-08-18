import { ProjectService } from '../services/ProjectService.js';
import { validationResult } from 'express-validator';

export class ProjectController {
  static async createProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const project = await ProjectService.createProject(req.body, req.userId);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getProject(req, res) {
    try {
      const project = await ProjectService.getProject(req.params.projectId);

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getProjectTasks(req, res) {
    try {
      const tasks = await ProjectService.getProjectTasks(
        req.params.projectId,
        req.query
      );
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateProject(req, res) {
    try {
      const project = await ProjectService.updateProject(
        req.params.projectId,
        req.body,
        req.userId
      );
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async addMember(req, res) {
    try {
      const { userId, role } = req.body;
      const project = await ProjectService.addMember(
        req.params.projectId,
        userId,
        role,
        req.userId
      );
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async removeMember(req, res) {
    try {
      const { userId } = req.body;
      const project = await ProjectService.removeMember(
        req.params.projectId,
        userId,
        req.userId
      );
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteProject(req, res) {
    try {
      await ProjectService.deleteProject(req.params.projectId, req.userId);
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getProjectStats(req, res) {
    try {
      const stats = await ProjectService.getProjectStats(req.params.projectId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}