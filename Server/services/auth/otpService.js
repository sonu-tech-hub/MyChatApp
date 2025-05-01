const crypto = require('crypto');
const mongoose = require('mongoose');

// Create OTP Schema
const OTPSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // OTP expires after 5 minutes
  }
});

// Create OTP model (only if it doesn't exist)
const OTP = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);

// Generate a 6-digit OTP
exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in database
exports.storeOTP = async (userId, otp) => {
  // Delete any existing OTPs for this user
  await OTP.deleteMany({ userId });
  
  // Create new OTP
  const otpDoc = new OTP({
    userId,
    otp
  });
  
  await otpDoc.save();
  return otpDoc;
};

// Verify OTP
exports.verifyOTP = async (userId, otp) => {
  const otpRecord = await OTP.findOne({
    userId,
    otp
  });
  
  if (!otpRecord) {
    return false;
  }
  
  // Delete the OTP after successful verification
  await OTP.deleteOne({ _id: otpRecord._id });
  
  return true;
};