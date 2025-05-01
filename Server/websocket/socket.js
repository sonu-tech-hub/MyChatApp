const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { handleChatEvents } = require('./chatHandlers');
const { handleCallEvents } = require('./callHandlers');
const { handleGroupEvents } = require('./groupHandlers');

// Store online users: userId -> socketId
const onlineUsers = new Map();

// Authenticate socket connections using JWT
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: ' + error.message));
  }
};

const setupSocket = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);
  
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${userId}`);
    
    // Add user to online users map
    onlineUsers.set(userId, socket.id);
    
    // Update user status in database
    await User.findByIdAndUpdate(userId, { 
      status: 'online',
      lastSeen: new Date()
    });
    
    // Broadcast user status to friends
    socket.broadcast.emit('userStatus', { 
      userId, 
      status: 'online' 
    });
    
    // Handle user disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);
      
      // Remove from online users
      onlineUsers.delete(userId);
      
      // Update user status in database
      await User.findByIdAndUpdate(userId, { 
        status: 'offline',
        lastSeen: new Date()
      });
      
      // Broadcast user status to friends
      socket.broadcast.emit('userStatus', { 
        userId, 
        status: 'offline' 
      });
    });
    
    // Set up event handlers for different features
    handleChatEvents(socket, io, onlineUsers);
    handleCallEvents(socket, io, onlineUsers);
    handleGroupEvents(socket, io, onlineUsers);
    
    // Send initial online users list to the connected client
    const allUsers = await User.find({ status: 'online' }).select('_id');
    const onlineUserIds = allUsers.map(user => user._id.toString());
    socket.emit('onlineUsers', onlineUserIds);
  });
  
  return { io, onlineUsers };
};

module.exports = setupSocket;