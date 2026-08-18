import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { uploadMiddleware } from '../middleware/upload.js';
import { FileController } from '../controllers/FileController.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/', uploadMiddleware, FileController.uploadFile);
router.get('/', FileController.listFiles);
router.get('/:fileId/download', FileController.downloadFile);
router.delete('/:fileId', FileController.deleteFile);

export default router;
