const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const NotificationService = require('../services/notifications/notificationService');

const handleChatEvents = (socket, io, onlineUsers) => {
  const userId = socket.user._id.toString();
  
  // Handle sending a message
  socket.on('sendMessage', async (data) => {
    try {
      const { recipientId, content, type, attachments = [] } = data;
      
      // Create a new message
      const newMessage = new Message({
        sender: userId,
        recipient: recipientId,
        content,
        type,
        attachments,
        createdAt: new Date()
      });
      
      // Save message to database
      const savedMessage = await newMessage.save();
      
      // Update or create chat
      let chat = await Chat.findOne({
        $or: [
          { user1: userId, user2: recipientId },
          { user1: recipientId, user2: userId }
        ]
      });
      
      if (!chat) {
        chat = new Chat({
          user1: userId,
          user2: recipientId,
          lastMessage: savedMessage._id,
          lastMessageAt: new Date()
        });
      } else {
        chat.lastMessage = savedMessage._id;
        chat.lastMessageAt = new Date();
      }
      
      await chat.save();
      
      // Populate sender information
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate('sender', 'name profilePhoto')
        .populate('attachments');
      
      // Send message to recipient if online
      if (onlineUsers.has(recipientId)) {
        io.to(onlineUsers.get(recipientId)).emit('newMessage', populatedMessage);
      } else {
        // Send push notification if user is offline
        const sender = await User.findById(userId);
        await NotificationService.sendPushNotification(recipientId, {
          title: `New message from ${sender.name}`,
          body: type === 'text' ? content.substring(0, 100) : `Sent you a ${type}`,
          data: {
            type: 'message',
            messageId: savedMessage._id,
            senderId: userId
          }
        });
      }
      
      // Send confirmation to sender
      socket.emit('messageSent', populatedMessage);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message', error: error.message });
    }
  });
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    const { recipientId } = data;
    
    if (onlineUsers.has(recipientId)) {
      io.to(onlineUsers.get(recipientId)).emit('userTyping', { userId });
    }
  });
  
  socket.on('stopTyping', (data) => {
    const { recipientId } = data;
    
    if (onlineUsers.has(recipientId)) {
      io.to(onlineUsers.get(recipientId)).emit('userStoppedTyping', { userId });
    }
  });
  
  // Handle read receipts
  socket.on('markAsRead', async (data) => {
    try {
      const { messageIds } = data;
      
      // Update messages as read
      await Message.updateMany(
        { _id: { $in: messageIds }, recipient: userId },
        { $set: { read: true, readAt: new Date() } }
      );
      
      // Get unique sender IDs from these messages
      const messages = await Message.find({ _id: { $in: messageIds } });
      const senderIds = [...new Set(messages.map(msg => msg.sender.toString()))];
      
      // Notify each sender that their messages have been read
      senderIds.forEach(senderId => {
        if (onlineUsers.has(senderId)) {
          const readMessageIds = messages
            .filter(msg => msg.sender.toString() === senderId)
            .map(msg => msg._id);
            
          io.to(onlineUsers.get(senderId)).emit('messagesRead', {
            reader: userId,
            messageIds: readMessageIds
          });
        }
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      socket.emit('error', { message: 'Failed to mark messages as read', error: error.message });
    }
  });
  
  // Handle message deletion
  socket.on('deleteMessage', async (data) => {
    try {
      const { messageId } = data;
      
      // Find the message
      const message = await Message.findById(messageId);
      
      // Check if user is the sender
      if (!message || message.sender.toString() !== userId) {
        return socket.emit('error', { message: 'Cannot delete this message' });
      }
      
      // If recipient has not read the message yet, we can delete it completely
      if (!message.read) {
        await Message.findByIdAndDelete(messageId);
      } else {
        // Otherwise mark as deleted but keep the record
        message.deleted = true;
        message.content = '';
        message.attachments = [];
        await message.save();
      }
      
      // Notify recipient about deletion
      if (onlineUsers.has(message.recipient.toString())) {
        io.to(onlineUsers.get(message.recipient.toString())).emit('messageDeleted', { messageId });
      }
      
      // Confirm deletion to sender
      socket.emit('messageDeleted', { messageId });
    } catch (error) {
      console.error('Delete message error:', error);
      socket.emit('error', { message: 'Failed to delete message', error: error.message });
    }
  });
  
  // Handle message editing
  socket.on('editMessage', async (data) => {
    try {
      const { messageId, newContent } = data;
      
      // Find the message
      const message = await Message.findById(messageId);
      
      // Check if user is the sender and message is editable
      if (!message || message.sender.toString() !== userId) {
        return socket.emit('error', { message: 'Cannot edit this message' });
      }
      
      // Check if message has been read (can't edit if read)
      if (message.read) {
        return socket.emit('error', { message: 'Cannot edit messages that have been read' });
      }
      
      // Update message
      message.content = newContent;
      message.edited = true;
      message.editedAt = new Date();
      await message.save();
      
      // Notify recipient
      if (onlineUsers.has(message.recipient.toString())) {
        io.to(onlineUsers.get(message.recipient.toString())).emit('messageEdited', {
          messageId,
          newContent,
          editedAt: message.editedAt
        });
      }
      
      // Confirm edit to sender
      socket.emit('messageEdited', {
        messageId,
        newContent,
        editedAt: message.editedAt
      });
    } catch (error) {
      console.error('Edit message error:', error);
      socket.emit('error', { message: 'Failed to edit message', error: error.message });
    }
  });
};

module.exports = { handleChatEvents };