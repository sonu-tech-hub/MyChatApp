import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns'; // Enhanced time formatting
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { initializeSocket, onEvent } from '../services/socketService';


const ChatPage = () => {
  const { userId } = useParams();
  const { user } = useAuth(); // Assuming user data contains the current user's info
  const socketInitialized = useRef(false);

  const navigate = useNavigate();
  console.log('User ID:', userId); // Debugging line to check the userId
  console.log('User:', user);
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null); // To scroll to the bottom when a new message is sent
  
  useEffect(() => {
    // Simulating loading messages (you would replace this with API call)
    const timer = setTimeout(() => {
      setLoading(false);
      setMessages([
        { id: 1, text: 'Hello there!', sender: 'other', timestamp: new Date() },
        { id: 2, text: 'Hi! How are you?', sender: 'self', timestamp: new Date() }
      ]);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [userId]);
  
  // Scroll to bottom when new message is sent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
    const setupSocket = async () => {
      if (!user || !user._id || socketInitialized.current) return;
  
      try {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
        await initializeSocket(socketUrl);
        socketInitialized.current = true;
  
        console.log("Socket initialized for user:", user._id);
  
        const removeCallOffer = onEvent("callOffer", (data) => {
          console.log("Received callOffer:", data);
        });
  
        const removeCallAccepted = onEvent("callAccepted", (data) => {
          console.log("Call accepted:", data);
        });
  
        // Clean up listeners on unmount
        return () => {
          removeCallOffer();
          removeCallAccepted();
          socketInitialized.current = false;
        };
      } catch (err) {
        console.error("Socket initialization error:", err);
      }
    };
  
    setupSocket();
  }, [user]);
  console.log('User ID from URL:', userId);
console.log('Logged in user ID:', user?._id);

  console.log('User:', user);  
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        text: inputMessage,
        sender: 'self',
        timestamp: new Date()
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInputMessage('');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* Chat header */}
      <div className="bg-white p-4 border-b flex items-center">
        <button
          onClick={() => navigate('/')}
          className="mr-2 p-2 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex items-center">
          <div className="relative">
            <Avatar
              name={user?.name || 'User Name'} // Dynamically use current user's name
              size="md"
              avatarUrl={user?.avatar} // Dynamically use avatar URL
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div className="ml-3">
            <p className="font-medium">{user?.name || 'User Name'}</p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex mb-4 ${message.sender === 'self' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender !== 'self' && (
              <Avatar
                name="User Name"
                size="sm"
                className="mr-2 flex-shrink-0"
                avatarUrl={user?.avatar} // Assuming the other user has an avatar
              />
            )}
            <div
              className={`px-4 py-2 rounded-lg max-w-xs ${
                message.sender === 'self'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p>{message.text}</p>
              <p className={`text-xs mt-1 ${message.sender === 'self' ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        {/* Scroll to bottom of the messages */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
        <div className="flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;
