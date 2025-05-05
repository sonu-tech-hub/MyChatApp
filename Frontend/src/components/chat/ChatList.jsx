import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { getUserChats } from "../../services/chatService";
import { onEvent } from "../../services/socketService";
import Avatar from "../common/Avatar";
import SearchInput from "../common/SearchInput";
import LoadingSpinner from "../common/LoadingSpinner";

const ChatList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Fetch chats on component mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        const chatData = await getUserChats();
        setChats(chatData);
        setFilteredChats(chatData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setError("Failed to load chats. Please try again.");
        setIsLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Filter chats based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter((chat) =>
        chat.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchTerm, chats]);

  // Listen for online users updates
  useEffect(() => {
    const removeOnlineUsersListener = onEvent("onlineUsers", (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    const removeUserStatusListener = onEvent(
      "userStatus",
      ({ userId, status }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (status === "online") {
            updated.add(userId);
          } else {
            updated.delete(userId);
          }
          return updated;
        });
      }
    );

    // New message listener to update chat list
    const removeNewMessageListener = onEvent("newMessage", (message) => {
      // ✅ Validate the message shape
      if (
        !message ||
        typeof message !== "object" ||
        !message.sender ||
        typeof message.sender._id !== "string" ||
        typeof message.sender.name !== "string" ||
        typeof message.content !== "string"
      ) {
        console.warn("Ignored malformed message:", message);
        return;
      }

      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        const chatIndex = updatedChats.findIndex(
          (chat) => chat.user && chat.user._id === message.sender._id
        );

        if (chatIndex !== -1) {
          // Update existing chat
          const updatedChat = { ...updatedChats[chatIndex] };
          updatedChat.lastMessage = {
            _id: message._id,
            content: message.content,
            type: message.type,
            createdAt: message.createdAt,
            unread: true,
          };
          updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
          updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(updatedChat);
        } else {
          // New chat entry
          const newChat = {
            _id: Date.now().toString(),
            user: {
              _id: message.sender._id,
              name: message.sender.name,
              profilePhoto: message.sender.profilePhoto,
            },
            lastMessage: {
              _id: message._id,
              content: message.content,
              type: message.type,
              createdAt: message.createdAt,
              unread: true,
            },
            unreadCount: 1,
          };
          updatedChats.unshift(newChat);
        }

        return updatedChats;
      });
    });

    // Mark messages as read listener
    const removeMessagesReadListener = onEvent(
      "messagesRead",
      ({ reader, messageIds }) => {
        if (reader !== user._id) {
          setChats((prevChats) => {
            return prevChats.map((chat) => {
              if (
                chat.lastMessage &&
                messageIds.includes(chat.lastMessage._id)
              ) {
                return {
                  ...chat,
                  lastMessage: {
                    ...chat.lastMessage,
                    unread: false,
                  },
                };
              }
              return chat;
            });
          });
        }
      }
    );

    return () => {
      removeOnlineUsersListener();
      removeUserStatusListener();
      removeNewMessageListener();
      removeMessagesReadListener();
    };
  }, [user._id]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle chat selection
  const handleChatSelect = (userId) => {
    navigate(`/chat/${userId}`);
  };

  // Format last message preview
  const formatLastMessage = (lastMessage) => {
    if (!lastMessage) return "No messages yet";

    switch (lastMessage.type) {
      case "text":
        return lastMessage.content.length > 30
          ? `${lastMessage.content.substring(0, 30)}...`
          : lastMessage.content;
      case "image":
        return "📷 Photo";
      case "video":
        return "🎥 Video";
      case "file":
        return "📎 File";
      default:
        return "New message";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

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
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <SearchInput
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
            {searchTerm ? (
              <p>No conversations found matching "{searchTerm}"</p>
            ) : (
              <>
                <p className="mb-2">No conversations yet</p>
                <p className="text-sm text-center">
                  Start chatting with someone to begin a conversation
                </p>
              </>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredChats
              .filter((chat) => chat?.user?._id) // Skip malformed chats
              .map((chat) => {
                const otherUser = chat.user;
                const isOnline = onlineUsers.has(otherUser._id);

                return (
                  <li
                    key={chat._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleChatSelect(otherUser._id)}
                  >
                    <div className="flex items-center p-4 relative">
                      <div className="relative">
                        <Avatar
                          src={otherUser.profilePhoto}
                          name={otherUser.name}
                          size="md"
                        />
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="text-base font-medium text-gray-900 truncate">
                            {otherUser.name}
                          </h3>
                          {chat.lastMessage && chat.lastMessage.createdAt && (
                            <span className="text-xs text-gray-500">
                              {format(
                                new Date(chat.lastMessage.createdAt),
                                "MMM dd"
                              )}
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <p
                            className={`text-sm ${
                              chat.lastMessage?.unread
                                ? "text-gray-900 font-medium"
                                : "text-gray-500"
                            } truncate`}
                          >
                            {formatLastMessage(chat.lastMessage)}
                          </p>

                          {chat.unreadCount > 0 && (
                            <span className="bg-primary text-white text-xs font-medium px-2 py-1 rounded-full">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatList;
