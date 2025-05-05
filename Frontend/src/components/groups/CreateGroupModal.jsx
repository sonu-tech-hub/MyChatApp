import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HiX, HiCamera, HiPlus, HiSearch, HiUser } from 'react-icons/hi';
import api from '../../services/api';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import SearchInput from '../common/SearchInput';

const CreateGroupModal = ({ onClose }) => {
  const [step, setStep] = useState(1); // 1: Group info, 2: Add members
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  // Handle input change for group info
  const handleChange = (e) => {
    const { name, value } = e.target;
    setGroupData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle avatar upload
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };
  
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.type.startsWith('image/')) {
        setIsUploadingAvatar(true);
        setAvatar(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
          setAvatarPreview(event.target.result);
          setIsUploadingAvatar(false);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select a valid image file');
      }
    }
  };
  
  // Handle search for members
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    searchUsers(e.target.value);
  };
  
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const { data } = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      
      // Filter out users already added as members
      const filteredResults = data.users.filter(
        user => !members.some(member => member._id === user._id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Add member to group
  const handleAddMember = (user) => {
    setMembers(prev => [...prev, user]);
    setSearchResults(prev => prev.filter(u => u._id !== user._id));
    setSearchTerm('');
  };
  
  // Remove member from group
  const handleRemoveMember = (userId) => {
    setMembers(prev => prev.filter(member => member._id !== userId));
  };
  
  // Move to next step
  const handleNextStep = () => {
    if (!groupData.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    
    if (groupData.name.length < 3) {
      toast.error('Group name must be at least 3 characters long');
      return;
    }
    
    setStep(2);
  };
  
  // Create group
  const handleCreateGroup = async () => {
    if (members.length === 0) {
      toast.error('Please add at least one member');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('name', groupData.name);
      formData.append('description', groupData.description);
      
      // Add members
      members.forEach(member => {
        formData.append('members[]', member._id);
      });
      
      // Add avatar if exists
      if (avatar) {
        formData.append('avatar', avatar);
      }
      
      // Create group
      const { data } = await api.post('/groups', formData);
      
      toast.success('Group created successfully');
      
      // Navigate to the new group
      navigate(`/group/${data.group._id}`);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" role="dialog" aria-labelledby="create-group-modal-title" aria-hidden="false">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold" id="create-group-modal-title">
            {step === 1 ? 'Create New Group' : 'Add Group Members'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <HiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {step === 1 ? (
            // Step 1: Group Info
            <div className="space-y-4">
              {/* Group Avatar */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div 
                    onClick={handleAvatarClick}
                    className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center cursor-pointer ${avatarPreview ? '' : 'bg-gray-200'}`}
                    aria-label="Select group avatar"
                  >
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Group avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <HiUser className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg"
                    onClick={handleAvatarClick}
                    aria-label="Change avatar"
                  >
                    <HiCamera className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                    accept="image/*"
                    aria-label="Choose avatar image"
                  />
                </div>
              </div>
              
              {/* Group Name */}
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
              
              {/* Group Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
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
            </div>
          ) : (
            // Step 2: Add Members
            <div className="space-y-4">
              {/* Search Users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Members
                </label>
                <SearchInput 
                  placeholder="Search users by name or email"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              
              {/* Search Results */}
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {searchResults.map(user => (
                      <li 
                        key={user._id}
                        className="p-2 hover:bg-gray-50 flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          <Avatar src={user.profilePhoto} name={user.name} size="sm" />
                          <span className="ml-2 text-sm">{user.name}</span>
                        </div>
                        <button
                          onClick={() => handleAddMember(user)}
                          className="p-1 rounded-full hover:bg-gray-200"
                          aria-label={`Add ${user.name} to group`}
                        >
                          <HiPlus className="w-5 h-5 text-primary" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : searchTerm.length >= 2 ? (
                <p className="text-sm text-gray-500 text-center py-2">
                  No users found
                </p>
              ) : null}
              
              {/* Selected Members */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selected Members ({members.length})
                </label>
                {members.length > 0 ? (
                  <div className="border rounded-md p-2 max-h-36 overflow-y-auto">
                    <ul className="space-y-2">
                      {members.map(member => (
                        <li 
                          key={member._id}
                          className="flex justify-between items-center p-1 bg-gray-50 rounded"
                        >
                          <div className="flex items-center">
                            <Avatar src={member.profilePhoto} name={member.name} size="sm" />
                            <span className="ml-2 text-sm">{member.name}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(member._id)}
                            className="p-1 rounded-full hover:bg-gray-200"
                            aria-label={`Remove ${member.name} from group`}
                          >
                            <HiX className="w-4 h-4 text-gray-500" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2 border rounded-md">
                    No members selected
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t flex justify-end space-x-2">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleNextStep}
                className="px-4 py-2 bg-primary text-black rounded-md hover:bg-primary-dark"
                aria-label="Next"
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                aria-label="Back"
              >
                Back
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isLoading}
                className={`px-4 py-2 bg-primary text-black rounded-md hover:bg-primary-dark flex items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                aria-label="Create Group"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span className="ml-2">Creating...</span>
                  </>
                ) : (
                  'Create Group'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
