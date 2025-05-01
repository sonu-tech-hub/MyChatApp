import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { HiDotsVertical, HiCheck, HiCheckCircle, HiTrash, HiPencil, HiDownload, HiExternalLink } from 'react-icons/hi';
import { motion } from 'framer-motion';
import Avatar from '../common/Avatar';
import { getFileDownloadUrl } from '../../services/fileService';
import { deleteMessage, editMessage } from '../../services/chatService';
import MessageAttachment from './MessageAttachment';
import LinkPreview from './LinkPreview1';

const MessageItem = ({ message, isOwnMessage, otherUser }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  
  const optionsRef = useRef(null);
  const editInputRef = useRef(null);
  
  // Format message time
  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'h:mm a');
  };
  
  // Toggle message options
  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };
  
  // Close options when clicking elsewhere
  const handleClickOutside = (e) => {
    if (optionsRef.current && !optionsRef.current.contains(e.target)) {
      setShowOptions(false);
    }
  };
  
  // Start editing message
  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
    setShowOptions(false);
    
    // Focus edit input when it's rendered
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 0);
  };
  
  // Save edited message
  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      editMessage(message._id, editContent.trim());
    }
    setIsEditing(false);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };
  
  // Handle key press in edit input
  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  
  // Delete message
  const handleDelete = () => {
    deleteMessage(message._id);
    setShowOptions(false);
  };
  
  // Extract URLs from message content
  const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };
  
  // Get message URLs if any
  const messageUrls = message.type === 'text' ? extractUrls(message.content) : [];
  
  // Set up click outside listener
  React.useEffect(() => {
    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);
  
  // Message container classes
  const messageContainerClasses = isOwnMessage
    ? 'flex justify-end'
    : 'flex justify-start';
  
  // Message bubble classes
  const messageBubbleClasses = isOwnMessage
    ? 'bg-primary text-white rounded-lg rounded-tr-none py-2 px-3 max-w-xs lg:max-w-md'
    : 'bg-white border border-gray-200 rounded-lg rounded-tl-none py-2 px-3 max-w-xs lg:max-w-md';
  
  // Handle loading/error states
  if (message.sending) {
    return (
      <div className={messageContainerClasses}>
        <div className={`${messageBubbleClasses} opacity-70`}>
          {message.type === 'text' && <p>{message.content}</p>}
          {(message.type === 'image' || message.type === 'file') && 
            message.attachments && message.attachments[0] && (
              <div className="opacity-50">
                <p className="text-sm italic">Sending {message.type}...</p>
                <p className="text-xs">{message.attachments[0].name}</p>
              </div>
            )
          }
          <div className="text-right text-xs mt-1 opacity-70 flex items-center justify-end">
            <span className="mr-1">Sending</span>
            <span className="animate-pulse">...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (message.error) {
    return (
      <div className={messageContainerClasses}>
        <div className={`${messageBubbleClasses} bg-red-100 border-red-300 text-red-800`}>
          <p>Failed to send message</p>
          <div className="text-right text-xs mt-1">
            <button className="underline">Retry</button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={messageContainerClasses}>
      {/* Sender avatar for received messages */}
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-2">
          <Avatar 
            src={message.sender?.profilePhoto} 
            name={message.sender?.name} 
            size="sm" 
          />
        </div>
      )}
      
      {/* Message content */}
      <div className="relative group">
        {/* Message bubble */}
        <div className={messageBubbleClasses}>
          {/* Text message */}
          {message.type === 'text' && !isEditing && (
            <div>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              
              {/* Link previews */}
              {messageUrls.length > 0 && (
                <div className="mt-2 space-y-2">
                  {messageUrls.map((url, index) => (
                    <LinkPreview key={index} url={url} />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Edit message form */}
          {isEditing && (
            <div>
              <textarea
                ref={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyPress}
                className="w-full bg-white border border-gray-300 rounded p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows="2"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-xs rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs rounded bg-primary text-white hover:bg-primary-dark"
                >
                  Save
                </button>
              </div>
            </div>
          )}
          
          {/* Image/file attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-1">
              {message.attachments.map(attachment => (
                <MessageAttachment 
                  key={attachment._id || `temp-${Date.now()}`} 
                  attachment={attachment} 
                />
              ))}
            </div>
          )}
          
          {/* Message metadata */}
          <div className="text-right text-xs mt-1 flex items-center justify-end space-x-1">
            <span className={isOwnMessage ? 'text-gray-200' : 'text-gray-500'}>
              {formatTime(message.createdAt)}
            </span>
            
           {/* Read receipt for own messages */}
           {isOwnMessage && (
              message.read ? (
                <span className="text-blue-400" title="Read">
                  <HiCheckCircle className="w-4 h-4" />
                </span>
              ) : (
                <span className="text-gray-300" title="Sent">
                  <HiCheck className="w-4 h-4" />
                </span>
              )
            )}
          </div>
        </div>
        
        {/* Message options button */}
        {isOwnMessage && !message.deleted && !isEditing && (
          <button
            onClick={toggleOptions}
            className="absolute top-0 left-0 transform -translate-x-full p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <HiDotsVertical className="w-4 h-4" />
          </button>
        )}
        
        {/* Message options menu */}
        {showOptions && (
          <div
            ref={optionsRef}
            className="absolute top-0 left-0 transform -translate-x-full -translate-y-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
          >
            {message.type === 'text' && !message.read && (
              <button
                onClick={handleEdit}
                className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                <HiPencil className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
            >
              <HiTrash className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;