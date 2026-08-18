import path from 'path';
import fs from 'fs';
import File from '../models/File.js';
import Task from '../models/Task.js';
import { UPLOAD_DIR } from '../middleware/upload.js';

export class FileController {
  static async uploadFile(req, res) {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      const { workspace, project, taskId } = req.body;
      if (!workspace) return res.status(400).json({ message: 'workspace is required' });

      const fileDoc = new File({
        workspace,
        project: project || undefined,
        uploadedBy: req.userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype.split('/')[0],
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: `/uploads/${req.file.filename}`,
      });
      await fileDoc.save();
      await fileDoc.populate('uploadedBy', 'firstName lastName avatar');

      if (taskId) {
        await Task.findByIdAndUpdate(taskId, { $addToSet: { attachments: fileDoc._id } });
      }

      res.status(201).json(fileDoc);
    } catch (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File too large (max 10 MB)' });
      res.status(500).json({ message: err.message });
    }
  }

  static async listFiles(req, res) {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(parseInt(req.query.limit) || 25, 100);
      const skip = (page - 1) * limit;

      const query = { isArchived: false };
      if (req.query.projectId) query.project = req.query.projectId;
      if (req.query.workspaceId) query.workspace = req.query.workspaceId;
      if (req.query.taskId) {
        const task = await Task.findById(req.query.taskId).select('attachments');
        query._id = { $in: task?.attachments || [] };
      }

      const [files, total] = await Promise.all([
        File.find(query)
          .populate('uploadedBy', 'firstName lastName avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        File.countDocuments(query),
      ]);

      res.json({ files, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async downloadFile(req, res) {
    try {
      const file = await File.findById(req.params.fileId);
      if (!file) return res.status(404).json({ message: 'File not found' });

      const filePath = path.join(UPLOAD_DIR, file.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found on disk' });
      }
      res.download(filePath, file.originalName || file.filename);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async deleteFile(req, res) {
    try {
      const file = await File.findById(req.params.fileId);
      if (!file) return res.status(404).json({ message: 'File not found' });
      if (file.uploadedBy.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const filePath = path.join(UPLOAD_DIR, file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      await Task.updateMany({ attachments: file._id }, { $pull: { attachments: file._id } });
      await File.findByIdAndDelete(file._id);

      res.json({ message: 'File deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}
