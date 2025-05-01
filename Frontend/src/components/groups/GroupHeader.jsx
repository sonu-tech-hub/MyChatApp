// client/src/components/groups/GroupHeader.jsx
import React from 'react';
import { HiChevronLeft, HiUsers, HiInformationCircle } from 'react-icons/hi';
import Avatar from '../common/Avatar';

const GroupHeader = ({ group, onBack, onViewDetails }) => {
  // Count online members
  const onlineCount = group.members.filter(member => 
    member.user.status === 'online'
  ).length;
  
  return (
    <div className="bg-white border-b p-3 flex items-center">
      <button 
        onClick={onBack}
        className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-500 mr-1"
      >
        <HiChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex items-center flex-1">
        <Avatar 
          src={group.avatar} 
          name={group.name} 
          size="md" 
        />
        
        <div className="ml-3">
        <h3 className="font-medium text-gray-900">{group.name}</h3>
          <p className="text-xs text-gray-500 flex items-center">
            <HiUsers className="w-3 h-3 mr-1" />
            {group.members.length} members • {onlineCount} online
          </p>
        </div>
      </div>
      
      <button 
        onClick={onViewDetails}
        className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
        title="Group details"
      >
        <HiInformationCircle className="w-5 h-5" />
      </button>
    </div>
  );
};

export default GroupHeader;