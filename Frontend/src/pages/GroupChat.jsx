// client/src/pages/GroupChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { 
  getGroupById, 
  getGroupMessages, 
  sendGroupMessage, 
  sendGroupFileMessage, 
  setupGroupListeners 
} from '../services/groupService';
import Avatar from '../components/common/Avatar';
import MessageInput from '../components/chat/MessageInput';
import MessageItem from '../components/chat/MessageItem';
import LoadingSpinner from '../components/common/LoadingSpinner';
import GroupHeader from '../components/groups/GroupHeader';
import GroupDetailsModal from '../components/groups/GroupDetailsModal';

const GroupChat = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadingMoreRef = useRef(null);
  
  // Fetch group data and initial messages
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch group details
        const groupData = await getGroupById(groupId);
        setGroup(groupData);
        
        // Fetch initial messages
        const messagesData = await getGroupMessages(groupId, 1, 30);
        setMessages(messagesData.messages);
        setHasMore(messagesData.hasMore);
        setPage(2); // Set next page to 2
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching group data:', error);
        setError('Failed to load group. Please try again.');
        setIsLoading(false);
      }
    };
    
    if (groupId) {
      fetchGroupData();
    }
    
    return () => {
      // Cleanup
    };
  }, [groupId]);
  
  // Setup group message listeners
  useEffect(() => {
    // Handle new group messages
    const onNewGroupMessage = (message) => {
      // Only process messages from this group
      if (message.group === groupId) {
        setMessages(prevMessages => {
          // Check if message already exists
          const exists = prevMessages.some(msg => msg._id === message._id);
          if (exists) return prevMessages;
          
          // Add new message
          const updatedMessages = [...prevMessages, message];
          
          // Sort by timestamp
          return updatedMessages.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
        });
        
        // Clear typing indicator for this user
        if (typingUsers[message.sender._id]) {
          setTypingUsers(prev => {
            const updated = { ...prev };
            delete updated[message.sender._id];
            return updated;
          });
        }
      }
    };
    
    // Handle group message deletion
    const onGroupMessageDeleted = ({ messageId }) => {
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== messageId)
      );
    };
    
    // Handle group message editing
    const onGroupMessageEdited = ({ messageId, newContent, editedAt }) => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { ...msg, content: newContent, editedAt, edited: true } 
            : msg
        )
      );
    };
    
    // Handle typing indicators
    const onGroupUserTyping = ({ userId, groupId: typingGroupId }) => {
      if (typingGroupId === groupId && userId !== user._id) {
        // Get user details
        const memberObj = group?.members.find(m => m.user._id === userId);
        const typingUser = memberObj ? memberObj.user : null;
        
        if (typingUser) {
          setTypingUsers(prev => ({
            ...prev,
            [userId]: {
              user: typingUser,
              timestamp: Date.now()
            }
          }));
          
          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const updated = { ...prev };
              if (updated[userId] && Date.now() - updated[userId].timestamp >= 3000) {
                delete updated[userId];
              }
              return updated;
            });
          }, 3000);
        }
      }
    };
    
    // Handle stop typing
    const onGroupUserStoppedTyping = ({ userId, groupId: typingGroupId }) => {
      if (typingGroupId === groupId && userId !== user._id) {
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    };
    
    // Handle group member changes
    const onGroupMemberAdded = (updatedGroup) => {
      if (updatedGroup._id === groupId) {
        setGroup(updatedGroup);
        toast.success(`New member added to ${updatedGroup.name}`);
      }
    };
    
    const onGroupMemberRemoved = (updatedGroup) => {
      if (updatedGroup._id === groupId) {
        setGroup(updatedGroup);
        
        // Check if current user was removed
        const isCurrentUserMember = updatedGroup.members.some(
          m => m.user._id === user._id
        );
        
        if (!isCurrentUserMember) {
          toast.error(`You were removed from ${updatedGroup.name}`);
          navigate('/');
        } else {
          toast.info(`A member was removed from ${updatedGroup.name}`);
        }
      }
    };
    
    // Handle group updates
    const onGroupUpdated = (updatedGroup) => {
      if (updatedGroup._id === groupId) {
        setGroup(updatedGroup);
        toast.success(`Group information updated`);
      }
    };
    
    // Set up group listeners
    const removeGroupListeners = setupGroupListeners({
      onNewGroupMessage,
      onGroupMessageDeleted,
      onGroupMessageEdited,
      onGroupUserTyping,
      onGroupUserStoppedTyping,
      onGroupMemberAdded,
      onGroupMemberRemoved,
      onGroupUpdated
    });
    
    return () => {
      // Cleanup listeners
      removeGroupListeners();
    };
  }, [groupId, user._id, group]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Setup intersection observer for loading more messages
  useEffect(() => {
    if (!hasMore || isLoading) return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreMessages();
        }
      },
      { threshold: 0.5 }
    );
    
    if (loadingMoreRef.current) {
      observer.observe(loadingMoreRef.current);
    }
    
    return () => {
      if (loadingMoreRef.current) {
        observer.unobserve(loadingMoreRef.current);
      }
    };
  }, [hasMore, isLoading]);
  
  // Load more messages when scrolling up
  const loadMoreMessages = async () => {
    if (!hasMore || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Get scroll position before loading more
      const { scrollHeight, scrollTop } = messagesContainerRef.current;
      
      // Fetch more messages
      const messagesData = await getGroupMessages(groupId, page, 30);
      
      // Update state
      setMessages(prevMessages => {
        // Merge and deduplicate messages
        const newMessages = [...messagesData.messages, ...prevMessages];
        const uniqueMessages = Array.from(
          new Map(newMessages.map(msg => [msg._id, msg])).values()
        );
        
        // Sort by timestamp
        return uniqueMessages.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
      
      setHasMore(messagesData.hasMore);
      setPage(prevPage => prevPage + 1);
      
      // Restore scroll position after new messages are rendered
      setTimeout(() => {
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = 
            newScrollHeight - scrollHeight + scrollTop;
        }
      }, 0);
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Failed to load more messages');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send a text message
  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    
    // Check if user can send messages
    const currentMember = group.members.find(m => m.user._id === user._id);
    if (!currentMember.canSendMessages) {
      toast.error('You do not have permission to send messages in this group');
      return;
    }
    
    // Create temporary message
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      _id: tempId,
      tempId,
      content: text,
      type: 'text',
      sender: {
        _id: user._id,
        name: user.name,
        profilePhoto: user.profilePhoto
      },
      group: groupId,
      createdAt: new Date().toISOString(),
      sending: true
    };
    
    // Add temporary message to UI
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // Send message to server
    sendGroupMessage(groupId, text);
  };
  
  // Send a file message
  const handleFileUpload = async (file) => {
    try {
      // Check if user can send messages
      const currentMember = group.members.find(m => m.user._id === user._id);
      if (!currentMember.canSendMessages) {
        toast.error('You do not have permission to send messages in this group');
        return;
      }
      
      // Create temporary message
      const tempId = `temp-${Date.now()}`;
      const fileType = file.type.startsWith('image/') ? 'image' : 'file';
      
      const tempMessage = {
        _id: tempId,
        tempId,
        content: '',
        type: fileType,
        sender: {
          _id: user._id,
          name: user.name,
          profilePhoto: user.profilePhoto
        },
        group: groupId,
        attachments: [{
          name: file.name,
          size: file.size,
          type: file.type,
          uploading: true
        }],
        createdAt: new Date().toISOString(),
        sending: true
      };
      
      // Add temporary message to UI
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Upload file and send message
      await sendGroupFileMessage(groupId, file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      
      // Show error status for the message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.tempId === `temp-${Date.now()}` 
            ? { ...msg, error: true, sending: false } 
            : msg
        )
      );
    }
  };
  
  // Toggle group details modal
  const toggleGroupDetails = () => {
    setShowDetails(!showDetails);
  };
  
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(message);
    return groups;
  }, {});
  
  // Format typing users text
  const formatTypingText = () => {
    const typingUsersList = Object.values(typingUsers);
    
    if (typingUsersList.length === 0) return null;
    
    if (typingUsersList.length === 1) {
      return `${typingUsersList[0].user.name} is typing...`;
    } else if (typingUsersList.length === 2) {
      return `${typingUsersList[0].user.name} and ${typingUsersList[1].user.name} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          className="px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Group header */}
      {group && (
        <GroupHeader 
          group={group}
          onBack={() => navigate('/')}
          onViewDetails={toggleGroupDetails}
        />
      )}
      
      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Loading indicator at top for loading more messages */}
        {hasMore && (
          <div ref={loadingMoreRef} className="text-center py-2">
            {isLoading && <LoadingSpinner size="sm" />}
          </div>
        )}
        
        {isLoading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Render message groups by date */}
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 bg-gray-200 rounded-full text-xs text-gray-600">
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </span>
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-3">
                  {dateMessages.map(message => (
                    <MessageItem 
                      key={message._id || message.tempId}
                      message={message}
                      isOwnMessage={message.sender._id === user._id}
                      otherUser={message.sender._id !== user._id ? message.sender : null}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
        
        {/* Typing indicator */}
        {Object.keys(typingUsers).length > 0 && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="flex -space-x-2">
              {Object.values(typingUsers).slice(0, 3).map(({ user: typingUser }) => (
                <Avatar 
                  key={typingUser._id}
                  src={typingUser.profilePhoto} 
                  name={typingUser.name} 
                  size="xs" 
                  className="border-2 border-white"
                />
              ))}
            </div>
            <span className="text-sm italic">{formatTypingText()}</span>
          </div>
        )}
        
        {/* Dummy div for scrolling to end */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      {group && (
        <div className="border-t p-4 bg-white">
          <MessageInput 
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            receiverId={groupId}
            isDisabled={!group.members.find(m => m.user._id === user._id)?.canSendMessages}
          />
          
          {!group.members.find(m => m.user._id === user._id)?.canSendMessages && (
            <p className="text-xs text-red-500 mt-1 text-center">
              You do not have permission to send messages in this group
            </p>
          )}
        </div>
      )}
      
      {/* Group details modal */}
      {showDetails && group && (
        <GroupDetailsModal 
          group={group}
          onClose={() => setShowDetails(false)}
          setGroup={setGroup}
        />
      )}
    </div>
  );
};

export default GroupChat;