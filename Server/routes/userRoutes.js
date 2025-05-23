const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// ✅ Specific GET routes FIRST
router.get('/me', authMiddleware, userController.getCurrentUser);
router.get('/search', authMiddleware, userController.searchUsers);
router.get('/contacts', authMiddleware, userController.getContacts);
router.get('/block-list', authMiddleware, userController.getBlockedUsers);

// ✅ Updates
router.put('/profile', authMiddleware, userController.updateProfile);
router.put('/password', authMiddleware, userController.updatePassword);

// ✅ Contact management
router.post('/contacts', authMiddleware, userController.addContact);
router.delete('/contacts/:userId', authMiddleware, userController.removeContact);

// ✅ Blocking
router.post('/block/:userId', authMiddleware, userController.blockUser);
router.post('/unblock/:userId', authMiddleware, userController.unblockUser);

// ✅ Dynamic route LAST
router.get('/:userId', authMiddleware, userController.getUserById);

module.exports = router;
