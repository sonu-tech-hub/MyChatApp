const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');
const File = require('../models/File');
const fs = require('fs');
const path = require('path');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description = '', members = [] } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Create group object
    const group = new Group({
      name,
      description,
      creator: req.user.id,
      members: [{
        user: req.user.id,
        role: 'admin',
        canSendMessages: true,
        canAddMembers: true,
        addedBy: req.user.id
      }]
    });

    // Add profile picture if provided
    if (req.file) {
      const file = new File({
        name: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: `/uploads/${req.user.id}/${req.file.filename}`,
        uploader: req.user.id
      });

      await file.save();
      group.avatar = file.url;
    }

    // Add additional members if provided
    if (members.length > 0) {
      const userChecks = members.map(async (memberId) => {
        if (memberId === req.user.id) return; // Skip if member is the creator
        
        const user = await User.findById(memberId);
        if (user) {
          group.members.push({
            user: memberId,
            role: 'member',
            canSendMessages: true,
            canAddMembers: false,
            addedBy: req.user.id
          });
        }
      });

      // Wait for all member checks and additions to complete
      await Promise.all(userChecks);
    }

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', '_id name email profilePhoto')
      .populate('creator', '_id name email profilePhoto');
    
    res.status(201).json({ message: 'Group created successfully', group: populatedGroup });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get all groups for current user
