const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const axios = require('axios');
const cheerio = require('cheerio');

// Get all chats for the current user
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all chats where the user is either user1 or user2
    const chats = await Chat.find({
      $or: [{ user1: userId }, { user2: userId }]
    })
      .populate('user1', '_id name profilePhoto')
      .populate('user2', '_id name profilePhoto')
      .sort({ updatedAt: -1 });

    res.status(200).json({ chats });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all messages in a one-on-one chat
exports.getChatMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user.id);
    if (currentUser.hasBlockedUser(userId) || otherUser.hasBlockedUser(req.user.id)) {
      return res.status(403).json({ message: 'Cannot chat with this user' });
    }

    let chat = await Chat.findOne({
      $or: [
        { user1: req.user.id, user2: userId },
        { user1: userId, user2: req.user.id }
      ]
    });

    if (!chat) {
      chat = new Chat({ user1: req.user.id, user2: userId });
      await chat.save();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: userId },
        { sender: userId, recipient: req.user.id }
      ]
    })
      .select('_id sender recipient content type attachments createdAt read readAt edited editedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', '_id name profilePhoto')
      .populate('attachments')
      .lean();

    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: req.user.id, recipient: userId },
        { sender: userId, recipient: req.user.id }
      ]
    });

    const hasMore = totalMessages > skip + messages.length;

    if (messages.length > 0) {
      const unreadMessageIds = messages
        .filter(msg => !msg.read && msg.sender._id.toString() === userId)
        .map(msg => msg._id);

      if (unreadMessageIds.length > 0) {
        Message.updateMany(
          { _id: { $in: unreadMessageIds } },
          { $set: { read: true, readAt: new Date() } }
        ).exec();

        chat.markAsRead(req.user.id);
      }
    }

    const sortedMessages = messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.status(200).json({ messages: sortedMessages, hasMore, totalMessages });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a chat and its messages
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isParticipant =
      chat.user1.toString() === userId || chat.user2.toString() === userId;
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to delete this chat' });
    }

    // Delete related messages
    await Message.deleteMany({
      $or: [
        { sender: chat.user1, recipient: chat.user2 },
        { sender: chat.user2, recipient: chat.user1 }
      ]
    });

    await chat.deleteOne();

    res.status(200).json({ message: 'Chat and related messages deleted' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fetch link preview metadata
exports.getLinkPreview = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ message: 'Invalid URL provided' });
    }

    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text() || '';
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') || '';
    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') || '';

    res.status(200).json({ title, description, image, url });
  } catch (error) {
    console.error('Link preview error:', error.message);
    res.status(500).json({ message: 'Failed to fetch link preview', error: error.message });
  }
};
