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
      if (message.group === groupId) {
        setMessages(prevMessages => {
          const exists = prevMessages.some(msg => msg._id === message._id);
          if (exists) return prevMessages;

          const updatedMessages = [...prevMessages, message];

          return updatedMessages.sort((a, b) =>
            new Date(a.createdAt) - new Date(b.createdAt)
          );
        });

        if (typingUsers[message.sender._id]) {
          setTypingUsers(prev => {
            const updated = { ...prev };
            delete updated[message.sender._id];
            return updated;
          });
        }
      }
    };

    // Setup listeners
    const removeGroupListeners = setupGroupListeners({
      onNewGroupMessage,
      // Add other listeners here
    });

    return () => {
      removeGroupListeners();
    };
  }, [groupId, user._id, group, typingUsers]);

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
      const { scrollHeight, scrollTop } = messagesContainerRef.current;
      const messagesData = await getGroupMessages(groupId, page, 30);

      setMessages(prevMessages => {
        const newMessages = [...messagesData.messages, ...prevMessages];
        const uniqueMessages = Array.from(
          new Map(newMessages.map(msg => [msg._id, msg])).values()
        );
        return uniqueMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      });

      setHasMore(messagesData.hasMore);
      setPage(prevPage => prevPage + 1);

      setTimeout(() => {
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newScrollHeight - scrollHeight + scrollTop;
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

    const currentMember = group.members.find(m => m.user._id === user._id);
    if (!currentMember.canSendMessages) {
      toast.error('You do not have permission to send messages in this group');
      return;
    }

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

    setMessages(prevMessages => [...prevMessages, tempMessage]);

    sendGroupMessage(groupId, text);
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
          onViewDetails={() => setShowDetails(!showDetails)}
        />
      )}

      {/* Messages container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <p className="text-center text-gray-500">{format(new Date(date), 'MMMM dd, yyyy')}</p>
              {msgs.map((msg) => (
                <MessageItem key={msg._id} message={msg} />
              ))}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {formatTypingText() && (
          <div className="text-gray-500 italic p-2">{formatTypingText()}</div>
        )}

        {/* End of messages */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
      />

      {/* Group details modal */}
      {showDetails && group && <GroupDetailsModal group={group} onClose={() => setShowDetails(false)} />}
    </div>
  );
};

export default GroupChat;
