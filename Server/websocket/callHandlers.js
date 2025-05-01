const Call = require('../models/Call');
const User = require('../models/User');
const NotificationService = require('../services/notifications/notificationService');

const handleCallEvents = (socket, io, onlineUsers) => {
  const userId = socket.user._id.toString();
  
  // Handle call initiation
  socket.on('callOffer', async (data) => {
    try {
      const { recipientId, offer, callType } = data;
      
      // Create call record
      const newCall = new Call({
        caller: userId,
        recipient: recipientId,
        type: callType,
        status: 'ringing',
        startedAt: new Date()
      });
      
      await newCall.save();
      
      // Check if recipient is online
      if (onlineUsers.has(recipientId)) {
        // Send call offer to recipient
        io.to(onlineUsers.get(recipientId)).emit('callOffer', {
          callId: newCall._id,
          callerId: userId,
          callerName: socket.user.name,
          callerPhoto: socket.user.profilePhoto,
          offer,
          callType
        });
      } else {
        // Send push notification for missed call
        const caller = await User.findById(userId);
        await NotificationService.sendPushNotification(recipientId, {
          title: `Missed call from ${caller.name}`,
          body: `You missed a ${callType} call`,
          data: {
            type: 'missed_call',
            callId: newCall._id,
            callerId: userId,
            callType
          }
        });
        
        // Update call status to missed
        newCall.status = 'missed';
        newCall.endedAt = new Date();
        await newCall.save();
        
        // Notify caller that recipient is unavailable
        socket.emit('callUnavailable', {
          callId: newCall._id,
          recipientId,
          reason: 'offline'
        });
      }
    } catch (error) {
      console.error('Call offer error:', error);
      socket.emit('error', { message: 'Failed to initiate call', error: error.message });
    }
  });
  
  // Handle call answer
  socket.on('callAnswer', async (data) => {
    try {
      const { callId, callerId, answer, accepted } = data;
      
      // Update call record
      const call = await Call.findById(callId);
      if (!call) {
        return socket.emit('error', { message: 'Call not found' });
      }
      
      if (accepted) {
        call.status = 'ongoing';
        await call.save();
        
        // Send answer to caller
        if (onlineUsers.has(callerId)) {
          io.to(onlineUsers.get(callerId)).emit('callAccepted', {
            callId,
            recipientId: userId,
            answer
          });
        }
      } else {
        // Call rejected
        call.status = 'rejected';
        call.endedAt = new Date();
        await call.save();
        
        // Notify caller of rejection
        if (onlineUsers.has(callerId)) {
          io.to(onlineUsers.get(callerId)).emit('callRejected', {
            callId,
            recipientId: userId
          });
        }
      }
    } catch (error) {
      console.error('Call answer error:', error);
      socket.emit('error', { message: 'Failed to answer call', error: error.message });
    }
  });
  
  // Handle ICE candidates
  socket.on('iceCandidate', (data) => {
    const { recipientId, candidate } = data;
    
    if (onlineUsers.has(recipientId)) {
      io.to(onlineUsers.get(recipientId)).emit('iceCandidate', {
        senderId: userId,
        candidate
      });
    }
  });
  
  // Handle call end
  socket.on('endCall', async (data) => {
    try {
      const { callId, recipientId } = data;
      
      // Update call record
      if (callId) {
        const call = await Call.findById(callId);
        if (call) {
          call.status = 'ended';
          call.endedAt = new Date();
          call.duration = (new Date() - call.startedAt) / 1000; // Duration in seconds
          await call.save();
        }
      }
      
      // Notify the other party
      if (recipientId && onlineUsers.has(recipientId)) {
        io.to(onlineUsers.get(recipientId)).emit('callEnded', {
          callId,
          endedBy: userId
        });
      }
    } catch (error) {
      console.error('End call error:', error);
      socket.emit('error', { message: 'Failed to end call', error: error.message });
    }
  });
};

module.exports = { handleCallEvents };
