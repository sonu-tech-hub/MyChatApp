const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'phone'],
    default: 'email'
  },
  refreshToken: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  contacts: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    nickname: String,
    isFavorite: {
      type: Boolean,
      default: false
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  blockedUsers: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    blockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  fcmTokens: [String] // For push notifications
});

// Add index for location-based queries
UserSchema.index({ location: '2dsphere' });

// Add index for email and phone for faster lookups
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });

// Pre-save middleware to update the updatedAt field
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if user has blocked another user
UserSchema.methods.hasBlockedUser = function(userId) {
  return this.blockedUsers.some(
    blockedUser => blockedUser.user.toString() === userId.toString()
  );
};

// Method to check if a user is in contacts
UserSchema.methods.isInContacts = function(userId) {
  return this.contacts.some(
    contact => contact.user.toString() === userId.toString()
  );
};

// Method to add a user to contacts
UserSchema.methods.addContact = function(userId, nickname = '') {
  if (!this.isInContacts(userId)) {
    this.contacts.push({
      user: userId,
      nickname,
      addedAt: new Date()
    });
  }
  return this.save();
};

// Method to remove a user from contacts
UserSchema.methods.removeContact = function(userId) {
  this.contacts = this.contacts.filter(
    contact => contact.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to block a user
UserSchema.methods.blockUser = function(userId) {
  if (!this.hasBlockedUser(userId)) {
    this.blockedUsers.push({
      user: userId,
      blockedAt: new Date()
    });
  }
  return this.save();
};

// Method to unblock a user
UserSchema.methods.unblockUser = function(userId) {
  this.blockedUsers = this.blockedUsers.filter(
    blockedUser => blockedUser.user.toString() !== userId.toString()
  );
  return this.save();
};
UserSchema.index({ 
    name: 'text', 
    email: 'text', 
    phone: 'text' 
  }, {
    weights: {
      name: 10,
      email: 5,
      phone: 5
    }
  });
// Create model
const User = mongoose.model('User', UserSchema);

module.exports = User;