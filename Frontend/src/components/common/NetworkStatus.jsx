// client/src/components/common/NetworkStatus.jsx
import React, { useState, useEffect } from 'react';
import { HiWifi, HiStatusOffline } from 'react-icons/hi';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Handle online status change
    const handleOnline = () => {
      setIsOnline(true);
      setVisible(true);
      setTimeout(() => setVisible(false), 3000);  // Hide after 3 seconds
    };

    // Handle offline status change
    const handleOffline = () => {
      setIsOnline(false);
      setVisible(true);
    };
    
    // Add event listeners for network status change
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup the event listeners when component unmounts
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render if status is hidden
  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 ${
        isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}
      role="alert" // Adds ARIA role for accessibility
      aria-live="assertive" // Ensures the status change is announced by screen readers
    >
      {isOnline ? (
        <>
          <HiWifi className="w-5 h-5" />
          <span>You're back online</span>
        </>
      ) : (
        <>
          <HiStatusOffline className="w-5 h-5" />
          <span>No internet connection</span>
        </>
      )}
    </div>
  );
};

export default NetworkStatus;
