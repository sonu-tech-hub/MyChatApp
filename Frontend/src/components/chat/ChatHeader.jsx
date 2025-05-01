// client/src/components/chat/ChatHeader.jsx
import React from 'react';
import { HiChevronLeft, HiPhone, HiVideoCamera } from 'react-icons/hi';
import Avatar from '../common/Avatar';

const ChatHeader = ({ user, isOnline, onBack, onAudioCall, onVideoCall }) => {
  return (
    <div className="bg-white border-b p-3 flex items-center">
      <button 
        onClick={onBack}
        className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-500 mr-1"
      >
        <HiChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex items-center flex-1">
        <div className="relative">
          <Avatar 
            src={user?.profilePhoto} 
            name={user?.name} 
            size="md" 
          />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        
        <div className="ml-3">
          <h3 className="font-medium text-gray-900">{user?.name}</h3>
          <p className="text-xs text-gray-500">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={onAudioCall}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          title="Audio call"
        >
          <HiPhone className="w-5 h-5" />
        </button>
        
        <button 
          onClick={onVideoCall}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          title="Video call"
        >
          <HiVideoCamera className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;