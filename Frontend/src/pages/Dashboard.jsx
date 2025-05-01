  import React, { useState } from 'react';
  import ChatList from '../components/chat/ChatList';
  import UserSearch from '../components/user/UserSearch';
  import { HiPlus, HiSearch, HiUserGroup } from 'react-icons/hi';
  import CreateGroupModal from '../components/groups/CreateGroupModal';

  const Dashboard = () => {
    const [showSearch, setShowSearch] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-semibold">Chats</h1>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              title="Search users"
            >
              <HiSearch className="w-5 h-5 text-gray-700" />
            </button>
            
            <button
              onClick={() => setShowCreateGroup(true)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              title="Create group"
            >
              <HiUserGroup className="w-5 h-5 text-gray-700" />
            </button>
            
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-full bg-primary text-white hover:bg-primary-dark"
              title="New chat"
            >
              <HiPlus className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showSearch ? (
            <UserSearch onClose={() => setShowSearch(false)} />
          ) : (
            <ChatList />
          )}
        </div>
        
        {/* Create group modal */}
        {showCreateGroup && (
          <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
        )}
      </div>
    );
  };

  export default Dashboard;