import api from './api';
import { emitEvent, onEvent } from './socketService';

// Get all chats for the current user
export const getUserChats = async () => {
  try {
    const { data } = await api.get('/chats');
    return data.chats;
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

// Get chat history with a specific user
export const getChatHistory = async (userId, page = 1, limit = 50) => {
  try {
    const { data } = await api.get(`/chats/${userId}/messages`, {
      params: { page, limit }
    });
    return data;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// Send a text message
export const sendMessage = (recipientId, content, type = 'text') => {
  emitEvent('sendMessage', {
    recipientId,
    content,
    type
  });
};

// Send a file message
export const sendFileMessage = async (recipientId, file) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('recipientId', recipientId);
    
    // Upload file
    const { data } = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Send message with file attachment
    emitEvent('sendMessage', {
      recipientId,
      content: '',
      type: file.type.startsWith('image/') ? 'image' : 'file',
      attachments: [data.fileId]
    });
    
    return data;
  } catch (error) {
    console.error('Error sending file:', error);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = (messageIds) => {
  emitEvent('markAsRead', { messageIds });
};

// Delete a message
export const deleteMessage = (messageId) => {
  emitEvent('deleteMessage', { messageId });
};

// Edit a message
export const editMessage = (messageId, newContent) => {
  emitEvent('editMessage', { messageId, newContent });
};

// Send typing indicator
export const sendTypingIndicator = (recipientId) => {
  emitEvent('typing', { recipientId });
};

// Send stop typing indicator
export const sendStopTypingIndicator = (recipientId) => {
  emitEvent('stopTyping', { recipientId });
};

// Set up message listeners
export const setupMessageListeners = (callbacks) => {
  const {
    onNewMessage,
    onMessageSent,
    onMessageDeleted,
    onMessageEdited,
    onMessagesRead,
    onUserTyping,
    onUserStoppedTyping
  } = callbacks;
  
  // Set up event listeners
  const removeListeners = [
    onEvent('newMessage', onNewMessage),
    onEvent('messageSent', onMessageSent),
    onEvent('messageDeleted', onMessageDeleted),
    onEvent('messageEdited', onMessageEdited),
    onEvent('messagesRead', onMessagesRead),
    onEvent('userTyping', onUserTyping),
    onEvent('userStoppedTyping', onUserStoppedTyping)
  ];
  
  // Return a function to remove all listeners
  return () => {
    removeListeners.forEach(removeFn => removeFn());
  };
};

export default {
  getUserChats,
  getChatHistory,
  sendMessage,
  sendFileMessage,
  markMessagesAsRead,
  deleteMessage,
  editMessage,
  sendTypingIndicator,
  sendStopTypingIndicator,
  setupMessageListeners
};