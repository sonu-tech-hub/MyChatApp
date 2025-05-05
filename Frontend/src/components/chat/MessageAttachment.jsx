import React, { useState } from 'react';
import { HiDownload, HiDocumentText, HiDocumentDuplicate, HiPlay, HiPause } from 'react-icons/hi';
import { getFileDownloadUrl } from '../../services/fileService';

const MessageAttachment = ({ attachment }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  const videoRef = React.useRef(null);
  
  // Handle image load
  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };
  
  // Handle video play/pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType === 'application/pdf') {
      return <HiDocumentText className="w-6 h-6 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <HiDocumentText className="w-6 h-6 text-blue-500" />;
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return <HiDocumentText className="w-6 h-6 text-green-500" />;
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
      return <HiDocumentText className="w-6 h-6 text-orange-500" />;
    } else {
      return <HiDocumentDuplicate className="w-6 h-6 text-gray-500" />;
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // If attachment is uploading
  if (attachment.uploading) {
    return (
      <div className="mt-2 border border-gray-200 rounded p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFileIcon(attachment.type)}
            <div>
              <p className="text-sm font-medium truncate" style={{ maxWidth: '200px' }}>
                {attachment.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle different attachment types
  if (attachment.type && attachment.type.startsWith('image/')) {
    return (
      <div className="relative group">
        <img
          src={attachment.url || getFileDownloadUrl(attachment._id)}
          alt={attachment.name || 'Image attachment'}
          className={`rounded-lg max-h-64 max-w-full object-contain ${isImageLoaded ? 'block' : 'hidden'}`}
          onLoad={handleImageLoad}
          loading="lazy"
        />
        {!isImageLoaded && (
          <div className="bg-gray-200 rounded-lg h-24 w-48 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-sm">Loading image...</span>
          </div>
        )}
        <a
          href={attachment.url || getFileDownloadUrl(attachment._id)}
          download={attachment.name}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Download image"
        >
          <HiDownload className="w-4 h-4" />
        </a>
      </div>
    );
  } else if (attachment.type && attachment.type.startsWith('video/')) {
    return (
      <div 
        className="relative group rounded-lg overflow-hidden"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video 
          ref={videoRef}
          src={attachment.url || getFileDownloadUrl(attachment._id)}
          className="rounded-lg max-h-64 max-w-full object-contain"
          controls={showControls}
          preload="metadata"
        />
        {!showControls && (
          <button
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-50"
          >
            {isPlaying ? (
              <HiPause className="w-12 h-12 text-white" />
            ) : (
              <HiPlay className="w-12 h-12 text-white" />
            )}
          </button>
        )}
        <a
          href={attachment.url || getFileDownloadUrl(attachment._id)}
          download={attachment.name}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          title="Download video"
        >
          <HiDownload className="w-4 h-4" />
        </a>
      </div>
    );
  } else {
    return (
      <div className="mt-2 border border-gray-200 rounded p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFileIcon(attachment.type)}
            <div>
              <p className="text-sm font-medium truncate" style={{ maxWidth: '200px' }}>
                {attachment.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <a
              href={attachment.url || getFileDownloadUrl(attachment._id)}
              download={attachment.name}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-gray-200"
              title="Download file"
            >
              <HiDownload className="w-4 h-4 text-gray-600" />
            </a>
          </div>
        </div>
      </div>
    );
  }
};

export default MessageAttachment;
