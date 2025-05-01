// client/src/components/common/NetworkStatus.jsx
import React, { useState, useEffect } from 'react';
import { HiWifi, HiStatusOffline } from 'react-icons/hi';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Update network status
    const handleOnline = () => {
      setIsOnline(true);
      setVisible(true);
      setTimeout(() => setVisible(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setVisible(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!visible) return null;
  
  return (
    <div className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 ${
      isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
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
