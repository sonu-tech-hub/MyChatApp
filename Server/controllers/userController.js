const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const [user, currentUser] = await Promise.all([
      User.findById(userId).select('-password -refreshToken'),
      User.findById(req.user.id)
    ]);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (currentUser.hasBlockedUser(user._id) || user.hasBlockedUser(currentUser._id)) {
      return res.status(403).json({ message: 'Cannot view this user' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, address } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (req.file) updateData.profilePhoto = req.file.path;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updateData }, { new: true })
      .select('-password -refreshToken');

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    console.log('req.query:', req.query);

    if (!query) return res.status(400).json({ message: 'Search query is required' });

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const blockedIds = currentUser.blockedUsers.map(u => u.user.toString());

    const users = await User.find({
      _id: { $ne: req.user.id, $nin: blockedIds },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    }).select('_id name email phone profilePhoto status');

    res.status(200).json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add contact
exports.addContact = async (req, res) => {
  try {
    const { userId, nickname } = req.body;
    console.log('req.body:', req.body);

    const contactUser = await User.findById(userId);
    if (!contactUser) return res.status(404).json({ message: 'User not found' });

    const currentUser = await User.findById(req.user.id);
    await currentUser.addContact(userId, nickname);

    res.status(200).json({ message: 'Contact added successfully' });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove contact
exports.removeContact = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user.id);
    await currentUser.removeContact(userId);

    res.status(200).json({ message: 'Contact removed successfully' });
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get contacts
exports.getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('contacts.user', '_id name email phone profilePhoto status');

    res.status(200).json({ contacts: user.contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userToBlock = await User.findById(userId);
    if (!userToBlock) return res.status(404).json({ message: 'User not found' });

    const currentUser = await User.findById(req.user.id);
    await currentUser.blockUser(userId);

    res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const currentUser = await User.findById(req.user.id);
    await currentUser.unblockUser(userId);

    res.status(200).json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('blockedUsers.user', '_id name email phone profilePhoto');

    res.status(200).json({ blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
