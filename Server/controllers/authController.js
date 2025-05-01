const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTPService = require('../services/auth/otpService');
const EmailService = require('../services/notifications/emailService');
const SMSService = require('../services/notifications/smsService');

// Helper function to generate JWT tokens
const generateTokens = (userId) => {
  // Access token (short-lived)
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  // Refresh token (long-lived)
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, phone, address, password, location } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or phone number'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user without setting isVerified to true yet
    const user = new User({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      location: location || { type: 'Point', coordinates: [0, 0] },
      createdAt: new Date()
    });
    
    await user.save();
    
    // Generate OTP
    const otp = OTPService.generateOTP();
    await OTPService.storeOTP(user._id, otp);
    
    // Send OTP based on user preference
    if (req.body.verificationMethod === 'email') {
      await EmailService.sendVerificationEmail(email, otp);
      user.verificationMethod = 'email';
    } else {
      await SMSService.sendVerificationSMS(phone, otp);
      user.verificationMethod = 'phone';
    }
    
    await user.save();
    
    return res.status(201).json({
      message: 'User registered successfully. Please verify your account.',
      userId: user._id,
      verificationMethod: user.verificationMethod
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      message: 'Error during registration',
      error: error.message
    });
  }
};

// Verify user with OTP
exports.verifyAccount = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    // Validate OTP
    const isValid = await OTPService.verifyOTP(userId, otp);
    
    if (!isValid) {
      return res.status(400).json({
        message: 'Invalid or expired OTP'
      });
    }
    
    // Update user as verified
    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Generate tokens
    const tokens = generateTokens(user._id);
    
    // Store refresh token in database
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    return res.status(200).json({
      message: 'Account verified successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      },
      ...tokens
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      message: 'Error during verification',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    
    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }]
    });
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP for unverified users
      const otp = OTPService.generateOTP();
      await OTPService.storeOTP(user._id, otp);
      
      // Send OTP
      if (user.verificationMethod === 'email') {
        await EmailService.sendVerificationEmail(user.email, otp);
      } else {
        await SMSService.sendVerificationSMS(user.phone, otp);
      }
      
      return res.status(401).json({
        message: 'Account not verified. A new verification code has been sent.',
        userId: user._id,
        verificationMethod: user.verificationMethod,
        requiresVerification: true
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid password'
      });
    }
    
    // Generate tokens
    const tokens = generateTokens(user._id);
    
    // Store refresh token
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();
    
    return res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
        isVerified: user.isVerified
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'Error during login',
      error: error.message
    });
  }
};

// Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        message: 'Refresh token is required'
      });
    }
    
    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Find user by ID and check if refresh token matches
    const user = await User.findById(decoded.userId);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        message: 'Invalid refresh token'
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user._id);
    
    // Update refresh token in database
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    return res.status(200).json({
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      message: 'Error refreshing token',
      error: error.message
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Clear refresh token in database
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    
    return res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      message: 'Error during logout',
      error: error.message
    });
  }
};