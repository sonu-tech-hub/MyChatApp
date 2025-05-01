// client/src/components/common/LoadingScreen.jsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );
};

export default LoadingScreen;