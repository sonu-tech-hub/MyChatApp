// client/src/components/common/LoadingOverlay.jsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingOverlay = ({ 
  loading, 
  children, 
  message = 'Loading...', 
  fullScreen = false,
  overlay = true,
  overlayColor = 'bg-white bg-opacity-75',  // Customizable overlay color
  spinnerSize = 'md', // Customizable spinner size
  textColor = 'text-gray-600'  // Customizable text color
}) => {
  if (!loading) return children;
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-50">
        <LoadingSpinner size={spinnerSize} />
        <p className={`mt-4 ${textColor}`}>{message}</p>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {children}
      
      {overlay && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${overlayColor} z-10`}>
          <LoadingSpinner size={spinnerSize} />
          <p className={`mt-2 text-sm ${textColor}`}>{message}</p>
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
