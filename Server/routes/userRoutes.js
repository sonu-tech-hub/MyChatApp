const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Protected routes
router.get('/me', authMiddleware, userController.getCurrentUser);
router.get('/:userId', authMiddleware, userController.getUserById);
router.put('/profile', authMiddleware, userController.updateProfile);
router.put('/password', authMiddleware, userController.updatePassword);
router.get('/search', authMiddleware, userController.searchUsers);
router.post('/contacts', authMiddleware, userController.addContact);
router.delete('/contacts/:userId', authMiddleware, userController.removeContact);
router.get('/contacts', authMiddleware, userController.getContacts);
router.post('/block/:userId', authMiddleware, userController.blockUser);
router.post('/unblock/:userId', authMiddleware, userController.unblockUser);
router.get('/block-list', authMiddleware, userController.getBlockedUsers);

module.exports = router;