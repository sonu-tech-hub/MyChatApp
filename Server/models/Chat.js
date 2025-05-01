const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  user1: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount1: {
    type: Number,
    default: 0
  },
  unreadCount2: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
ChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to get unread count for a specific user
ChatSchema.methods.getUnreadCount = function(userId) {
  const userIdStr = userId.toString();
  if (userIdStr === this.user1.toString()) {
    return this.unreadCount1;
  } else if (userIdStr === this.user2.toString()) {
    return this.unreadCount2;
  }
  return 0;
};

// Method to mark messages as read for a specific user
ChatSchema.methods.markAsRead = function(userId) {
  const userIdStr = userId.toString();
  if (userIdStr === this.user1.toString()) {
    this.unreadCount1 = 0;
  } else if (userIdStr === this.user2.toString()) {
    this.unreadCount2 = 0;
  }
  return this.save();
};

// Method to increment unread count for a specific user
ChatSchema.methods.incrementUnreadCount = function(forUserId) {
  const userIdStr = forUserId.toString();
  if (userIdStr === this.user1.toString()) {
    this.unreadCount1 += 1;
  } else if (userIdStr === this.user2.toString()) {
    this.unreadCount2 += 1;
  }
  return this.save();
};

// Create model
const Chat = mongoose.model('Chat', ChatSchema);

module.exports = Chat;