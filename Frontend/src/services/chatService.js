import api from './api';
import { emitEvent, onEvent } from './socketService';

// Get all chats for the current user
export const getUserChats = async () => {
  try {
    const { data } = await api.get('/chats');
    return data.chats;
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw new Error('Could not fetch chats');
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
    throw new Error(`Could not fetch chat history with user ${userId}`);
  }
};

// Send a text message
export const sendMessage = (recipientId, content, type = 'text') => {
  try {
    emitEvent('sendMessage', {
      recipientId,
      content,
      type
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Could not send message');
  }
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
    throw new Error('Could not send file');
  }
};

// Mark messages as read
export const markMessagesAsRead = (messageIds) => {
  try {
    emitEvent('markAsRead', { messageIds });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new Error('Could not mark messages as read');
  }
};

// Delete a message
export const deleteMessage = (messageId) => {
  try {
    emitEvent('deleteMessage', { messageId });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error('Could not delete message');
  }
};

// Edit a message
export const editMessage = (messageId, newContent) => {
  try {
    emitEvent('editMessage', { messageId, newContent });
  } catch (error) {
    console.error('Error editing message:', error);
    throw new Error('Could not edit message');
  }
};

// Send typing indicator
export const sendTypingIndicator = (recipientId) => {
  try {
    emitEvent('typing', { recipientId });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
    throw new Error('Could not send typing indicator');
  }
};

// Send stop typing indicator
export const sendStopTypingIndicator = (recipientId) => {
  try {
    emitEvent('stopTyping', { recipientId });
  } catch (error) {
    console.error('Error sending stop typing indicator:', error);
    throw new Error('Could not send stop typing indicator');
  }
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
