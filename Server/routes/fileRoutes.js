const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

// Protected routes
router.post('/upload', authMiddleware, uploadMiddleware.single('file'), fileController.uploadFile); // Upload file
router.get('/:fileId/metadata', authMiddleware, fileController.getFileMetadata); // Get file metadata
router.get('/:fileId/download', authMiddleware, fileController.downloadFile); // Download file
router.get('/:fileId/preview', authMiddleware, fileController.previewFile); // Preview file
router.delete('/:fileId', authMiddleware, fileController.deleteFile); // Delete file

module.exports = router;
