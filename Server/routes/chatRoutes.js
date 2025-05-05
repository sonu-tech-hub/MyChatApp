const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Protected routes with authMiddleware
router.get('/', authMiddleware, chatController.getUserChats); // Retrieve all user chats
router.get('/:userId/messages', authMiddleware, chatController.getChatMessages); // Get messages of a specific chat
router.delete('/:chatId', authMiddleware, chatController.deleteChat); // Delete a chat
router.post('/link-preview', authMiddleware, chatController.getLinkPreview); // Get link preview

module.exports = router;
