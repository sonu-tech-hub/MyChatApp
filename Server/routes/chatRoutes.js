const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Protected routes
router.get('/', authMiddleware, chatController.getUserChats);
router.get('/:userId/messages', authMiddleware, chatController.getChatMessages);
router.delete('/:chatId', authMiddleware, chatController.deleteChat);
router.post('/link-preview', authMiddleware, chatController.getLinkPreview);

module.exports = router;