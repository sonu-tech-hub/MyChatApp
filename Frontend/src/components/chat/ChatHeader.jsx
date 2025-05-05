// client/src/components/chat/ChatHeader.jsx
import React from 'react';
import { HiChevronLeft, HiPhone, HiVideoCamera } from 'react-icons/hi';
import Avatar from '../common/Avatar';

const ChatHeader = ({ user, isOnline, onBack, onAudioCall, onVideoCall }) => {
  return (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center flex-1 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary mr-2"
          aria-label="Go back"
        >
          <HiChevronLeft className="w-5 h-5" />
        </button>

        <div className="relative">
          <Avatar
            src={user?.profilePhoto}
            name={user?.name}
            size="md"
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="ml-3 overflow-hidden">
          <h3 className="font-medium text-gray-900 truncate">{user?.name || 'Unknown User'}</h3>
          <p className="text-xs text-gray-500 truncate">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-2">
        <button
          onClick={onAudioCall}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
          title="Audio call"
          aria-label="Start audio call"
        >
          <HiPhone className="w-5 h-5" />
        </button>

        <button
          onClick={onVideoCall}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
          title="Video call"
          aria-label="Start video call"
        >
          <HiVideoCamera className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
