// client/src/components/common/LoadingScreen.jsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingScreen = ({ message = 'Loading...', spinnerSize = 'xl', messageColor = 'text-gray-600' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <LoadingSpinner size={spinnerSize} />
      <p className={`mt-4 ${messageColor}`}>{message}</p>
    </div>
  );
};

export default LoadingScreen;
