import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ChatPage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  
  useEffect(() => {
    // Simulating loading messages
    const timer = setTimeout(() => {
      setLoading(false);
      setMessages([
        { id: 1, text: 'Hello there!', sender: 'other', timestamp: new Date() },
        { id: 2, text: 'Hi! How are you?', sender: 'self', timestamp: new Date() }
      ]);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [userId]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        text: inputMessage,
        sender: 'self',
        timestamp: new Date()
      };
      setMessages([...messages, newMessage]);
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
              name="User Name"
              size="md"
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div className="ml-3">
            <p className="font-medium">User Name</p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex mb-4 ${message.sender === 'self' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender !== 'self' && (
              <Avatar
                name="User Name"
                size="sm"
                className="mr-2 flex-shrink-0"
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
                {format(message.timestamp, 'h:mm a')}
              </p>
            </div>
          </div>
        ))}
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