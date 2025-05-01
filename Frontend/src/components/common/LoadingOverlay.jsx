// client/src/components/common/LoadingOverlay.jsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingOverlay = ({ 
  loading, 
  children, 
  message = 'Loading...', 
  fullScreen = false,
  overlay = true
}) => {
  if (!loading) return children;
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-50">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {children}
      
      {overlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-10">
          <LoadingSpinner size="md" />
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
