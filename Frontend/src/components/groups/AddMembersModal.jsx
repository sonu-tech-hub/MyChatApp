import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { HiX, HiPlus, HiUser } from 'react-icons/hi';
import api from '../../services/api';
import { addGroupMembers } from '../../services/groupService';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import SearchInput from '../common/SearchInput';

const AddMembersModal = ({ groupId, existingMembers, onClose, onMembersAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]); // Clear search results if the search term is too short
        return;
      }

      try {
        setIsSearching(true);
        const { data } = await api.get(`/users/search?query=${encodeURIComponent(searchTerm)}`);

        // Filter out existing members and already selected users
        const filteredResults = data.users.filter(
          user => !existingMembers.includes(user._id) &&
            !selectedUsers.some(selected => selected._id === user._id)
        );

        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    };

    // Delay the search to reduce frequent requests
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, existingMembers, selectedUsers]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Select a user
  const handleSelectUser = (user) => {
    setSelectedUsers((prev) => [...prev, user]);
    setSearchResults((prev) => prev.filter(u => u._id !== user._id));
    setSearchTerm('');
  };

  // Remove a selected user
  const handleRemoveUser = (userId) => {
    setSelectedUsers((prev) => prev.filter(user => user._id !== userId));
  };

  // Add members to the group
  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      setIsLoading(true);
      const memberIds = selectedUsers.map(user => user._id);
      const updatedGroup = await addGroupMembers(groupId, { members: memberIds });

      onMembersAdded(updatedGroup);
      toast.success('Members added successfully!');
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error('Failed to add members');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Add Members</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <HiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Users
              </label>
              <SearchInput
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search users"
              />
            </div>

            {/* Search Results */}
            {isSearching ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-40 overflow-y-auto border rounded-md">
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
                        onClick={() => handleSelectUser(user)}
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

            {/* Selected Users */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selected Users ({selectedUsers.length})
              </label>
              {selectedUsers.length > 0 ? (
                <div className="border rounded-md p-2 max-h-36 overflow-y-auto">
                  <ul className="space-y-2">
                    {selectedUsers.map(user => (
                      <li
                        key={user._id}
                        className="flex justify-between items-center p-1 bg-gray-50 rounded"
                      >
                        <div className="flex items-center">
                          <Avatar src={user.profilePhoto} name={user.name} size="sm" />
                          <span className="ml-2 text-sm">{user.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveUser(user._id)}
                          className="p-1 rounded-full hover:bg-gray-200"
                          aria-label={`Remove ${user.name} from selected users`}
                        >
                          <HiX className="w-4 h-4 text-gray-500" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2 border rounded-md">
                  No users selected
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            aria-label="Cancel adding members"
          >
            Cancel
          </button>
          <button
            onClick={handleAddMembers}
            disabled={selectedUsers.length === 0 || isLoading}
            className={`px-4 py-2 bg-primary text-black rounded-md hover:bg-primary-dark flex items-center ${
              selectedUsers.length === 0 || isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            aria-label="Add selected members to group"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span className="ml-2">Adding...</span>
              </>
            ) : (
              'Add to Group'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMembersModal;
