import api from './api';

// Upload a file
export const uploadFile = async (file, options = {}) => {
  try {
    // Check file size before uploading
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size (25MB)`);
    }

    // If it's an image and over 1MB, compress it
    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
      try {
        file = await compressImage(file);
      } catch (compressionError) {
        console.warn('Image compression failed:', compressionError);
        // Optionally notify the user about compression failure
        options.onCompressionFail && options.onCompressionFail(compressionError);
        // Continue with original file if compression fails
      }
    }

    const formData = new FormData();
    formData.append('file', file);

    // Add additional options
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const { data } = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // Add upload progress tracking
      onUploadProgress: options.onProgress
        ? (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            options.onProgress(percentCompleted);
          }
        : undefined
    });

    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Get file metadata
export const getFileMetadata = async (fileId) => {
  try {
    const { data } = await api.get(`/files/${fileId}/metadata`);
    return data.file;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
};

// Helper function to compress images
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        // Draw the resized image to canvas for compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with reduced quality
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: file.lastModified
            });

            resolve(compressedFile);
          },
          file.type,
          0.7 // 70% quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file for compression'));
    };
  });
};

// Get file download URL
export const getFileDownloadUrl = (fileId) => {
  return `${api.defaults.baseURL}/files/${fileId}/download`;
};

// Get file preview URL
export const getFilePreviewUrl = (fileId) => {
  return `${api.defaults.baseURL}/files/${fileId}/preview`;
};

// Delete a file
export const deleteFile = async (fileId) => {
  try {
    await api.delete(`/files/${fileId}`);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Check if file is an image
export const isImageFile = (file) => {
  return file.type.startsWith('image/');
};

// Check if file is a video
export const isVideoFile = (file) => {
  return file.type.startsWith('video/');
};

// Check if file is a document
export const isDocumentFile = (file) => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];

  return documentTypes.includes(file.type);
};

// Get file icon based on file type
export const getFileIcon = (fileType) => {
  if (fileType.startsWith('image/')) {
    return 'image';
  } else if (fileType.startsWith('video/')) {
    return 'video';
  } else if (fileType === 'application/pdf') {
    return 'file-pdf';
  } else if (
    fileType === 'application/msword' ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'file-word';
  } else if (
    fileType === 'application/vnd.ms-excel' ||
    fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return 'file-excel';
  } else if (
    fileType === 'application/vnd.ms-powerpoint' ||
    fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'file-powerpoint';
  } else if (fileType === 'text/plain') {
    return 'file-text';
  } else {
    return 'file';
  }
};

export default {
  uploadFile,
  getFileMetadata,
  getFileDownloadUrl,
  getFilePreviewUrl,
  deleteFile,
  isImageFile,
  isVideoFile,
  isDocumentFile,
  getFileIcon
};
