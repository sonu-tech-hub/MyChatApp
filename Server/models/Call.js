const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CallSchema = new Schema({
  caller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['audio', 'video'],
    default: 'audio'
  },
  status: {
    type: String,
    enum: ['ringing', 'ongoing', 'ended', 'rejected', 'missed'],
    default: 'ringing'
  },
  startedAt: {
    type: Date,
    required: true
  },
  answeredAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  }
});

// Create model
const Call = mongoose.model('Call', CallSchema);

module.exports = Call;