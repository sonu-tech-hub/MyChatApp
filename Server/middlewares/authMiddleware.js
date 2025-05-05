const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();


exports.authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Authorization Header:', authHeader); // Log the header for debugging

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT_SECRET:", process.env.JWT_SECRET);

    // Log token content for debugging
    console.log('Decoded JWT:', decoded);

    const userId = decoded.userId || decoded._id || decoded.id;

    if (!userId) {
      return res.status(400).json({ message: 'Invalid token payload: user ID missing' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found, access denied' });
    }

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again', tokenExpired: true });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token, access denied' });
    }

    console.error('Authentication error:', error.message);
    return res.status(500).json({ message: 'Server error during authentication', error: error.message });
  }
};
