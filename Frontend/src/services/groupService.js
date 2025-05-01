import api from './api';
import { emitEvent, onEvent } from './socketService';

// Get all groups for current user
export const getUserGroups = async () => {
  try {
    const { data } = await api.get('/groups');
    return data.groups;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};

// Get a specific group by ID
export const getGroupById = async (groupId) => {
  try {
    const { data } = await api.get(`/groups/${groupId}`);
    return data.group;
  } catch (error) {
    console.error('Error fetching group:', error);
    throw error;
  }
};

// Get group messages
export const getGroupMessages = async (groupId, page = 1, limit = 50) => {
  try {
    const { data } = await api.get(`/groups/${groupId}/messages`, {
      params: { page, limit }
    });
    return data;
  } catch (error) {
    console.error('Error fetching group messages:', error);
    throw error;
  }
};

// Create a new group
export const createGroup = async (groupData) => {
  try {
    const formData = new FormData();
    
    // Add group data
    formData.append('name', groupData.name);
    formData.append('description', groupData.description || '');
    
    // Add group avatar if provided
    if (groupData.avatar) {
      formData.append('avatar', groupData.avatar);
    }
    
    // Add members
    if (groupData.members && groupData.members.length > 0) {
      groupData.members.forEach(member => {
        formData.append('members[]', member);
      });
    }
    
    const { data } = await api.post('/groups', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return data.group;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

// Update group information
export const updateGroup = async (groupId, groupData) => {
  try {
    const formData = new FormData();
    
    // Add group data
    if (groupData.name) formData.append('name', groupData.name);
    if (groupData.description !== undefined) formData.append('description', groupData.description);
    
    // Add group avatar if provided
    if (groupData.avatar) {
      formData.append('avatar', groupData.avatar);
    }
    
    const { data } = await api.put(`/groups/${groupId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return data.group;
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
};

// Delete a group
export const deleteGroup = async (groupId) => {
  try {
    await api.delete(`/groups/${groupId}`);
    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

// Add members to a group
export const addGroupMembers = async (groupId, memberIds, roles = {}) => {
  try {
    const { data } = await api.post(`/groups/${groupId}/members`, {
      members: memberIds.map(id => ({
        userId: id,
        role: roles[id] || 'member',
        canSendMessages: true,
        canAddMembers: roles[id] === 'admin' || roles[id] === 'moderator'
      }))
    });
    
    return data.group;
  } catch (error) {
    console.error('Error adding group members:', error);
    throw error;
  }
};

// Remove a member from a group
export const removeGroupMember = async (groupId, memberId) => {
  try {
    const { data } = await api.delete(`/groups/${groupId}/members/${memberId}`);
    return data.group;
  } catch (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
};

// Update a member's role in a group
// Update a member's role in a group
export const updateMemberRole = async (groupId, memberId, role, permissions = {}) => {
    try {
      const { data } = await api.put(`/groups/${groupId}/members/${memberId}`, {
        role,
        ...permissions
      });
      
      return data.group;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  };

  // Send a message to a group
  export const sendGroupMessage = (groupId, content, type = 'text') => {
    emitEvent('sendGroupMessage', {
      groupId,
      content,
      type
    });
  };

  // Send a file message to a group
  export const sendGroupFileMessage = async (groupId, file) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupId', groupId);
      
      // Upload file
      const { data } = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Send message with file attachment
      emitEvent('sendGroupMessage', {
        groupId,
        content: '',
        type: file.type.startsWith('image/') ? 'image' : 'file',
        attachments: [data.fileId]
      });
      
      return data;
    } catch (error) {
      console.error('Error sending group file:', error);
      throw error;
    }
  };

  // Send typing indicator to a group
  export const sendGroupTypingIndicator = (groupId) => {
    emitEvent('typing', { groupId });
  };

  // Send stop typing indicator to a group
  export const sendGroupStopTypingIndicator = (groupId) => {
    emitEvent('stopTyping', { groupId });
  };

  // Set up group event listeners
  export const setupGroupListeners = (callbacks) => {
    const {
      onNewGroupMessage,
      onGroupMessageDeleted,
      onGroupMessageEdited,
      onGroupUserTyping,
      onGroupUserStoppedTyping,
      onGroupMemberAdded,
      onGroupMemberRemoved,
      onGroupUpdated
    } = callbacks;
    
    // Set up event listeners
    const removeListeners = [
      onEvent('newGroupMessage', onNewGroupMessage),
      onEvent('groupMessageDeleted', onGroupMessageDeleted),
      onEvent('groupMessageEdited', onGroupMessageEdited),
      onEvent('groupUserTyping', onGroupUserTyping),
      onEvent('groupUserStoppedTyping', onGroupUserStoppedTyping),
      onEvent('groupMemberAdded', onGroupMemberAdded),
      onEvent('groupMemberRemoved', onGroupMemberRemoved),
      onEvent('groupUpdated', onGroupUpdated)
    ];
    
    // Return a function to remove all listeners
    return () => {
      removeListeners.forEach(removeFn => removeFn());
    };
  };

  // Start a group call
  export const startGroupCall = async (groupId, callType) => {
    try {
      const { data } = await api.post(`/groups/${groupId}/call`, { callType });
      return data.callId;
    } catch (error) {
      console.error('Error starting group call:', error);
      throw error;
    }
  };

  // Join a group call
  export const joinGroupCall = (callId) => {
    emitEvent('joinGroupCall', { callId });
  };

  export default {
    getUserGroups,
    getGroupById,
    getGroupMessages,
    createGroup,
    updateGroup,
    deleteGroup,
    addGroupMembers,
    removeGroupMember,
    updateMemberRole,
    sendGroupMessage,
    sendGroupFileMessage,
    sendGroupTypingIndicator,
    sendGroupStopTypingIndicator,
    setupGroupListeners,
    startGroupCall,
    joinGroupCall
  };
