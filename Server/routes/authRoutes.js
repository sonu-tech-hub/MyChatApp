// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Ensure all controller methods exist
if (!authController.register) {
  authController.register = (req, res) => {
    res.status(501).json({ message: 'Registration not implemented yet' });
  };
}

if (!authController.verifyAccount) {
  authController.verifyAccount = (req, res) => {
    res.status(501).json({ message: 'Account verification not implemented yet' });
  };
}

if (!authController.login) {
  authController.login = (req, res) => {
    res.status(501).json({ message: 'Login not implemented yet' });
  };
}

if (!authController.refreshToken) {
  authController.refreshToken = (req, res) => {
    res.status(501).json({ message: 'Token refresh not implemented yet' });
  };
}

if (!authController.logout) {
  authController.logout = (req, res) => {
    res.status(501).json({ message: 'Logout not implemented yet' });
  };
}

if (!authController.sendOTP) {
  authController.sendOTP = (req, res) => {
    res.status(501).json({ message: 'OTP sending not implemented yet' });
  };
}

// Public routes
router.post('/register', authController.register);
router.post('/verify', authController.verifyAccount);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authController.logout);
router.post('/send-otp', authController.sendOTP);

module.exports = router;