exports.getUserGroups = async (req, res) => {
  try {
    // Find all groups where user is a member
    const groups = await Group.find({
      'members.user': req.user.id
    })
    .populate('members.user', '_id name email profilePhoto')
    .populate('creator', '_id name email profilePhoto')
    .sort({ updatedAt: -1 });
    
    res.status(200).json({ groups });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Find group
    const group = await Group.findById(groupId)
      .populate('members.user', '_id name email profilePhoto')
      .populate('creator', '_id name email profilePhoto');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is a member
    if (!group.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }
    
    res.status(200).json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.isAdmin(req.user.id)) {
      return res.status(403).json({ message: 'Only admins can update the group' });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    // Handle avatar update if file was uploaded
    if (req.file) {
      // Delete old file if an avatar is being updated
      if (group.avatar) {
        const filePath = path.join(__dirname, '..', group.avatar);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Delete the old file
        }
      }

      const file = new File({
        name: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: `/uploads/${req.user.id}/${req.file.filename}`,
        uploader: req.user.id
      });

      await file.save();
      group.avatar = file.url;
    }

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('members.user', '_id name email profilePhoto')
      .populate('creator', '_id name email profilePhoto');

    res.status(200).json({ message: 'Group updated successfully', group: updatedGroup });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Find group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is creator or admin
    if (group.creator.toString() !== req.user.id && !group.isAdmin(req.user.id)) {
      return res.status(403).json({ message: 'Only creator or admins can delete the group' });
    }
    
    // Delete all messages for this group
    await Message.deleteMany({ group: groupId });
    
    // Delete group
    await Group.findByIdAndDelete(groupId);
    
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get group messages
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    
    // Find group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is member
    if (!group.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find messages for this group
    const messages = await Message.find({ group: groupId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', '_id name profilePhoto')
      .populate('attachments')
      .lean();
    
    // Check if there are more messages
    const totalMessages = await Message.countDocuments({ group: groupId });
    const hasMore = totalMessages > skip + messages.length;
    
    // Return messages in ascending order for display
    const sortedMessages = messages.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    res.status(200).json({
      messages: sortedMessages,
      hasMore,
      totalMessages
    });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add members to group
exports.addGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;

    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ message: 'Members array is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const userMember = group.members.find(m => m.user.toString() === req.user.id);
    if (!userMember || !userMember.canAddMembers) {
      return res.status(403).json({ message: 'Not authorized to add members' });
    }

    const memberChecks = members.map(async ({ userId, role = 'member', canSendMessages = true, canAddMembers = false }) => {
      const existingMember = group.members.find(m => m.user.toString() === userId);
      if (existingMember) return; // Skip if user is already a member

      const user = await User.findById(userId);
      if (user) {
        group.members.push({
          user: userId,
          role,
          canSendMessages,
          canAddMembers,
          addedBy: req.user.id
        });
      }
    });

    await Promise.all(memberChecks);

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate('members.user', '_id name email profilePhoto')
      .populate('creator', '_id name email profilePhoto');

    res.status(200).json({ message: 'Members added successfully', group: updatedGroup });
  } catch (error) {
    console.error('Add group members error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove member from group
exports.removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    
    // Find group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if target user is a member
    const memberIndex = group.members.findIndex(m => m.user.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'User is not a member of this group' });
    }
    
    const targetMember = group.members[memberIndex];
    
    // Check if current user can remove this member
    const currentUserMember = group.members.find(m => m.user.toString() === req.user.id);
    
    // Users can remove themselves
    const isSelfRemoval = userId === req.user.id;
    
    // Admins can remove non-admins
    const isAdminRemoval = currentUserMember && 
                          currentUserMember.role === 'admin' && 
                          targetMember.role !== 'admin';
    
    // Creator can remove anyone
    const isCreatorRemoval = group.creator.toString() === req.user.id;
    
    if (!isSelfRemoval && !isAdminRemoval && !isCreatorRemoval) {
      return res.status(403).json({ message: 'Not authorized to remove this member' });
    }
    
    // Cannot remove the creator
    if (userId === group.creator.toString() && !isSelfRemoval) {
      return res.status(403).json({ message: 'Cannot remove the group creator' });
    }
    
    // Remove member
    group.members.splice(memberIndex, 1);
    
    // If creator leaves, assign a new creator
    if (isSelfRemoval && userId === group.creator.toString()) {
        // Find an admin to be the new creator
        const newCreator = group.members.find(m => m.role === 'admin' && m.user.toString() !== userId);
        if (newCreator) {
            group.creator = newCreator.user;
          } else if (group.members.length > 1) {
            // If no admin, pick the first non-leaving member and make them admin
            const newCreatorMember = group.members.find(m => m.user.toString() !== userId);
            group.creator = newCreatorMember.user;
            
           // Update the member's role to admin
        const newCreatorIndex = group.members.findIndex(m => 
            m.user.toString() === newCreatorMember.user.toString()
          );
          group.members[newCreatorIndex].role = 'admin';
          group.members[newCreatorIndex].canAddMembers = true;
        } else {
            // If no members left, delete the group
            await Group.findByIdAndDelete(groupId);
            return res.status(200).json({ message: 'Group deleted as no members remain' });
          }
        }
         // Remove member
    group.members.splice(memberIndex, 1);
    
    
    await group.save();
    
   // Populate for response
   const updatedGroup = await Group.findById(groupId)
   .populate('members.user', '_id name email profilePhoto')
   .populate('creator', '_id name email profilePhoto');
 
 res.status(200).json({ message: 'Member removed successfully', group: updatedGroup });
} catch (error) {
 console.error('Remove group member error:', error);
 res.status(500).json({ message: 'Server error', error: error.message });
}
};

// Update member role
exports.updateMemberRole = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { role, canSendMessages, canAddMembers } = req.body;
    
    // Find group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if current user is admin or creator
    const isAdmin = group.isAdmin(req.user.id);
    const isCreator = group.creator.toString() === req.user.id;
    
    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to update member roles' });
    }
    
    // Find member
    const memberIndex = group.members.findIndex(m => m.user.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'User is not a member of this group' });
    }
    
    // Only creator can change admin roles
    if (group.members[memberIndex].role === 'admin' && !isCreator) {
      return res.status(403).json({ message: 'Only the creator can modify admin roles' });
    }
    
    // Update member
    if (role) group.members[memberIndex].role = role;
    if (canSendMessages !== undefined) group.members[memberIndex].canSendMessages = canSendMessages;
    if (canAddMembers !== undefined) group.members[memberIndex].canAddMembers = canAddMembers;
    
    await group.save();
    
    // Populate for response
    const updatedGroup = await Group.findById(groupId)
      .populate('members.user', '_id name email profilePhoto')
      .populate('creator', '_id name email profilePhoto');
    
    res.status(200).json({ message: 'Member updated successfully', group: updatedGroup });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Start a group call
exports.startGroupCall = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { callType = 'audio' } = req.body;
    
    // Find group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is member
    if (!group.isMember(req.user.id)) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }
    
    // Generate a unique call ID
    const callId = `group-${groupId}-${Date.now()}`;
    
    res.status(200).json({ callId, groupId, callType });
  } catch (error) {
    console.error('Start group call error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};