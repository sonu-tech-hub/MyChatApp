import React, { useState, useRef, useEffect } from 'react';
import { HiPaperAirplane, HiPhotograph, HiPaperClip, HiEmojiHappy, HiX } from 'react-icons/hi';
import { sendTypingIndicator, sendStopTypingIndicator } from '../../services/chatService';
import EmojiPicker from '../common/EmojiPicker';

const MessageInput = ({ onSendMessage, onFileUpload, receiverId }) => {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Handle textarea input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Send typing indicator
    if (value.trim() && receiverId) {
      sendTypingIndicator(receiverId);
      
      // Clear previous timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout for stop typing
      const timeout = setTimeout(() => {
        sendStopTypingIndicator(receiverId);
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };
  
  // Handle textarea key press
  const handleKeyPress = (e) => {
    // Send message on Enter key (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle send button click
  const handleSendMessage = () => {
    if (selectedFile) {
      handleSendFile();
      return;
    }
    
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Stop typing indicator
      sendStopTypingIndicator(receiverId);
      
      // Clear typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      
      // Focus textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Create file preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreviewUrl(null);
    }
  };
  
  // Handle file upload button click
  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle sending file
  const handleSendFile = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
      clearFileSelection();
    }
  };
  
  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji.native);
    setIsEmojiPickerOpen(false);
    
    // Focus textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // Cleanup typing indicator when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      if (receiverId) {
        sendStopTypingIndicator(receiverId);
      }
    };
  }, [receiverId, typingTimeout]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = 
        Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [message]);
  
  return (
    <div className="bg-white rounded-lg">
      {/* File preview */}
      {selectedFile && (
        <div className="p-3 border border-gray-200 rounded-lg mb-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {filePreviewUrl ? (
                <img 
                  src={filePreviewUrl} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded">
                  <HiPaperClip className="text-gray-500 w-6 h-6" />
                </div>
              )}
              <div className="overflow-hidden">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button 
              className="p-1 rounded-full hover:bg-gray-200"
              onClick={clearFileSelection}
            >
              <HiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}
      
      {/* Message input area */}
      <div className="flex items-end space-x-2">
        <div className="flex-shrink-0 flex space-x-1">
          <button 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            onClick={handleFileButtonClick}
            title="Attach file"
          >
            <HiPaperClip className="w-5 h-5" />
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*"
          />
          
          <button 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            title="Emoji"
          >
            <HiEmojiHappy className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative flex-1">
          {/* Emoji picker */}
          {isEmojiPickerOpen && (
            <div className="absolute bottom-full mb-2">
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setIsEmojiPickerOpen(false)} />
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full bg-gray-100 border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows="1"
          />
        </div>
        
        <button
          className={`p-2 rounded-full bg-primary text-white ${
            !message.trim() && !selectedFile ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark'
          }`}
          onClick={handleSendMessage}
          disabled={!message.trim() && !selectedFile}
        >
          <HiPaperAirplane className="w-5 h-5 transform rotate-90" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;