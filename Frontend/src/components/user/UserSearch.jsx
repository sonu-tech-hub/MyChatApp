import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { HiX, HiArrowLeft } from 'react-icons/hi';
import LoadingSpinner from '../common/LoadingSpinner';
import Avatar from '../common/Avatar';
import SearchInput from '../common/SearchInput';

const UserSearch = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  // Search for users when searchTerm changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data } = await api.get(`/users/search?query=${encodeURIComponent(searchTerm)}`);
        setSearchResults(data.users);
      } catch (error) {
        console.error('Error searching users:', error);
        setError('Failed to search users');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce search to avoid too many requests
    const timeoutId = setTimeout(searchUsers, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);
  
  // Handle input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle user selection
  const handleUserSelect = (userId) => {
    navigate(`/chat/${userId}`);
  };
  
  // Clear search results
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b flex items-center">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 mr-2"
        >
          <HiArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        
        <div className="flex-1">
          <SearchInput 
            placeholder="Search for users..."
            value={searchTerm}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            {error}
          </div>
        ) : searchResults.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {searchResults.map(user => (
              <li 
                key={user._id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleUserSelect(user._id)}
              >
                <div className="flex items-center">
                  <Avatar src={user.profilePhoto} name={user.name} size="md" />
                  
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">
                      {user.email}
                      {user.phone && ` • ${user.phone}`}
                    </p>
                  </div>
                  
                  {user.status === 'online' && (
                    <div className="ml-auto">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : searchTerm.length >= 2 ? (
          <div className="text-center text-gray-500 p-4">
            No users found
          </div>
        ) : (
          <div className="text-center text-gray-500 p-4">
            Search for users by name, email, or phone number
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;