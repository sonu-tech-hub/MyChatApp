const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'location', 'contact'],
    default: 'text'
  },
  attachments: [{
    type: Schema.Types.ObjectId,
    ref: 'File'
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  deleted: {
    type: Boolean,
    default: false
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  reactions: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'    
    },
    reaction: {
        type: String,
        enum: ['like', 'love', 'laugh', 'sad', 'angry'],
        default: 'like'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true // Add timestamps for createdAt and updatedAt
});

// Add indexes
MessageSchema.index({ 
    sender: 1, 
    recipient: 1, 
    createdAt: -1 
});
  
MessageSchema.index({ 
    group: 1, 
    createdAt: -1 
});

module.exports = mongoose.model('Message', MessageSchema);