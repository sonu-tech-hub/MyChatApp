const Group = require('../models/Group'); // Assuming you have a Group model
const User = require('../models/User');
const NotificationService = require('../services/notifications/notificationService');

const handleGroupEvents = (socket, io, onlineUsers) => {
  const userId = socket.user._id.toString();
  
  // Handle creating a group
  socket.on('createGroup', async (data) => {
    try {
      const { groupName, members } = data;

      // Ensure at least one member is included (usually the creator)
      if (!members || members.length === 0) {
        members = [userId]; // Add the creator as the first member
      }

      // Create the group
      const newGroup = new Group({
        name: groupName,
        members,
        createdBy: userId,
        createdAt: new Date(),
      });

      // Save the group to the database
      await newGroup.save();

      // Notify group members about the group creation
      members.forEach(async (memberId) => {
        if (onlineUsers.has(memberId)) {
          io.to(onlineUsers.get(memberId)).emit('groupCreated', newGroup);
        } else {
          const member = await User.findById(memberId);
          await NotificationService.sendPushNotification(memberId, {
            title: 'New Group Created',
            body: `${userId === memberId ? 'You' : 'Someone'} created a group: ${groupName}`,
            data: {
              type: 'group',
              groupId: newGroup._id,
            },
          });
        }
      });

      // Notify the creator
      socket.emit('groupCreated', newGroup);

    } catch (error) {
      console.error('Create group error:', error);
      socket.emit('error', { message: 'Failed to create group', error: error.message });
    }
  });

  // Handle adding members to a group
  socket.on('addToGroup', async (data) => {
    try {
      const { groupId, newMembers } = data;

      // Fetch the group
      const group = await Group.findById(groupId);
      if (!group) {
        return socket.emit('error', { message: 'Group not found' });
      }

      // Add new members to the group
      group.members.push(...newMembers);
      await group.save();

      // Notify the new members
      newMembers.forEach(async (memberId) => {
        if (onlineUsers.has(memberId)) {
          io.to(onlineUsers.get(memberId)).emit('addedToGroup', group);
        } else {
          const member = await User.findById(memberId);
          await NotificationService.sendPushNotification(memberId, {
            title: 'Added to Group',
            body: `You have been added to the group: ${group.name}`,
            data: {
              type: 'group',
              groupId: group._id,
            },
          });
        }
      });

      // Notify the group about the new members
      socket.emit('groupUpdated', group);

    } catch (error) {
      console.error('Add to group error:', error);
      socket.emit('error', { message: 'Failed to add members to group', error: error.message });
    }
  });

  // Handle sending a message to a group
  socket.on('sendGroupMessage', async (data) => {
    try {
      const { groupId, messageContent } = data;

      // Fetch the group
      const group = await Group.findById(groupId);
      if (!group) {
        return socket.emit('error', { message: 'Group not found' });
      }

      // Create a new group message (assuming Message model has a group field)
      const newMessage = new Message({
        sender: userId,
        group: groupId,
        content: messageContent,
        createdAt: new Date(),
      });

      // Save the message to the database
      const savedMessage = await newMessage.save();

      // Notify all group members about the new message
      group.members.forEach(async (memberId) => {
        if (onlineUsers.has(memberId)) {
          io.to(onlineUsers.get(memberId)).emit('newGroupMessage', savedMessage);
        } else {
          const member = await User.findById(memberId);
          await NotificationService.sendPushNotification(memberId, {
            title: `New message in ${group.name}`,
            body: messageContent.substring(0, 100),
            data: {
              type: 'group_message',
              messageId: savedMessage._id,
              groupId: group._id,
            },
          });
        }
      });

      // Confirm message sent to sender
      socket.emit('groupMessageSent', savedMessage);

    } catch (error) {
      console.error('Send group message error:', error);
      socket.emit('error', { message: 'Failed to send message', error: error.message });
    }
  });
};

module.exports = { handleGroupEvents };
