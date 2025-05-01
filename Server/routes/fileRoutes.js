const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

// Protected routes
router.post('/upload', authMiddleware, uploadMiddleware.single('file'), fileController.uploadFile);
router.get('/:fileId/metadata', authMiddleware, fileController.getFileMetadata);
router.get('/:fileId/download', authMiddleware, fileController.downloadFile);
router.get('/:fileId/preview', authMiddleware, fileController.previewFile);
router.delete('/:fileId', authMiddleware, fileController.deleteFile);

module.exports = router;