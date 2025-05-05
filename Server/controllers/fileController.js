const File = require('../models/File');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create file entry
    const file = new File({
      name: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.user.id}/${req.file.filename}`,
      uploader: req.user.id
    });

    await file.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      fileId: file._id,
      file: {
        _id: file._id,
        name: file.originalName,
        type: file.mimetype,
        size: file.size,
        url: file.url
      }
    });
  } catch (error) {
    console.error(`File upload error (User ID: ${req.user.id}):`, error);

    // Clean up the file if there was an error saving to the database
    if (req.file && req.file.path) {
      try {
        await unlinkAsync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get file metadata
exports.getFileMetadata = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permissions
    if (!file.public && file.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this file' });
    }

    res.status(200).json({
      file: {
        _id: file._id,
        name: file.originalName,
        type: file.mimetype,
        size: file.size,
        url: file.url,
        thumbnailUrl: file.thumbnailUrl,
        uploadedAt: file.createdAt
      }
    });
  } catch (error) {
    console.error(`Get file metadata error (File ID: ${req.params.fileId}):`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permissions
    if (!file.public && file.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this file' });
    }

    // Validate file path
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'File no longer exists' });
    }

    // Set content disposition header for download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    
    // Send the file
    res.sendFile(path.resolve(file.path));
  } catch (error) {
    console.error(`Download file error (File ID: ${req.params.fileId}):`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Preview file
exports.previewFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check permissions
    if (!file.public && file.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this file' });
    }

    // For images and viewable files, set content type
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) {
      return res.status(415).json({ message: 'File type not supported for preview' });
    }

    res.setHeader('Content-Type', file.mimetype);

    // Use inline content disposition for preview
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);

    // Send the file
    res.sendFile(path.resolve(file.path));
  } catch (error) {
    console.error(`Preview file error (File ID: ${req.params.fileId}):`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check ownership
    if (file.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this file' });
    }

    // File path validation before attempting to delete
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'File no longer exists on the server' });
    }

    // Delete the file from storage
    try {
      await unlinkAsync(file.path);
      console.log(`File successfully deleted from storage (File ID: ${fileId})`);
    } catch (unlinkError) {
      console.error(`Error deleting file from storage (File ID: ${fileId}):`, unlinkError);
      // Continue with deletion from DB even if physical file deletion fails
    }

    // Delete from database
    await File.findByIdAndDelete(fileId);

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error(`Delete file error (File ID: ${req.params.fileId}):`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
