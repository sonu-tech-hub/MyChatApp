import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getChatHistory, sendMessage, sendFileMessage, markMessagesAsRead, setupMessageListeners } from '../../services/chatService';
import { useCallContext } from '../../context/CallContext';
import Avatar from '../common/Avatar';
import MessageInput from './MessageInput';
import MessageItem from './MessageItem';
import LoadingSpinner from '../common/LoadingSpinner';
import ChatHeader from './ChatHeader';
import { onEvent } from '../../services/socketService';

const ChatWindow = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { initiateCall } = useCallContext();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadingMoreRef = useRef(null);

  // Fetch other user details and initial messages
  useEffect(() => {
    const fetchUserAndMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch user details
        const { data: userData } = await api.get(`/users/${userId}`);
        setOtherUser(userData.user);
        
        // Fetch initial messages
        const messagesData = await getChatHistory(userId, 1, 30);
        setMessages(messagesData.messages);
        setHasMore(messagesData.hasMore);
        setPage(2); // Set next page to 2
        
        // Mark incoming messages as read
        const unreadMessages = messagesData.messages
          .filter(msg => !msg.read && msg.sender._id !== user._id)
          .map(msg => msg._id);
        
        if (unreadMessages.length > 0) {
          await markMessagesAsRead(unreadMessages); // Await if async
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setError('Failed to load conversation. Please try again.');
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchUserAndMessages();
    }
    
    return () => {
      // Cleanup
    };
  }, [userId, user._id]);

  // Setup message listeners
  useEffect(() => {
    // Handle new messages
    const onNewMessage = (message) => {
      // Only process messages from this conversation
      if (message.sender._id === userId || message.recipient === userId) {
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
        
        // Mark message as read if it's incoming
        if (message.sender._id === userId) {
          markMessagesAsRead([message._id]);
        }
      }
    };
    
    // Handle sent message confirmation
    const onMessageSent = (message) => {
      setMessages(prevMessages => {
        // Replace temporary message with confirmed one
        const updatedMessages = prevMessages.map(msg => 
          msg._id === message._id || msg.tempId === message._id ? message : msg
        );
        
        // If message wasn't replaced, add it
        if (!updatedMessages.some(msg => msg._id === message._id)) {
          updatedMessages.push(message);
        }
        
        // Sort by timestamp
        return updatedMessages.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
      });
    };
    
    // Handle message deletion
    const onMessageDeleted = ({ messageId }) => {
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== messageId)
      );
    };
    
    // Handle message editing
    const onMessageEdited = ({ messageId, newContent, editedAt }) => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { ...msg, content: newContent, editedAt, edited: true } 
            : msg
        )
      );
    };
    
    // Handle read receipts
    const onMessagesRead = ({ reader, messageIds }) => {
      // Only update if the other user read our messages
      if (reader === userId) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            messageIds.includes(msg._id) 
              ? { ...msg, read: true, readAt: new Date() } 
              : msg
          )
        );
      }
    };
    
    // Handle typing indicators
    const onUserTyping = ({ userId: typingUserId }) => {
      if (typingUserId === userId) {
        setIsTyping(true);
        
        // Clear previous timer if exists
        if (typingTimer) {
          clearTimeout(typingTimer);
        }
        
        // Set a new timer to clear typing indicator after 3 seconds
        const timer = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
        
        setTypingTimer(timer);
      }
    };
    
    // Handle stop typing
    const onUserStoppedTyping = ({ userId: typingUserId }) => {
      if (typingUserId === userId) {
        setIsTyping(false);
        
        // Clear typing timer if exists
        if (typingTimer) {
          clearTimeout(typingTimer);
          setTypingTimer(null);
        }
      }
    };
    
    // Set up message listeners
    const removeMessageListeners = setupMessageListeners({
      onNewMessage,
      onMessageSent,
      onMessageDeleted,
      onMessageEdited,
      onMessagesRead,
      onUserTyping,
      onUserStoppedTyping
    });
    
    // Listen for user status
    const removeUserStatusListener = onEvent('userStatus', ({ userId: statusUserId, status }) => {
      if (statusUserId === userId) {
        setIsOnline(status === 'online');
      }
    });
    
    // Check if user is online initially
    const removeOnlineUsersListener = onEvent('onlineUsers', (userIds) => {
      setIsOnline(userIds.includes(userId));
    });
    
    return () => {
      // Cleanup all listeners
      removeMessageListeners();
      removeUserStatusListener();
      removeOnlineUsersListener();
      
      // Clear typing timer if exists
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [userId, user._id, typingTimer]);
  
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
        if (entries[0].isIntersecting && hasMore && !isLoading) { // Avoid triggering while loading
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
      const messagesData = await getChatHistory(userId, page, 30);
      
      // Update state
      setMessages(prevMessages => {
        // Merge and deduplicate messages
        const newMessages = [...messagesData.messages, ...prevMessages];
        const uniqueMessages = Array.from(
          new Map(newMessages.map(msg => [msg._id, msg])).values()
        );
        
        // Sort by timestamp and then by ID for stable ordering
        return uniqueMessages.sort((a, b) => {
          const dateComparison = new Date(a.createdAt) - new Date(b.createdAt);
          if (dateComparison !== 0) return dateComparison;
          // Secondary sort by ID to maintain stable order for messages with same timestamp
          return a._id.localeCompare(b._id);
        });
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send a text message
  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    
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
      createdAt: new Date().toISOString(),
      read: false,
      sending: true
    };
    
    // Add temporary message to UI
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // Send message to server
    sendMessage(userId, text);
  };
  
  // Send a file message
  const handleFileUpload = async (file) => {
    try {
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
        attachments: [{
          name: file.name,
          size: file.size,
          type: file.type,
          uploading: true
        }],
        createdAt: new Date().toISOString(),
        read: false,
        sending: true
      };
      
      // Add temporary message to UI
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Upload file and send message
      await sendFileMessage(userId, file);

    } catch (error) {
      console.error('Error uploading file:', error);
      // Show error status for the message
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.tempId === tempId // Use the pre-created tempId
            ? { ...msg, error: true, sending: false } 
            : msg
        )
      );
    }
  };
  
    // Initiate a call
    const handleCall = () => {
      initiateCall(userId);
      navigate(`/calls/${userId}`);
    };
  
    // Render loading state
    if (isLoading) {
      return <LoadingSpinner />;
    }
  
    // Render error state
    if (error) {
      return (
        <div className="chat-error">
          <p>{error}</p>
        </div>
      );
    }
  
    return (
      <div className="chat-window">
        {/* Chat Header */}
        <ChatHeader
          user={otherUser}
          isOnline={isOnline}
          onCall={handleCall}
        />
  
        {/* Messages Container */}
        <div
          className="messages-container"
          ref={messagesContainerRef}
          onScroll={loadMoreMessages}
        >
          <div className="messages">
            {messages.map((message) => (
              <MessageItem
                key={message._id}
                message={message}
                currentUser={user}
                otherUser={otherUser}
              />
            ))}
            
            {/* Loading more indicator */}
            {isLoading && (
              <div className="loading-more" ref={loadingMoreRef}>
                <LoadingSpinner />
              </div>
            )}
          </div>
  
          {/* Message Input */}
          <MessageInput
            onSend={handleSendMessage}
            onFileUpload={handleFileUpload}
            isTyping={isTyping}
          />
        </div>
  
        {/* Scroll to the bottom of the chat */}
        <div ref={messagesEndRef} />
      </div>
    );
  };
  
  export default ChatWindow;
  