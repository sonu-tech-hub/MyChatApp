import React, { useState, useEffect, useCallback } from 'react';
import { HiBell, HiX, HiCheck, HiOutlineExclamation } from 'react-icons/hi';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import NotificationBadge from '../common/NotificationBadge';
import api from '../../services/api';

const NotificationItem = ({ notification, onClick }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_message':
        return <HiBell className="w-5 h-5 text-blue-500" />;
      case 'group_invitation':
        return <HiOutlineExclamation className="w-5 h-5 text-green-500" />;
      case 'friend_request':
        return <HiCheck className="w-5 h-5 text-purple-500" />;
      default:
        return <HiBell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <li 
      key={notification._id}
      className={`p-4 hover:bg-gray-50 cursor-pointer ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {notification.sender?.profilePhoto ? (
            <Avatar 
              src={notification.sender.profilePhoto} 
              name={notification.sender.name} 
              size="sm" 
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
              {getNotificationIcon(notification.type)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
          <p className="text-xs text-gray-500 truncate">{notification.body}</p>
          <p className="text-xs text-gray-400 mt-1">
            {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
          </p>
        </div>
      </div>
    </li>
  );
};

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter(n => !n.read).length);
    } catch (error) {
      setError('Error fetching notifications. Please try again later.');
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Toggle notification panel
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    switch (notification.type) {
      case 'new_message':
        navigate(`/chat/${notification.data.senderId}`);
        break;
      case 'group_invitation':
        navigate(`/group/${notification.data.groupId}`);
        break;
      case 'friend_request':
        navigate(`/contacts`);
        break;
      default:
        break;
    }

    markAsRead(notification._id);
    setIsOpen(false);
  };

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/mark-read`);
      setNotifications(prev => prev.map(notif => notif._id === notificationId ? { ...notif, read: true } : notif));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="relative">
      {/* Notification Icon */}
      <button onClick={toggleNotifications} className="relative p-2 rounded-full hover:bg-gray-100">
        <HiBell className="w-6 h-6 text-gray-600" />
        <NotificationBadge count={unreadCount} />
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary-dark">
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <p>{error}</p>
                <button onClick={fetchNotifications} className="mt-2 text-primary hover:text-primary-dark">Retry</button>
              </div>
            ) : notifications.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <NotificationItem key={notification._id} notification={notification} onClick={handleNotificationClick} />
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
