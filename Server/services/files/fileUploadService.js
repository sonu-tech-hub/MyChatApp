// Sample file service (server/services/files/fileUploadService.js)
const uploadFile = async (file, userId) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', /* other types */];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('File type not supported');
    }
    
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds the limit');
    }
    
    // Handle file upload to Firebase Storage
    const fileRef = `files/${userId}/${Date.now()}_${file.originalname}`;
    const fileUpload = await firebaseStorage.upload(file.buffer, fileRef);
    
    return {
      url: fileUpload.url,
      name: file.originalname,
      type: file.mimetype,
      size: file.size
    };
  };