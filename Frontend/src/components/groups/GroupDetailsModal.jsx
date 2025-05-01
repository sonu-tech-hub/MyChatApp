// client/src/components/groups/GroupDetailsModal.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  HiX, 
  HiCamera, 
  HiPencil, 
  HiTrash, 
  HiUserAdd, 
  HiUserRemove,
  HiLogout
} from 'react-icons/hi';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../services/api';
import { updateGroup, deleteGroup, removeGroupMember, addGroupMembers } from '../../services/groupService';
import AddMembersModal from './AddMembersModal';

const GroupDetailsModal = ({ group, onClose, setGroup }) => {
  const [tab, setTab] = useState('info'); // 'info', 'members'
  const [isEditing, setIsEditing] = useState(false);
  const [groupData, setGroupData] = useState({
    name: group.name,
    description: group.description || '',
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(group.avatar);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Check user permissions
  const isAdmin = group.members.some(
    m => m.user._id === user._id && m.role === 'admin'
  );
  const isCreator = group.creator._id === user._id;
  const canManageGroup = isAdmin || isCreator;
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setGroupData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle avatar click
  const handleAvatarClick = () => {
    if (canManageGroup) {
      fileInputRef.current.click();
    }
  };
  
  // Handle avatar change
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type.startsWith('image/')) {
        setAvatar(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
          setAvatarPreview(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select an image file');
      }
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Cancel editing - revert to original data
      setGroupData({
        name: group.name,
        description: group.description || '',
      });
      setAvatarPreview(group.avatar);
      setAvatar(null);
    }
    
    setIsEditing(!isEditing);
  };
  
  // Save group changes
  const handleSaveChanges = async () => {
    if (!groupData.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('name', groupData.name);
      formData.append('description', groupData.description);
      
      if (avatar) {
        formData.append('avatar', avatar);
      }
      
      // Update group
      const updatedGroup = await updateGroup(group._id, formData);
      
      // Update local state
      setGroup(updatedGroup);
      
      // Exit edit mode
      setIsEditing(false);
      toast.success('Group updated successfully');
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Failed to update group');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete group
  const handleDeleteGroup = async () => {
    try {
      setIsLoading(true);
      
      await deleteGroup(group._id);
      
      toast.success('Group deleted successfully');
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  // Leave group
  const handleLeaveGroup = async () => {
    try {
      setIsLoading(true);
      
      await removeGroupMember(group._id, user._id);
      
      toast.success(`You left ${group.name}`);
      onClose();
      navigate('/');
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove member
  const handleRemoveMember = async (memberId) => {
    try {
      if (!canManageGroup) {
        toast.error('You don\'t have permission to remove members');
        return;
      }
      
      // Cannot remove yourself through this method
      if (memberId === user._id) {
        toast.error('Use the "Leave Group" button to leave the group');
        return;
      }
      
      // Cannot remove the creator unless you are the creator
      const memberToRemove = group.members.find(m => m.user._id === memberId);
      if (memberToRemove.role === 'admin' && !isCreator) {
        toast.error('Only the group creator can remove admins');
        return;
      }
      
      setIsLoading(true);
      
      const updatedGroup = await removeGroupMember(group._id, memberId);
      
      // Update local state
      setGroup(updatedGroup);
      
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle adding new members
  const handleMembersAdded = (updatedGroup) => {
    setGroup(updatedGroup);
    setShowAddMembers(false);
    toast.success('Members added successfully');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-full md:h-auto md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">Group Details</h2>
            
            {/* Tabs */}
            <div className="flex space-x-2">
              <button 
                onClick={() => setTab('info')}
                className={`px-3 py-1 rounded-md text-sm ${
                  tab === 'info' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Info
              </button>
              <button 
                onClick={() => setTab('members')}
                className={`px-3 py-1 rounded-md text-sm ${
                  tab === 'members' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Members ({group.members.length})
              </button>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <HiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'info' ? (
            // Group Info Tab
            <div className="space-y-4">
              {/* Group Avatar */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div 
                    onClick={handleAvatarClick}
                    className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center cursor-pointer ${
                      avatarPreview ? '' : 'bg-gray-200'
                    } ${canManageGroup ? 'hover:opacity-80' : ''}`}
                  >
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Group avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-2xl font-bold text-gray-400">
                        {group.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {canManageGroup && (
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg"
                      onClick={handleAvatarClick}
                    >
                      <HiCamera className="w-5 h-5" />
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>
              
              {/* Group Info */}
              {isEditing ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={groupData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter group name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={groupData.description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter group description"
                      rows="3"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={toggleEditMode}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center ${
                        isLoading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" color="white" />
                          <span className="ml-2">Saving...</span>
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium flex justify-between items-center">
                      {group.name}
                      {canManageGroup && (
                        <button
                          onClick={toggleEditMode}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                          title="Edit group"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                      )}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Created by {group.creator.name}
                    </p>
                  </div>
                  
                  {group.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Description</h4>
                      <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                        {group.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Actions</h4>
                    
                    {/* Group Actions */}
                    <div className="space-y-2">
                      {/* Add Members Button */}
                      {canManageGroup && (
                        <button
                          onClick={() => setShowAddMembers(true)}
                          className="w-full flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-left"
                        >
                          <HiUserAdd className="w-5 h-5 text-green-600 mr-2" />
                          <span>Add Members</span>
                        </button>
                      )}
                      
                      {/* Leave Group Button */}
                      {!isCreator && (
                        <button
                          onClick={handleLeaveGroup}
                          className="w-full flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-left"
                          disabled={isLoading}
                        >
                          <HiLogout className="w-5 h-5 text-yellow-600 mr-2" />
                          <span>Leave Group</span>
                        </button>
                      )}
                      
                      {/* Delete Group Button */}
                      {canManageGroup && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-left text-red-600"
                          disabled={isLoading}
                        >
                          <HiTrash className="w-5 h-5 mr-2" />
                          <span>Delete Group</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Members Tab
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Group Members</h3>
                
                {canManageGroup && (
                  <button
                    onClick={() => setShowAddMembers(true)}
                    className="flex items-center text-primary hover:text-primary-dark"
                  >
                    <HiUserAdd className="w-5 h-5 mr-1" />
                    <span>Add</span>
                  </button>
                )}
              </div>
              
              <ul className="divide-y divide-gray-200">
                {group.members.map(member => (
                  <li key={member.user._id} className="py-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Avatar 
                          src={member.user.profilePhoto} 
                          name={member.user.name} 
                          size="sm" 
                        />
                        
                        <div className="ml-3">
                          <p className="text-sm font-medium">
                            {member.user.name}
                            {member.user._id === user._id && ' (You)'}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                              member.user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></span>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            {member.user._id === group.creator._id && ' • Creator'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      {canManageGroup && 
                       member.user._id !== user._id && 
                       (isCreator || member.role !== 'admin') && (
                        <button
                          onClick={() => handleRemoveMember(member.user._id)}
                          className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                          title="Remove member"
                          disabled={isLoading}
                        >
                          <HiUserRemove className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Members Modal */}
      {showAddMembers && (
        <AddMembersModal 
          groupId={group._id}
          existingMembers={group.members.map(m => m.user._id)}
          onClose={() => setShowAddMembers(false)}
          onMembersAdded={handleMembersAdded}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold mb-4 text-red-600">Delete Group</h3>
            <p className="mb-6">
              Are you sure you want to delete this group? This action cannot be undone and all 
              messages will be permanently deleted.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetailsModal;